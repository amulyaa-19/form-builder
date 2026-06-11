import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowRight, CheckCircle2, Circle, Loader2 } from 'lucide-react'
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

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8787/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }), // Only sending email now
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          data.error || 'Failed to authenticate. Please check your email and try again.',
        )
      }

      toast.success('Welcome to your workspace!')
      navigate({ to: '/surveys' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F4EF] text-[#1C1917] font-sans antialiased selection:bg-[#1C1917]/10">
      {/* ── BACKGROUND GLOWS ────────────────────────────────────────────── */}
      <div className="absolute left-[15%] top-1/2 h-150 w-150 -translate-y-1/2 rounded-full bg-white opacity-40 blur-[120px] pointer-events-none" />
      <div className="absolute right-[18%] bottom-[20%] h-105 w-105 rounded-full bg-white opacity-30 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-7xl items-center px-4 sm:px-6 lg:px-12">
        {/* ── LEFT: Brand panel ─────────────────────────────────────────── */}
        <div className="hidden w-1/2 flex-col justify-center pr-16 lg:flex">
          <div className="max-w-lg animate-in fade-in slide-in-from-left-4 duration-700 ease-out">
            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-lg bg-[#1C1917] shadow-sm">
              <span className="font-mono text-xl font-bold text-[#FDFBF8]">S.</span>
            </div>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl text-[#1C1917]">
              Build surveys people actually finish.
            </h1>
            <p className="mt-5 text-lg font-medium text-[#1C1917]/50 leading-relaxed">
              A focused, high-conversion alternative to standard forms. Designed for clarity, built
              for response rates.
            </p>

            {/* ── INTERACTIVE TILTED CARD ───────────────────────────────── */}
            <div className="mt-14 w-full max-w-sm rounded-2xl bg-[#FDFBF8] border border-[#1C1917]/10 p-6 shadow-[0_20px_60px_rgba(28,25,23,0.05)] transition-transform duration-500 hover:rotate-0 -rotate-2">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1C1917]/5 text-xs font-bold text-[#1C1917]/40 font-mono">
                  1
                </div>
                <div className="h-3 w-3/4 rounded-full bg-[#1C1917]/5" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border-2 border-[#1C1917] bg-[#1C1917]/5 p-3 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1C1917]" />
                  <div className="h-2.5 w-1/2 rounded-full bg-[#1C1917]/60" />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#1C1917]/10 bg-transparent p-3">
                  <Circle className="h-5 w-5 shrink-0 text-[#1C1917]/20" />
                  <div className="h-2.5 w-2/3 rounded-full bg-[#1C1917]/10" />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#1C1917]/10 bg-transparent p-3">
                  <Circle className="h-5 w-5 shrink-0 text-[#1C1917]/20" />
                  <div className="h-2.5 w-1/3 rounded-full bg-[#1C1917]/10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Auth form ───────────────────────────────────────────── */}
        <div className="flex w-full items-center justify-center lg:w-1/2">
          <div className="w-full max-w-105 rounded-4xl border border-[#1C1917]/10 bg-[#FDFBF8] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out delay-150">
            {/* Form header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-[#1C1917]">Access Workspace</h2>
              <p className="mt-2 text-sm font-medium text-[#1C1917]/50">
                Enter your email to sign in or create an account instantly. No passwords required.
              </p>
            </div>

            {/* Inline error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[11px] font-bold uppercase tracking-widest text-[#1C1917]/60 font-mono"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reviewer@docodego.com"
                  className="h-12 rounded-xl bg-[#F7F4EF]/50 border-[#1C1917]/10 text-[#1C1917] placeholder:text-[#1C1917]/30 transition-all focus:bg-white focus:border-[#1C1917]/30 focus:ring-0 focus-visible:ring-0 shadow-none"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1C1917] text-[#FDFBF8] text-sm font-bold transition-all hover:bg-[#1C1917]/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="h-4 w-4 opacity-50 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider & Privacy Assurance */}
            <div className="my-8 h-px bg-[#1C1917]/5" />
            <p className="text-center text-[13px] font-medium text-[#1C1917]/40">
              By continuing, you agree to a secure, passwordless experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
