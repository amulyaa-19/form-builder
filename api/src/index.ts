import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { sign } from 'hono/jwt'
import surveys from './routes/survey'
import publicSurveys from './routes/public'

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
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Added both to prevent CORS issues
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

// 3. Auth Routes
const auth = new Hono<{ Bindings: Bindings }>()

// Helper function to hash passwords securely using WebCrypto
async function hashPassword(password: string) {
  const msgBuffer = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// --- SIGNUP ROUTE ---
auth.post('/register', async (c) => {
  const { email, password } = await c.req.json()

  if (!email?.includes('@') || !password) {
    return c.json({ error: 'Valid email and password required' }, 400)
  }

  // Hash the password before saving!
  const hashedPassword = await hashPassword(password)
  const id = crypto.randomUUID()

  try {
    // Note: This assumes your schema.sql has a 'password' column in the users table.
    await c.env.DB.prepare(`INSERT INTO users (id, email, password) VALUES (?, ?, ?)`)
      .bind(id, email, hashedPassword)
      .run()

    return c.json({ success: true, message: 'User created successfully' }, 201)
  } catch (error) {
    // Handle the case where the email already exists
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Email already exists' }, 409)
    }
    return c.json({ error: 'Failed to create user' }, 500)
  } // <--- This closing brace was missing!
})

// --- LOGIN ROUTE ---
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400)
  }

  // 1. Find the user by email
  const user = await c.env.DB.prepare(`SELECT id, email, password FROM users WHERE email = ?`)
    .bind(email)
    .first<{ id: string; email: string; password: string }>()

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // 2. Hash the incoming password and compare it to the database
  const incomingHash = await hashPassword(password)
  if (incomingHash !== user.password) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // 3. Passwords match! Sign the JWT
  const payload = {
    id: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  }
  const token = await sign(payload, c.env.JWT_SECRET, 'HS256')

  // 4. Set the secure cookie
  setCookie(c, 'auth_token', token, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24,
  })

  // Never send the password hash back to the frontend
  return c.json({ user: { id: user.id, email: user.email } })
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
