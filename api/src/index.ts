import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { sign } from 'hono/jwt'
import surveys from './routes/survey'

// This matches the types we generated with cf-typegen
type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

type Variables = {
  user: { id: string; email: string }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS Configuration
app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

// 2. Health Check (Required by starter)
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// 3. Auth Routes
const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/login', async (c) => {
  const { email } = await c.req.json()

  if (!email?.email.includes('@')) {
    return c.json({ error: 'Valid email required' }, 400)
  }

  // Upsert user: If they don't exist, create them.
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO users (id, email) VALUES (?, ?) 
     ON CONFLICT(email) DO NOTHING`,
  )
    .bind(id, email)
    .run()

  // Fetch the user (whether just created or existing)
  const user = await c.env.DB.prepare(`SELECT id, email FROM users WHERE email = ?`)
    .bind(email)
    .first<{ id: string; email: string }>()

  if (!user) return c.json({ error: 'Failed to create user' }, 500)

  // Sign a JWT
  const payload = {
    id: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  }
  const token = await sign(payload, c.env.JWT_SECRET)

  // Set as HttpOnly cookie so the frontend JS can't read it (mitigates XSS)
  setCookie(c, 'auth_token', token, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24,
  })

  return c.json({ user })
})

auth.post('/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ success: true })
})

app.route('/api/auth', auth)
app.route('/api/surveys', surveys)

export default app
