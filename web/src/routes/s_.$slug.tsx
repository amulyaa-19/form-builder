import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/s_/$slug')({
  component: PublicSurveyView,
})

interface PublicQuestion {
  id: string
  type: 'short_text' | 'multiple_choice' | 'rating'
  prompt: string
  is_required: boolean
  options?: { id: string; value: string }[]
}

interface PublicSurveyData {
  id: string
  title: string
  primary_color: string
  logo_url: string | null
  questions: PublicQuestion[]
}

function PublicSurveyView() {
  const { slug } = Route.useParams()
  const [survey, setSurvey] = useState<PublicSurveyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [answersState, setAnswersState] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // UX Upgrade: Track the actively focused question card
  const [focusedId, setFocusedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPublicSurvey() {
      try {
        const response = await fetch(`http://localhost:8787/api/public/surveys/${slug}`)
        if (!response.ok) throw new Error('Survey could not be retrieved.')
        const data = await response.json()
        setSurvey(data)
      } catch (err: any) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPublicSurvey()
  }, [slug])

  const handleValueChange = (questionId: string, value: string) => {
    setValidationError(null)
    setAnswersState((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!survey) return

    // Front-end validation guard
    for (const q of survey.questions) {
      if (q.is_required && (!answersState[q.id] || answersState[q.id].trim() === '')) {
        setValidationError(
          `Please complete all required fields. ("${q.prompt || 'Untitled Question'}" is missing)`,
        )
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `http://localhost:8787/api/public/surveys/${survey.id}/responses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answersState }),
        },
      )

      if (!response.ok) throw new Error('Failed to record responses.')
      setHasSubmitted(true)
    } catch (err: any) {
      setValidationError(err.message || 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-[#F7F4EF] flex items-center justify-center text-sm font-medium font-sans tracking-tight">
        <Loader2 className="h-5 w-5 animate-spin text-[#1C1917] mr-2" />
        Loading Questionnaire...
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="h-screen bg-[#F7F4EF] flex flex-col items-center justify-center text-center p-6 font-sans">
        <h1 className="text-xl font-bold tracking-tight text-[#1C1917]">Form Unavailable</h1>
        <p className="text-sm text-[#1C1917]/40 mt-1.5 max-w-sm">
          This link may have expired or the slug configuration is invalid.
        </p>
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="h-screen bg-[#F7F4EF] flex flex-col items-center justify-center text-center p-6 font-sans selection:bg-[#1C1917]/10 animate-fade-in">
        <div className="rounded-full h-12 w-12 bg-[#1C1917] text-[#FDFBF8] flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">Submission Complete</h1>
        <p className="text-sm text-[#1C1917]/50 mt-1.5 max-w-xs leading-relaxed">
          Your feedback has been mapped safely. Thank you for your time.
        </p>
      </div>
    )
  }

  // --- Dynamic UX Calculations ---
  const totalQuestions = survey.questions.length
  const answeredCount = survey.questions.filter(
    (q) => answersState[q.id] && answersState[q.id].trim() !== '',
  ).length
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  // A form is submittable if every required question has an answer
  const isSubmitDisabled = survey.questions.some(
    (q) => q.is_required && (!answersState[q.id] || answersState[q.id].trim() === ''),
  )

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1C1917] font-sans antialiased pb-32 selection:bg-[#1C1917]/10">
      {/* 1. The High-ROI Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-[#1C1917]/5">
        <div
          className="h-full bg-[#1C1917]"
          style={{ width: `${progressPercentage}%`, transition: 'width 0.4s ease' }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-20">
        <form onSubmit={handleSubmit} className="w-full space-y-12">
          {/* 2. The Human Header */}
          <div className="flex items-center gap-4 border-b border-[#1C1917]/10 pb-8 mb-8">
            {survey.logo_url && (
              <img
                src={survey.logo_url}
                alt="Logo"
                className="w-10 h-10 rounded object-contain filter grayscale border border-[#1C1917]/10 p-1 bg-white"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1C1917] leading-none">
                {survey.title}
              </h1>
              <p className="text-xs font-semibold text-[#1C1917]/50 mt-2">
                {answeredCount} of {totalQuestions} answered · Takes ~2 min
              </p>
            </div>
          </div>

          {/* Render Form Inputs Loop */}
          <div className="space-y-6">
            {survey.questions.map((q, index) => {
              const hasAnswer = answersState[q.id] && answersState[q.id].trim() !== ''
              const isActive = focusedId === q.id

              // 3. Active Question Elevation Logic
              let cardClasses = 'p-8 bg-[#FDFBF8] rounded-xl space-y-4 transition-all duration-300 '
              if (isActive) {
                cardClasses +=
                  'border-[1.5px] border-[#1C1917] shadow-[4px_4px_0_0_#1C1917] opacity-100 scale-[1.01]'
              } else if (hasAnswer) {
                cardClasses +=
                  'border border-[#1C1917]/10 opacity-70 hover:opacity-100 cursor-pointer'
              } else {
                cardClasses += 'border border-[#1C1917]/10 opacity-100 cursor-pointer'
              }

              return (
                <div
                  key={q.id}
                  className={cardClasses}
                  onClick={() => setFocusedId(q.id)}
                  onFocus={() => setFocusedId(q.id)}
                  tabIndex={0} // Makes the card focusable for accessibility
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono font-bold text-[#1C1917]/40 mt-1">
                      {index + 1}.
                    </span>
                    <label className="font-semibold text-base tracking-tight text-[#1C1917]">
                      {q.prompt || (
                        <span className="italic font-normal text-[#1C1917]/30">
                          Untitled Question
                        </span>
                      )}
                      {q.is_required && (
                        <span
                          className="ml-1 font-bold"
                          style={{ color: survey.primary_color || '#1C1917' }}
                        >
                          *
                        </span>
                      )}
                    </label>
                  </div>

                  {/* A. SHORT TEXT FIELD */}
                  {q.type === 'short_text' && (
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-[#1C1917]/20 focus:border-[#1C1917] transition-colors outline-none pb-1.5 text-sm font-medium tracking-tight placeholder:text-[#1C1917]/20 placeholder:italic focus:ring-0 p-0"
                      placeholder="Type your answer here..."
                      value={answersState[q.id] || ''}
                      onChange={(e) => handleValueChange(q.id, e.target.value)}
                    />
                  )}

                  {/* B. MULTIPLE CHOICE RADIOS */}
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2 pt-1">
                      {q.options?.map((opt) => {
                        const isSelected = answersState[q.id] === opt.value
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => handleValueChange(q.id, opt.value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 border rounded-lg text-xs font-semibold transition-all text-left ${
                              isSelected
                                ? 'border-[#1C1917] bg-[#1C1917]/5 shadow-sm'
                                : 'border-[#1C1917]/10 bg-transparent hover:border-[#1C1917]/30'
                            }`}
                          >
                            <div
                              className="w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all shrink-0 bg-[#FDFBF8]"
                              style={{
                                borderColor: isSelected
                                  ? survey.primary_color || '#1C1917'
                                  : 'rgba(28,25,23,0.2)',
                              }}
                            >
                              {isSelected && (
                                <div
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: survey.primary_color || '#1C1917' }}
                                />
                              )}
                            </div>
                            <span className={isSelected ? 'text-[#1C1917]' : 'text-[#1C1917]/70'}>
                              {opt.value}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* C. RATING NODES */}
                  {q.type === 'rating' && (
                    <div className="flex gap-2 pt-2">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const stringNum = num.toString()
                        const isSelected = answersState[q.id] === stringNum
                        return (
                          <button
                            type="button"
                            key={num}
                            onClick={() => handleValueChange(q.id, stringNum)}
                            className="w-10 h-10 border rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all"
                            style={{
                              backgroundColor: isSelected
                                ? survey.primary_color || '#1C1917'
                                : 'transparent',
                              borderColor: isSelected
                                ? survey.primary_color || '#1C1917'
                                : 'rgba(28,25,23,0.1)',
                              color: isSelected ? '#FDFBF8' : 'rgba(28,25,23,0.6)',
                            }}
                          >
                            {num}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </form>
      </div>

      {/* 4. The Sticky Submit Anchor */}
      <div className="fixed bottom-0 left-0 w-full bg-[#F7F4EF]/95 backdrop-blur-md border-t border-[#1C1917]/10 px-6 py-4 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Moved Anonymity Disclaimer */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]/50">
            <ShieldCheck className="h-4 w-4" />
            Anonymous Response
          </div>

          <div className="flex items-center gap-4">
            {validationError && (
              <span className="text-xs font-semibold text-red-600 truncate max-w-[200px]">
                {validationError}
              </span>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled || isSubmitting}
              className="inline-flex items-center justify-center h-11 px-8 rounded-lg text-xs uppercase tracking-widest font-bold font-sans text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: survey.primary_color || '#1C1917' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Saving...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
