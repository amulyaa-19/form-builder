// api/src/routes/surveys.ts
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

// We recreate the types here to keep strict typing in this file
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
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = await verify(token, c.env.JWT_SECRET)
    c.set('user', payload as { id: string; email: string })
    await next()
  } catch (_err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// GET /api/surveys -> List all surveys for the logged-in user
surveys.get('/', async (c) => {
  const user = c.get('user')
  const results = await c.env.DB.prepare(
    `SELECT id, title, slug, primary_color, logo_url, created_at 
     FROM surveys WHERE user_id = ? ORDER BY created_at DESC`,
  )
    .bind(user.id)
    .all()

  return c.json({ surveys: results.results })
})

export default surveys
