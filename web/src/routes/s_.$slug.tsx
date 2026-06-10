import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/s_/$slug')({
  component: PublicSurveyView,
})

interface PublicQuestion {
  id: string;
  type: "short_text" | "multiple_choice" | "rating";
  prompt: string;
  is_required: boolean;
  options?: { id: string; value: string }[];
}

interface PublicSurveyData {
  id: string;
  title: string;
  primary_color: string;
  logo_url: string | null;
  questions: PublicQuestion[];
}

function PublicSurveyView() {
  const { slug } = Route.useParams()
  const [survey, setSurvey] = useState<PublicSurveyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State management dictionary mapping question_id -> string value response
  const [answersState, setAnswersState] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

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
    setAnswersState(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!survey) return

    // Enforce front-end structural rule validation flags before issuing network payloads
    for (const q of survey.questions) {
      if (q.is_required && (!answersState[q.id] || answersState[q.id].trim() === '')) {
        setValidationError(`Please complete all required fields. ("${q.prompt || 'Untitled Question'}" is missing)`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`http://localhost:8787/api/public/surveys/${survey.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersState })
      })

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
        <p className="text-sm text-[#1C1917]/40 mt-1.5 max-w-sm">This link may have expired or the slug configuration is invalid.</p>
      </div>
    )
  }

  // Success Confirmation State Screen
  if (hasSubmitted) {
    return (
      <div className="h-screen bg-[#F7F4EF] flex flex-col items-center justify-center text-center p-6 font-sans selection:bg-[#1C1917]/10 animate-fade-in">
        <div className="rounded-full h-12 w-12 bg-[#1C1917] text-[#FDFBF8] flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">Submission Complete</h1>
        <p className="text-sm text-[#1C1917]/50 mt-1.5 max-w-xs leading-relaxed">Your feedback has been mapped safely. Thank you for your time.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1C1917] font-sans antialiased py-20 px-6 flex justify-center selection:bg-[#1C1917]/10">
      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-12">
        
        {survey.logo_url && (
          <div className="flex justify-start">
            <img src={survey.logo_url} alt="Logo" className="max-h-12 object-contain filter grayscale invert" />
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1C1917]">{survey.title}</h1>
          <p className="text-xs font-mono uppercase tracking-wider text-[#1C1917]/40 mt-2">Anonymous Response Mode</p>
        </div>

        {/* Render Form Inputs Loop */}
        <div className="space-y-6">
          {survey.questions.map((q, index) => (
            <div key={q.id} className="p-8 bg-[#FDFBF8] border border-[#1C1917]/10 rounded-xl space-y-4 shadow-sm transition-all focus-within:border-[#1C1917]/30">
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono text-[#1C1917]/40 mt-1">Q{index + 1}.</span>
                <label className="font-semibold text-base tracking-tight text-[#1C1917]">
                  {q.prompt || <span className="italic font-normal text-[#1C1917]/30">Untitled Question Prompt</span>}
                  {q.is_required && <span className="ml-1 font-bold" style={{ color: survey.primary_color }}>*</span>}
                </label>
              </div>

              {/* A. SHORT TEXT FIELD */}
              {q.type === "short_text" && (
                <input
                  type="text"
                  required={q.is_required}
                  className="w-full bg-transparent border-b border-[#1C1917]/20 focus:border-[#1C1917] transition-colors outline-none pb-1.5 text-sm font-medium tracking-tight placeholder:text-[#1C1917]/20 placeholder:italic focus:ring-0 p-0"
                  placeholder="Type your answer here..."
                  value={answersState[q.id] || ""}
                  onChange={(e) => handleValueChange(q.id, e.target.value)}
                />
              )}

              {/* B. MULTIPLE CHOICE RADIOS */}
              {q.type === "multiple_choice" && (
                <div className="space-y-2 pt-1">
                  {q.options?.map((opt) => {
                    const isSelected = answersState[q.id] === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => handleValueChange(q.id, opt.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 border rounded-lg text-xs font-semibold transition-all text-left ${
                          isSelected 
                            ? "border-[#1C1917] bg-[#1C1917]/5 shadow-sm" 
                            : "border-[#1C1917]/10 bg-transparent hover:border-[#1C1917]/30"
                        }`}
                      >
                        <div 
                          className="w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all shrink-0 bg-[#FDFBF8]"
                          style={{ borderColor: isSelected ? survey.primary_color : '#1C1917/20' }}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: survey.primary_color }} />}
                        </div>
                        <span className={isSelected ? "text-[#1C1917]" : "text-[#1C1917]/70"}>{opt.value}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* C. RATING NODES */}
              {q.type === "rating" && (
                <div className="flex gap-2 pt-2">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const stringNum = num.toString();
                    const isSelected = answersState[q.id] === stringNum;
                    return (
                      <button
                        type="button"
                        key={num}
                        onClick={() => handleValueChange(q.id, stringNum)}
                        className="w-10 h-10 border rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all"
                        style={{
                          backgroundColor: isSelected ? survey.primary_color : 'transparent',
                          borderColor: isSelected ? survey.primary_color : 'rgba(28,25,23,0.1)',
                          color: isSelected ? '#FDFBF8' : 'rgba(28,25,23,0.6)'
                        }}
                      >
                        {num}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Error Flag Alert banner */}
        {validationError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-semibold leading-relaxed tracking-tight">
            {validationError}
          </div>
        )}

        {/* Submit Action Node */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto inline-flex items-center justify-center h-11 px-8 rounded-lg text-xs uppercase tracking-widest font-bold font-sans text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: survey.primary_color || '#1C1917' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Recording...
              </>
            ) : "Submit Response Structure"}
          </button>
        </div>

      </form>
    </div>
  )
}