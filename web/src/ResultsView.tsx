import { Star, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Question, useSurveyBuilder } from './SurveyBuilderContext'

// Explicitly type the response to satisfy Biome
interface SurveyResponse {
  id: string
  submittedAt: string
  answers: Record<string, string>
}

export function ResultsView({ surveyId }: { surveyId: string }) {
  const { questions } = useSurveyBuilder()
  const [tab, setTab] = useState<'summary' | 'individual'>('summary')
  const [resultsData, setResultsData] = useState<{
    totalResponses: number
    lastResponseAt: string | null
    responses: SurveyResponse[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchResults() {
      if (!surveyId) return

      try {
        const res = await fetch(`http://localhost:8787/api/surveys/${surveyId}/results`, {
          credentials: 'include',
        })
        if (res.ok) {
          setResultsData(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch results', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchResults()
  }, [surveyId])

  if (isLoading) return <div className="p-12 text-[#1C1917]/50 font-sans">Loading responses...</div>

  // Omitting lastResponseAt from destructuring to prevent the "unused variable" warning
  const { totalResponses, responses } = resultsData || {
    totalResponses: 0,
    responses: [],
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F7F4EF] text-[#1C1917] font-sans">
      <div className="p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
        {/* Simple Tab Toggle to satisfy setTab usage and provide navigation */}
        <div className="flex gap-6 border-b border-[#1C1917]/10 pb-4">
          <button
            type="button"
            onClick={() => setTab('summary')}
            className={`text-sm font-semibold transition-colors ${tab === 'summary' ? 'text-[#1C1917]' : 'text-[#1C1917]/40 hover:text-[#1C1917]/70'}`}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setTab('individual')}
            className={`text-sm font-semibold transition-colors ${tab === 'individual' ? 'text-[#1C1917]' : 'text-[#1C1917]/40 hover:text-[#1C1917]/70'}`}
          >
            Individual Responses
          </button>
        </div>

        {tab === 'summary' ? (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <SummaryQuestionCard key={q.id} index={idx + 1} question={q} responses={responses} />
            ))}
          </div>
        ) : (
          <div className="border border-[0.5px] border-[#1C1917]/10 rounded-[8px] overflow-hidden bg-[#FDFBF8]">
            {responses.map((r, idx) => {
              const isExpanded = expandedRowId === r.id
              const q1Id = questions[0]?.id
              const q1Answer = q1Id ? r.answers[q1Id] : null
              const initials =
                q1Answer && typeof q1Answer === 'string'
                  ? q1Answer.substring(0, 2).toUpperCase()
                  : null
              const preview = Object.values(r.answers).filter(Boolean).slice(0, 2).join(' · ')

              return (
                <div
                  key={r.id}
                  className="border-b border-[0.5px] border-[#1C1917]/10 last:border-b-0"
                >
                  {/* Semantic Button for A11y compliance */}
                  <button
                    type="button"
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#F7F4EF] cursor-pointer transition-colors text-left"
                    onClick={() => setExpandedRowId(isExpanded ? null : r.id)}
                  >
                    <div className="w-[28px] h-[28px] rounded-full bg-[#1C1917] text-[#FDFBF8] flex items-center justify-center text-[11px] font-[500] shrink-0">
                      {initials || <User size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-[500] truncate">
                        Response #{totalResponses - idx}
                      </p>
                      <p className="text-[13px] text-[#1C1917]/50 font-[400] truncate">
                        {preview || 'Empty response'}
                      </p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-6 bg-[#F7F4EF]/50 border-t border-[0.5px] border-[#1C1917]/5 space-y-4 shadow-inner">
                      {questions.map((q) => (
                        <div key={q.id}>
                          <p className="text-[11px] font-[500] text-[#1C1917]/50 mb-1">
                            {q.prompt || 'Untitled Question'}
                          </p>
                          <p className="text-[13px] font-[400] bg-[#FDFBF8] p-2 rounded-[6px] border border-[#1C1917]/10">
                            {r.answers[q.id] || (
                              <span className="italic text-[#1C1917]/40">No answer</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// --- QUESTION SUMMARY CARD ---
function SummaryQuestionCard({
  index,
  question,
  responses,
}: {
  index: number
  question: Question
  responses: SurveyResponse[]
}) {
  const answeredCount = responses.filter((r) => r.answers[question.id]).length

  return (
    <div className="bg-[#FDFBF8] border border-[0.5px] border-[#1C1917]/10 rounded-[8px] p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="inline-flex px-2 py-1 rounded-[6px] bg-[#1C1917] text-[#FDFBF8] text-[11px] font-[500] tracking-[0.06em] mb-3">
            Q{index} · {question.type.replace('_', ' ').toUpperCase()}
          </div>
          <h3 className="text-[15px] font-[500]">
            {question.prompt || <span className="italic text-[#1C1917]/40">Untitled Question</span>}
          </h3>
        </div>
        <span className="text-[11px] font-[400] text-[#1C1917]/40">{answeredCount} responses</span>
      </div>

      <div className="mt-4">
        {question.type === 'short_text' && (
          <ShortTextSummary qId={question.id} responses={responses} />
        )}
        {question.type === 'multiple_choice' && (
          <MultipleChoiceSummary question={question} responses={responses} />
        )}
        {question.type === 'rating' && <RatingSummary qId={question.id} responses={responses} />}
      </div>
    </div>
  )
}

// --- SHORT TEXT SUMMARY ---
function ShortTextSummary({ qId, responses }: { qId: string; responses: SurveyResponse[] }) {
  const answers = responses.filter((r) => r.answers[qId]).slice(0, 3)
  return (
    <div className="space-y-2">
      {answers.map((r) => (
        <div
          key={r.id}
          className="bg-[#F7F4EF] border border-[0.5px] border-[#1C1917]/5 rounded-[6px] p-3 text-[13px] font-[400] flex justify-between items-center"
        >
          <span className="truncate mr-4">{r.answers[qId]}</span>
          <span className="text-[11px] text-[#1C1917]/40 shrink-0">
            {new Date(r.submittedAt).toLocaleDateString()}
          </span>
        </div>
      ))}
      {answers.length > 0 && (
        <button
          type="button"
          className="text-[13px] font-medium text-[#1C1917]/60 hover:text-[#1C1917] mt-3"
        >
          View all responses →
        </button>
      )}
    </div>
  )
}

// --- MULTIPLE CHOICE SUMMARY ---
function MultipleChoiceSummary({
  question,
  responses,
}: {
  question: Question
  responses: SurveyResponse[]
}) {
  const counts: Record<string, number> = {}

  const options = question.options || []

  // Fixed forEach to satisfy Biome (no implicit return)
  options.forEach((o) => {
    counts[o.value] = 0
  })

  let totalVotes = 0
  responses.forEach((r) => {
    const ans = r.answers[question.id]
    if (ans && counts[ans] !== undefined) {
      counts[ans]++
      totalVotes++
    }
  })

  const sortedOptions = [...options].sort((a, b) => (counts[b.value] ?? 0) - (counts[a.value] ?? 0))

  return (
    <div className="space-y-3">
      {sortedOptions.map((opt, idx) => {
        const count = counts[opt.value] || 0
        const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
        const opacity = Math.max(0.2, 1 - idx * 0.15)

        return (
          <div key={opt.id} className="flex items-center gap-4">
            <div className="w-[100px] shrink-0 text-right text-[12px] font-[400] truncate">
              {opt.value}
            </div>
            <div className="flex-1 h-[8px] bg-[#F7F4EF] rounded-[4px] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-[#1C1917] rounded-[4px]"
                style={{ width: `${pct}%`, opacity }}
              />
            </div>
            <div className="w-[60px] shrink-0 text-[12px] font-[500] text-right">
              {count} <span className="text-[#1C1917]/40 font-[400]">({pct}%)</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- RATING SUMMARY ---
function RatingSummary({ qId, responses }: { qId: string; responses: SurveyResponse[] }) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let sum = 0
  let totalVotes = 0

  responses.forEach((r) => {
    const ans = Number(r.answers[qId])
    if (ans >= 1 && ans <= 5) {
      counts[ans as keyof typeof counts]++
      sum += ans
      totalVotes++
    }
  })

  const avg = totalVotes === 0 ? 0 : (sum / totalVotes).toFixed(1)

  return (
    <div className="flex items-stretch gap-8">
      {/* Distribution */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star as keyof typeof counts]
          const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-[24px] text-[12px] font-[500]">
                {star}
                <Star size={10} fill="#1C1917" className="text-[#1C1917]" />
              </div>
              <div className="flex-1 h-[8px] bg-[#F7F4EF] rounded-[4px] overflow-hidden">
                <div className="h-full bg-[#1C1917]" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-[40px] text-right text-[12px] font-[400] text-[#1C1917]/50">
                {pct}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Vertical Divider */}
      <div className="w-px bg-[#1C1917]/10" />

      {/* Average Output */}
      <div className="w-[120px] flex flex-col items-center justify-center shrink-0">
        <span className="text-[32px] font-[500] leading-none mb-2">{avg}</span>
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={14}
              fill={s <= Math.round(Number(avg)) ? '#BA7517' : 'transparent'}
              stroke={s <= Math.round(Number(avg)) ? '#BA7517' : '#1C1917'}
              strokeWidth={s <= Math.round(Number(avg)) ? 0 : 1}
              className="opacity-80"
            />
          ))}
        </div>
        <span className="text-[11px] font-[400] text-[#1C1917]/40 tracking-[0.06em] uppercase">
          Avg Rating
        </span>
      </div>
    </div>
  )
}
