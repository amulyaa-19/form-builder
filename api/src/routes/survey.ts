import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

type Variables = {
  user: { id: string; email: string }
}

const surveys = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware to protect these routes
surveys.use('*', async (c, next) => {
  const token = getCookie(c, 'auth_token')

  console.log('--- AUTH CHECK ---')
  console.log('Token received:', token ? 'Yes' : 'No')

  if (!token) {
    console.log('Rejection Reason: No cookie found in the request headers.')
    return c.json({ error: 'Unauthorized - No token' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    console.log('Verification: Success for user', payload.email)

    c.set('user', payload as { id: string; email: string })
    await next()
  } catch (err) {
    console.log('Rejection Reason: Verification failed.', err)
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// GET /api/surveys -> List all surveys for the logged-in user with live response counts
surveys.get('/', async (c) => {
  const user = c.get('user')

  try {
    const results = await c.env.DB.prepare(
      `SELECT 
        s.id, 
        s.title, 
        s.slug, 
        s.primary_color, 
        s.logo_url, 
        s.created_at,
        COUNT(r.id) AS response_count
       FROM surveys s
       LEFT JOIN responses r ON r.survey_id = s.id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
    )
      .bind(user.id)
      .all()

    return c.json({ surveys: results.results })
  } catch (error) {
    console.error('Dashboard aggregation query error:', error)
    return c.json({ error: 'Failed to retrieve metrics' }, 500)
  }
})

// POST /api/surveys -> Create a new survey initial entry
surveys.post('/', async (c) => {
  const user = c.get('user')
  const { title } = await c.req.json()

  if (!title) {
    return c.json({ error: 'Survey title is required' }, 400)
  }

  const id = crypto.randomUUID()
  const baseSlug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'survey'
  const slug = `${baseSlug}-${id.slice(0, 6)}`

  try {
    await c.env.DB.prepare(`INSERT INTO surveys (id, user_id, title, slug) VALUES (?, ?, ?, ?)`)
      .bind(id, user.id, title, slug)
      .run()

    return c.json({ id, title, slug, success: true }, 201)
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ error: 'Failed to create survey' }, 500)
  }
})

// GET /api/surveys/:id -> Hydrate and rebuild workspace context on load
surveys.get('/:id', async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  const db = c.env.DB

  try {
    // 1. Fetch parent metadata layout configs and verify ownership
    const survey = await db
      .prepare(
        `SELECT id, title, primary_color, logo_url FROM surveys WHERE id = ? AND user_id = ?`,
      )
      .bind(surveyId, user.id)
      .first()

    if (!survey) {
      return c.json({ error: 'Survey workspace not found or unauthorized' }, 404)
    }

    // 2. Fetch all relational structural question rows
    const { results: questions } = await db
      .prepare(
        `SELECT id, type, prompt, is_required FROM questions WHERE survey_id = ? ORDER BY order_index ASC`,
      )
      .bind(surveyId)
      .all()

    // 3. Fetch all choices mapped to this survey's scope
    const { results: options } = await db
      .prepare(
        `SELECT qo.id, qo.question_id, qo.value 
       FROM question_options qo
       JOIN questions q ON qo.question_id = q.id
       WHERE q.survey_id = ?
       ORDER BY qo.order_index ASC`,
      )
      .bind(surveyId)
      .all()

    // 4. Transform flat relational data models back into unified client layout arrays
    const structuredQuestions = questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      is_required: q.is_required === 1,
      options: options
        .filter((o: any) => o.question_id === q.id)
        .map((o: any) => ({ id: o.id, value: o.value })),
    }))

    return c.json({
      title: survey.title,
      slug: survey.slug,
      primary_color: survey.primary_color,
      logo_url: survey.logo_url,
      questions: structuredQuestions,
    })
  } catch (error) {
    console.error('Workspace fetch error:', error)
    return c.json({ error: 'Failed to build structural workspace data' }, 500)
  }
})

// PUT /api/surveys/:id -> Transactional batch update to save structure and branding
surveys.put('/:id', async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  const { title, primary_color, logo_url, questions } = await c.req.json()
  const db = c.env.DB

  try {
    // Security Guardrail: Explicitly confirm ownership before initializing batch modifications
    const targetSurvey = await db
      .prepare(`SELECT id FROM surveys WHERE id = ? AND user_id = ?`)
      .bind(surveyId, user.id)
      .first()

    if (!targetSurvey) {
      return c.json({ error: 'Unauthorized configuration modification block' }, 403)
    }

    const statements = []

    // 1. Update general branding and metadata configuration on the surveys table
    statements.push(
      db
        .prepare(`UPDATE surveys SET title = ?, primary_color = ?, logo_url = ? WHERE id = ?`)
        .bind(title, primary_color, logo_url, surveyId),
    )

    // 2. Clear old state layout (ON DELETE CASCADE cleanly wipes matching question_options automatically)
    statements.push(db.prepare(`DELETE FROM questions WHERE survey_id = ?`).bind(surveyId))

    // 3. Inject current local snapshot map context sequence
    if (Array.isArray(questions)) {
      questions.forEach((q: any, qIndex: number) => {
        statements.push(
          db
            .prepare(
              `INSERT INTO questions (id, survey_id, type, prompt, order_index, is_required) VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .bind(q.id, surveyId, q.type, q.prompt || '', qIndex, q.is_required ? 1 : 0),
        )

        if (q.type === 'multiple_choice' && q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: any, optIndex: number) => {
            statements.push(
              db
                .prepare(
                  `INSERT INTO question_options (id, question_id, value, order_index) VALUES (?, ?, ?, ?)`,
                )
                .bind(opt.id, q.id, opt.value || '', optIndex),
            )
          })
        }
      })
    }

    // Perform safe, isolated round-trip transaction sequence execution
    await db.batch(statements)

    return c.json({ success: true, message: 'Workspace saved perfectly' })
  } catch (error) {
    console.error('Database batch write failure:', error)
    return c.json({ error: 'Relational data synchronization failure' }, 500)
  }
})
// GET /api/surveys/:id/results -> Formatted exactly for the ResultsView component
surveys.get('/:id/results', async (c) => {
  const user = c.get('user')
  const surveyId = c.req.param('id')
  const db = c.env.DB

  try {
    const surveyCheck = await db
      .prepare(`SELECT id FROM surveys WHERE id = ? AND user_id = ?`)
      .bind(surveyId, user.id)
      .first()

    if (!surveyCheck) return c.json({ error: 'Unauthorized' }, 403)

    // 1. Fetch Master Responses
    const { results: rawResponses } = await db
      .prepare(
        `SELECT id, submitted_at FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC`,
      )
      .bind(surveyId)
      .all()

    // 2. Fetch all answers for this survey
    const { results: rawAnswers } = await db
      .prepare(
        `SELECT a.response_id, a.question_id, a.value 
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE q.survey_id = ?`,
      )
      .bind(surveyId)
      .all()

    // 3. Transform data into the exact shape your ResultsView expects
    const formattedResponses = rawResponses.map((res: any) => {
      // Create a dictionary of { "question_id": "answer_value" }
      const answersDict: Record<string, string> = {}
      rawAnswers
        .filter((ans: any) => ans.response_id === res.id)
        .forEach((ans: any) => {
          answersDict[ans.question_id] = ans.value
        })

      return {
        id: res.id,
        submittedAt: res.submitted_at,
        answers: answersDict,
      }
    })

    return c.json({
      totalResponses: formattedResponses.length,
      lastResponseAt: formattedResponses.length > 0 ? formattedResponses[0]!.submittedAt : null,
      responses: formattedResponses,
    })
  } catch (error) {
    console.error('Results fetch error:', error)
    return c.json({ error: 'Failed to fetch results' }, 500)
  }
})

