import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { LogOut, LayoutDashboard, PlusCircle, FileText, Loader2, Calendar, ArrowRight, Activity } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/surveys/')({
  component: DashboardScreen,
})

interface Survey {
  id: string
  title: string
  slug: string
  created_at: string
}

function DashboardScreen() {
  const navigate = useNavigate()

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    async function fetchSurveys() {
      try {
        const response = await fetch('http://localhost:8787/api/surveys', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setSurveys(data.surveys || [])
        } else if (response.status === 401) {
          navigate({ to: '/login' })
        }
      } catch (error) {
        toast.error('Failed to load surveys')
      } finally {
        setIsPageLoading(false)
      }
    }
    fetchSurveys()
  }, [navigate])

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsCreating(true)

    try {
      const response = await fetch('http://localhost:8787/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to create survey')

      const data = await response.json()
      toast.success('Survey created successfully!')
      setIsOpen(false)
      setTitle('')

      navigate({ to: `/surveys/${data.id}/edit` as any })
    } catch (error) {
      toast.error('Something went wrong.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleLogout = async () => {
    await fetch('http://localhost:8787/api/auth/logout', { method: 'POST', credentials: 'include' })
    navigate({ to: '/login' })
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden font-sans select-none" style={{ background: '#F7F4EF' }}>

      {/* Sidebar — dark ink panel */}
      <aside
        className="relative z-10 flex w-[220px] flex-col justify-between"
        style={{
          background: '#1C1917',
          boxShadow: '4px 0 24px rgba(28,25,23,0.18)',
        }}
      >
        <div className="p-6">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg font-mono font-bold text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              S.
            </div>
            <span className="font-bold tracking-tight text-lg" style={{ color: '#FDFBF8' }}>
              SurveyBuilder
            </span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#FDFBF8',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <LayoutDashboard className="h-4 w-4" style={{ color: '#FDFBF8' }} />
              My Surveys
            </a>
          </nav>
        </div>

        <div className="p-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FDFBF8')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="relative z-10 flex-1 overflow-y-auto p-10">

        {/* Page header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
              My surveys
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: '#A8A29E' }}>
              Manage and monitor your live questionnaires.
            </p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg px-5 h-10 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: '#1C1917' }}
              >
                <PlusCircle className="h-4 w-4" />
                New survey
              </button>
            </DialogTrigger>

            <DialogContent
              className="sm:max-w-[425px]"
              style={{
                background: '#FDFBF8',
                border: '1px solid #E2D9CE',
                boxShadow: '0 20px 60px rgba(28,25,23,0.12)',
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
                  Create a new survey
                </DialogTitle>
                <DialogDescription className="text-sm mt-1" style={{ color: '#A8A29E' }}>
                  Give your survey a name. You can change this later.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSurvey} className="mt-4">
                <div className="space-y-4 py-2">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="title"
                      className="text-sm font-medium"
                      style={{ color: '#44403C' }}
                    >
                      Survey title
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Q3 Customer Feedback"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 transition-all"
                      style={{
                        background: '#F7F4EF',
                        border: '1px solid #E2D9CE',
                        color: '#1C1917',
                      }}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <button
                    type="submit"
                    disabled={isCreating || !title.trim()}
                    className="inline-flex items-center justify-center w-full sm:w-auto h-11 px-6 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ background: '#1C1917' }}
                  >
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create survey'}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* States */}
        {isPageLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#1C1917' }} />
          </div>
        ) : surveys.length > 0 ? (

          /* Survey grid */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="group relative flex flex-col justify-between rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: '#FDFBF8',
                  border: '1px solid #E2D9CE',
                  boxShadow: '0 1px 4px rgba(28,25,23,0.05)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(28,25,23,0.09)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = '#C9BFB3'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(28,25,23,0.05)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = '#E2D9CE'
                }}
              >
                {/* Card top */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3
                      className="font-bold text-base tracking-tight line-clamp-1"
                      style={{ color: '#1C1917' }}
                    >
                      {survey.title}
                    </h3>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0"
                      style={{ background: '#E7F5EC', color: '#166534' }}
                    >
                      <Activity className="h-3 w-3" />
                      Active
                    </span>
                  </div>

                  {/* Metrics */}
                  <div
                    className="mt-5 grid grid-cols-2 gap-3 border-y py-4"
                    style={{ borderColor: '#E2D9CE' }}
                  >
                    <div
                      className="rounded-lg px-3 py-2.5"
                      style={{ background: '#F7F4EF' }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: '#A8A29E' }}
                      >
                        Responses
                      </p>
                      <p
                        className="text-xl font-bold mt-1 tracking-tight"
                        style={{ color: '#1C1917' }}
                      >
                        0
                      </p>
                    </div>
                    <div
                      className="rounded-lg px-3 py-2.5"
                      style={{ background: '#F7F4EF' }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: '#A8A29E' }}
                      >
                        Completion
                      </p>
                      <p
                        className="text-xl font-bold mt-1 tracking-tight"
                        style={{ color: '#1C1917' }}
                      >
                        0%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="mt-4 flex items-center justify-between">
                  <div
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: '#A8A29E' }}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(survey.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <Link
                    to={`/surveys/${survey.id}/edit` as any}
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-1.5 duration-200"
                    style={{ color: '#1C1917' }}
                  >
                    Edit survey
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        ) : (

          /* Empty state */
          <div
            className="flex h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center"
            style={{
              borderColor: '#C9BFB3',
              background: '#FDFBF8',
            }}
          >
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ background: '#F2EDE5', border: '1px solid #E2D9CE' }}
            >
              <FileText className="h-6 w-6" style={{ color: '#78716C' }} />
            </div>
            <h2 className="mb-2 text-xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
              No surveys yet
            </h2>
            <p
              className="mb-6 max-w-sm text-sm leading-relaxed"
              style={{ color: '#A8A29E' }}
            >
              You haven't created any surveys. Start building your first one in under two minutes.
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg px-5 h-11 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: '#1C1917' }}
            >
              <PlusCircle className="h-4 w-4" />
              Create your first survey
            </button>
          </div>
        )}
      </main>
    </div>
  )
}