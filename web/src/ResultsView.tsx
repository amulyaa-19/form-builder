import { Star, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSurveyBuilder } from './SurveyBuilderContext' // Using your context from Phase 1

export function ResultsView() {
  const { questions, branding } = useSurveyBuilder()
  const [tab, setTab] = useState<'summary' | 'individual'>('summary')
  const [resultsData, setResultsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Fetch results when component mounts
  useEffect(() => {
    async function fetchResults() {
      // Assuming surveyId is available via params or context
      const surveyId = window.location.pathname.split('/')[2] // or useParams
      const res = await fetch(`/api/surveys/${surveyId}/results`)
      if (res.ok) {
        setResultsData(await res.json())
      }
      setIsLoading(false)
    }
    fetchResults()
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 p-12 bg-[#F7F4EF]">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-[#1C1917]/5 rounded-[8px] w-full" />
          <div className="grid grid-cols-4 gap-4">
            <div className="h-24 bg-[#1C1917]/5 rounded-[8px]" />
          </div>
        </div>
      </div>
    )
  }

  const { totalResponses, lastResponseAt, responses } = resultsData || {
    totalResponses: 0,
    responses: [],
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F7F4EF] text-[#1C1917] font-sans antialiased">
      {/* Topbar */}
      <div className="h-16 border-b border-[0.5px] border-[#1C1917]/10 bg-[#FDFBF8] flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex gap-4">
          <button
            onClick={() => setTab('summary')}
            className={`text-[13px] font-[500] px-2 py-1 rounded ${tab === 'summary' ? 'text-[#1C1917] bg-[#1C1917]/5' : 'text-[#1C1917]/50 hover:text-[#1C1917]'}`}
          >
            Summary
          </button>
          <button
            onClick={() => setTab('individual')}
            className={`text-[13px] font-[500] px-2 py-1 rounded ${tab === 'individual' ? 'text-[#1C1917] bg-[#1C1917]/5' : 'text-[#1C1917]/50 hover:text-[#1C1917]'}`}
          >
            Individual
          </button>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-[6px] border border-[0.5px] border-[#1C1917]/15 text-[13px] font-[500] hover:bg-[#1C1917]/5 transition-colors">
            Filter
          </button>
          <button className="px-4 py-2 rounded-[6px] bg-[#1C1917] text-[#FDFBF8] text-[13px] font-[500] hover:opacity-90 transition-opacity">
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
        {/* Metric Strip */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="TOTAL RESPONSES" value={totalResponses.toString()} sub="All time" />
          <MetricCard
            label="COMPLETION RATE"
            value={totalResponses > 0 ? '100%' : '0%'}
            sub="Completed / Started"
          />
          {/* <MetricCard label="AVG. TIME" value="—" sub="Duration" /> */}
          <MetricCard
            label="LAST RESPONSE"
            value={lastResponseAt ? new Date(lastResponseAt).toLocaleDateString() : '—'}
            sub="Latest submission"
          />
        </div>

        {/* Tab Content */}
        {totalResponses === 0 ? (
          <div className="py-24 text-center border border-[0.5px] border-[#1C1917]/10 rounded-[8px] bg-[#FDFBF8]">
            <p className="text-[15px] font-[500] text-[#1C1917]/50">Waiting for responses</p>
          </div>
        ) : tab === 'summary' ? (
          <div className="space-y-6">
            {questions.map((q: any, idx: number) => (
              <SummaryQuestionCard key={q.id} index={idx + 1} question={q} responses={responses} />
            ))}
          </div>
        ) : (
          <div className="border border-[0.5px] border-[#1C1917]/10 rounded-[8px] overflow-hidden bg-[#FDFBF8]">
            {responses.map((r: any, idx: number) => {
              const isExpanded = expandedRowId === r.id
              // Q1 Logic for Avatar/Preview
              const q1Id = questions[0]?.id
              const q1Answer = r.answers[q1Id!]
              const initials =
                q1Answer && typeof q1Answer === 'string'
                  ? q1Answer.substring(0, 2).toUpperCase()
                  : null

              // Answer preview (first 2 valid answers)
              const preview = Object.values(r.answers).filter(Boolean).slice(0, 2).join(' · ')

              return (
                <div
                  key={r.id}
                  className="border-b border-[0.5px] border-[#1C1917]/10 last:border-0"
                >
                  <div
                    className="flex items-center gap-4 p-4 hover:bg-[#F7F4EF] cursor-pointer transition-colors"
                    onClick={() => setExpandedRowId(isExpanded ? null : r.id)}
                  >
                    <div className="w-[28px] h-[28px] rounded-full bg-[#1C1917] text-[#FDFBF8] flex items-center justify-center text-[11px] font-[500] shrink-0">
                      {initials ? initials : <User size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-[500] truncate">
                        Response #{totalResponses - idx}
                      </p>
                      <p className="text-[13px] text-[#1C1917]/50 font-[400] truncate">
                        {preview || 'Empty response'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-[400]">—</p>
                      <p className="text-[11px] text-[#1C1917]/40 font-[400]">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {/* Expanded Accordion Sheet */}
                  {isExpanded && (
                    <div className="p-6 bg-[#F7F4EF]/50 border-t border-[0.5px] border-[#1C1917]/5 space-y-4 shadow-inner">
                      {questions.map((q: any) => (
                        <div key={q.id}>
                          <p className="text-[11px] font-[500] text-[#1C1917]/50 mb-1">
                            {q.prompt}
                          </p>
                          <p className="text-[13px] font-[400] bg-[#FDFBF8] p-2 rounded-[6px] border border-[0.5px] border-[#1C1917]/10">
                            {r.answers[q.id] || (
                              <span className="text-[#1C1917]/30 italic">No answer</span>
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

// --- METRIC STRIP CARD ---
function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-[#FDFBF8] border border-[0.5px] border-[#1C1917]/10 rounded-[8px] p-5">
      <p className="text-[11px] font-[500] text-[#1C1917]/50 tracking-[0.06em] uppercase mb-2">
        {label}
      </p>
      <p className="text-[22px] font-[500] leading-none mb-2">{value}</p>
      <p className="text-[11px] font-[400] text-[#1C1917]/40">{sub}</p>
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
  question: any
  responses: any[]
}) {
  // Count how many people answered this specific question
  const answeredCount = responses.filter((r) => r.answers[question.id]).length

  return (
    <div className="bg-[#FDFBF8] border border-[0.5px] border-[#1C1917]/10 rounded-[8px] p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="inline-flex px-2 py-1 rounded-[6px] bg-[#1C1917] text-[#FDFBF8] text-[11px] font-[500] tracking-[0.06em] mb-3">
            Q{index} · {question.type.replace('_', ' ').toUpperCase()}
          </div>
          <h3 className="text-[15px] font-[500]">{question.prompt}</h3>
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
function ShortTextSummary({ qId, responses }: { qId: string; responses: any[] }) {
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
      <button className="text-[13px] font-[500] text-[#1C1917]/60 hover:text-[#1C1917] mt-3">
        View all responses →
      </button>
    </div>
  )
}

// --- MULTIPLE CHOICE SUMMARY ---
function MultipleChoiceSummary({ question, responses }: { question: any; responses: any[] }) {
  const counts: Record<string, number> = {}
  question.options.forEach((o: any) => (counts[o.value] = 0))

  let totalVotes = 0
  responses.forEach((r) => {
    const ans = r.answers[question.id]
    if (ans && counts[ans] !== undefined) {
      counts[ans]++
      totalVotes++
    }
  })

  // Sort options by vote count descending
  const sortedOptions = [...question.options].sort((a, b) => counts[b.value]! - counts[a.value]!)

  return (
    <div className="space-y-3">
      {sortedOptions.map((opt, idx) => {
        const count = counts[opt.value] || 0
        const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
        const opacity = Math.max(0.2, 1 - idx * 0.15) // Winner is 1.0, next is 0.85, etc.

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
function RatingSummary({ qId, responses }: { qId: string; responses: any[] }) {
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