surveys.get('/api/surveys/:id/results', async (c) => {
  const surveyId = c.req.param('id')
  const db = c.env.DB

  // 1. Fetch all responses for this survey (ordered newest first)
  const { results: responsesRaw } = await db
    .prepare(
      `SELECT id, submitted_at FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC`,
    )
    .bind(surveyId)
    .all()

  const totalResponses = responsesRaw.length
  const lastResponseAt = totalResponses > 0 ? responsesRaw[0]!.submitted_at : null

  if (totalResponses === 0) {
    return c.json({ totalResponses: 0, lastResponseAt: null, responses: [] })
  }

  // 2. Fetch all answers associated with these responses safely
  const { results: answersRaw } = await db
    .prepare(
      `SELECT a.response_id, a.question_id, a.value 
     FROM answers a 
     JOIN responses r ON a.response_id = r.id 
     WHERE r.survey_id = ?`,
    )
    .bind(surveyId)
    .all()

  // 3. Group answers by response_id
  const answersByResponse = answersRaw.reduce((acc: any, curr: any) => {
    if (!acc[curr.response_id]) acc[curr.response_id] = {}
    acc[curr.response_id][curr.question_id] = curr.value
    return acc
  }, {})

  // 4. Format into the requested schema
  const formattedResponses = responsesRaw.map((r: any) => ({
    id: r.id,
    submittedAt: r.submitted_at,
    answers: answersByResponse[r.id] || {},
  }))

  return c.json({
    totalResponses,
    lastResponseAt,
    responses: formattedResponses,
  })
})

export default surveys
