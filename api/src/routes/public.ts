import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const publicSurveys = new Hono<{ Bindings: Bindings }>()

// GET /api/public/surveys/:slug -> Fetch survey structure for respondents via slug
publicSurveys.get('/surveys/:slug', async (c) => {
  const slug = c.req.param('slug')
  const db = c.env.DB

  try {
    // 1. Fetch the survey metadata by public slug
    const survey = await db.prepare(
      `SELECT id, title, primary_color, logo_url FROM surveys WHERE slug = ?`
    )
      .bind(slug)
      .first()

    if (!survey) {
      return c.json({ error: 'Survey not found' }, 404)
    }

    // 2. Fetch all relational questions using the survey's ID
    const { results: questions } = await db.prepare(
      `SELECT id, type, prompt, is_required FROM questions WHERE survey_id = ? ORDER BY order_index ASC`
    )
      .bind(survey.id)
      .all()

    // 3. Fetch options for these specific questions
    const { results: options } = await db.prepare(
      `SELECT qo.id, qo.question_id, qo.value 
       FROM question_options qo
       JOIN questions q ON qo.question_id = q.id
       WHERE q.survey_id = ?
       ORDER BY qo.order_index ASC`
    )
      .bind(survey.id)
      .all()

    // 4. Structure the payload safely for the respondent UI
    const structuredQuestions = questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      is_required: q.is_required === 1,
      options: options
        .filter((o: any) => o.question_id === q.id)
        .map((o: any) => ({ id: o.id, value: o.value }))
    }))

    return c.json({
      id: survey.id,
      title: survey.title,
      primary_color: survey.primary_color,
      logo_url: survey.logo_url,
      questions: structuredQuestions
    })
  } catch (error) {
    console.error('Public survey fetch error:', error)
    return c.json({ error: 'Failed to fetch public survey configuration' }, 500)
  }
})

// POST /api/public/surveys/:id/responses -> Transactional schema capture for incoming answers
publicSurveys.post('/surveys/:id/responses', async (c) => {
  const surveyId = c.req.param('id')
  const { answers } = await c.req.json() // Expects a dictionary shape: { "question_id": "value" }
  const db = c.env.DB

  try {
    const responseId = crypto.randomUUID()
    const statements = []

    // 1. Core Record Entry into responses root log table
    statements.push(
      db.prepare(`INSERT INTO responses (id, survey_id) VALUES (?, ?)`).bind(responseId, surveyId)
    )

    // 2. Loop through parameters and compile atomic relational inserts into answers table
    if (answers && typeof answers === 'object') {
      Object.entries(answers).forEach(([questionId, value]) => {
        // Safe casting value to guarantee database compatibility strings
        const normalizedValue = typeof value === 'string' ? value : JSON.stringify(value)
        
        statements.push(
          db.prepare(
            `INSERT INTO answers (id, response_id, question_id, value) VALUES (?, ?, ?, ?)`
          ).bind(crypto.randomUUID(), responseId, questionId, normalizedValue)
        )
      })
    }

    // 3. Fire all insertions sequentially across a single transactional round-trip payload pool
    await db.batch(statements)

    return c.json({ success: true, responseId })
  } catch (error) {
    console.error('Transactional answer mapping tracking error:', error)
    return c.json({ error: 'Relational structural insertion verification mismatch' }, 500)
  }
})

export default publicSurveys