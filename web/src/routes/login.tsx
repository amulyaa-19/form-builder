import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowRight, CheckCircle2, Circle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/login')({
  component: LoginScreen,
})

function LoginScreen() {
  const navigate = useNavigate({ from: '/login' })

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Request State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8787/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        // STRICT REQUIREMENT: Allows the browser to accept the HttpOnly cookie
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          data.error || 'Invalid email or password. Please check your credentials and try again.',
        )
      }

      toast.success('Welcome back!')

      // Navigate to the dashboard
      navigate({ to: '/surveys' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--ink))]">
      <div className="absolute left-1/4 top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full bg-[hsl(var(--brand))] opacity-20 blur-[150px]" />
      <div className="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-[hsl(var(--brand))] opacity-10 blur-[130px]" />

      <div className="relative z-10 flex w-full max-w-7xl px-4 sm:px-6 lg:px-12">
        {/* Left Side: Brand Art */}
        <div className="hidden w-1/2 flex-col justify-center pr-12 lg:flex">
          <div className="max-w-lg">
            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--brand))] shadow-[0_0_20px_rgba(108,99,255,0.4)]">
              <span className="font-mono text-xl font-bold text-white">S.</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Build surveys people actually finish.
            </h1>
            <p className="mt-4 text-lg text-white/60">
              A focused, high-conversion alternative to standard forms.
            </p>

            <div className="mt-14 w-full max-w-sm -rotate-2 rounded-xl border border-white/5 bg-white/5 p-6 shadow-card backdrop-blur-sm transition-transform duration-500 hover:rotate-0">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[hsl(var(--brand))] text-xs font-bold text-white">
                  1
                </div>
                <div className="h-4 w-3/4 rounded-full bg-white/20" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/10 p-3 shadow-[0_0_15px_rgba(108,99,255,0.15)]">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--brand))]" />
                  <div className="h-3 w-1/2 rounded-full bg-white/60" />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
                  <Circle className="h-5 w-5 text-white/20" />
                  <div className="h-3 w-2/3 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Immersive Dark Form */}
        <div className="flex w-full items-center justify-center lg:w-1/2">
          <div className="w-full max-w-[420px] rounded-[16px] border border-white/10 bg-[hsl(var(--ink))]/60 p-8 shadow-raised backdrop-blur-[12px] sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">Sign in</h2>
              <p className="mt-2 text-sm text-white/70">
                Enter your email and password to access your dashboard.
              </p>
            </div>

            {/* Inline Error State per UX Rules */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-md border border-[hsl(var(--danger))]/30 bg-[hsl(var(--danger))]/10 p-3 text-sm text-[hsl(var(--danger))]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium text-white/90">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/40 transition-colors focus:border-[hsl(var(--brand))] focus:bg-white/10"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-medium text-white/90">
                    Password
                  </Label>
                  <a
                    href="/login"
                    className="text-sm font-medium text-[hsl(var(--brand))] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/40 pr-10 transition-colors focus:border-[hsl(var(--brand))] focus:bg-white/10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="group mt-2 h-11 w-full text-base font-medium transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-white/70">
              Don't have an account?{' '}
              <a href="/login" className="font-medium text-[hsl(var(--brand))] hover:underline">
                Sign up
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
