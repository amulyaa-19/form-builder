import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { sign } from 'hono/jwt'
import publicSurveys from './routes/public'
import surveys from './routes/survey'

// This matches the types we generated with cf-typegen
type Bindings = {
  DB: D1Database
  JWT_SECRET?: string // Made optional so the app doesn't crash without a .dev.vars file
}

type Variables = {
  user: { id: string; email: string }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS Configuration
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

// 3. Auth Routes
const auth = new Hono<{ Bindings: Bindings }>()

// --- ZERO-CONFIG EMAIL LOGIN ROUTE ---
auth.post('/login', async (c) => {
  const { email } = await c.req.json()

  // 1. Updated Error Handling: Only check for a valid email
  if (!email?.includes('@')) {
    return c.json({ error: 'A valid email is required' }, 400)
  }

  const db = c.env.DB

  // Use the env variable if it exists, otherwise use a local fallback 
  const secret = c.env.JWT_SECRET || 'local-dev-fallback-secret'

  try {
    // 2. Find the user by email
    const user = await db
      .prepare(`SELECT id, email FROM users WHERE email = ?`)
      .bind(email)
      .first<{ id: string; email: string }>()

    // 3. If they don't exist, create them instantly!
    let userId = user?.id
    if (!userId) {
      userId = crypto.randomUUID()
      await db.prepare(`INSERT INTO users (id, email) VALUES (?, ?)`).bind(userId, email).run()
    }

    // 4. Sign the JWT using the secure ID and Email
    const payload = {
      id: userId,
      email: email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }
    const token = await sign(payload, secret, 'HS256')

    // 5. Set the secure cookie
    setCookie(c, 'auth_token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return c.json({ success: true, user: { id: userId, email: email } })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Failed to process login' }, 500)
  }
})

// --- LOGOUT ROUTE ---
auth.post('/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ success: true })
})

app.route('/api/auth', auth)
app.route('/api/surveys', surveys)
app.route('/api/public', publicSurveys)

export default app
