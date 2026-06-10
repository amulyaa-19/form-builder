import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  PenTool,
  Plus,
  Share2,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ResultsView } from '../ResultsView'
import { type QuestionType, SurveyBuilderProvider, useSurveyBuilder } from '../SurveyBuilderContext'

export const Route = createFileRoute('/surveys_/$id/edit')({
  component: SurveyWorkspaceWrapper,
})

export default function SurveyWorkspaceWrapper() {
  const { id } = Route.useParams()

  return (
    <SurveyBuilderProvider surveyId={id}>
      <SurveyWorkspace />
    </SurveyBuilderProvider>
  )
}

function SurveyWorkspace() {
  const { isLoading, isSaving, branding, setBranding } = useSurveyBuilder()
  const [copied, setCopied] = useState(false)
  const { id } = Route.useParams()

  // Moved the Results toggle state to the top header
  const [activeMode, setActiveMode] = useState<'build' | 'results'>('build')

  if (isLoading) {
    return (
      <div className="h-screen bg-[#F7F4EF] flex items-center justify-center text-sm font-medium tracking-tight">
        <Loader2 className="h-5 w-5 animate-spin text-[#1C1917] mr-2" />
        Loading Workspace...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F7F4EF] text-[#1C1917] font-sans overflow-hidden antialiased select-none">
      {/* LEFT PANE: Master Sidebar (Pure Toolbox) */}
      {activeMode === 'build' && (
        <div className="w-72 bg-[#1C1917] p-6 flex flex-col gap-8 text-white border-r border-white/5 shadow-xl relative z-10 shrink-0">
          <LeftToolbox />
        </div>
      )}

      {/* DYNAMIC CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="h-16 border-b border-white/5 bg-[#1C1917] flex items-center justify-between px-8 text-white z-20 shadow-md">
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              to="/surveys"
              className="text-white/40 hover:text-white transition-colors flex items-center gap-1 text-xs uppercase tracking-wider font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Surveys
            </Link>
            <span className="text-white/20 font-mono">/</span>
            <input
              className="font-semibold text-sm tracking-tight bg-transparent border-none outline-none focus:ring-0 text-white max-w-sm placeholder:text-white/20 font-sans"
              value={branding.title}
              onChange={(e) => setBranding((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Untitled Survey"
            />
          </div>

          {/* Mode Toggle & Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono text-white/50">
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                  <span>Saving changes...</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <span>Autosaved</span>
                </>
              )}
            </div>

            <div className="w-px h-6 bg-white/10" />

            <button
              type="button"
              onClick={() => setActiveMode(activeMode === 'build' ? 'results' : 'build')}
              className="text-xs font-semibold text-white/60 hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-md hover:bg-white/10"
            >
              {activeMode === 'build' ? (
                <>
                  <BarChart3 className="h-3.5 w-3.5" /> Results
                </>
              ) : (
                <>
                  <PenTool className="h-3.5 w-3.5" /> Builder
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                let targetSlug = branding.slug
                if (!targetSlug && branding.title) {
                  const baseSlug =
                    branding.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '') || 'survey'
                  targetSlug = `${baseSlug}-${id.slice(0, 6)}`
                }
                const publicUrl = `${window.location.origin}/s/${targetSlug || id}`
                navigator.clipboard.writeText(publicUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="text-xs font-semibold text-white transition-colors flex items-center gap-1.5 bg-[#1C1917] border border-white/20 px-3 py-1.5 rounded-md hover:bg-white/10"
            >
              {copied ? (
                'Link Copied!'
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" /> Share
                </>
              )}
            </button>
          </div>
        </div>

        {activeMode === 'build' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Dynamic Canvas Area (Custom Scrollbars Added) */}
            <div
              className="flex-1 overflow-y-auto p-12 bg-[#F7F4EF]"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#E2D9CE #F7F4EF' }}
            >
              <CenterCanvas />
            </div>

            {/* RIGHT PANE: Tabbed Inspector */}
            <RightSettings />
          </div>
        ) : (
          <ResultsView />
        )}
      </div>
    </div>
  )
}

function LeftToolbox() {
  const { addQuestion } = useSurveyBuilder()
  const blocks: { type: QuestionType; label: string }[] = [
    { type: 'short_text', label: 'Short Text Input' },
    { type: 'multiple_choice', label: 'Multiple Choice' },
    { type: 'rating', label: '1–5 Scale Rating' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 font-mono">
          Blocks
        </h2>
        <div className="space-y-2">
          {blocks.map((b) => (
            <button
              key={b.type}
              onClick={() => addQuestion(b.type)}
              className="w-full text-left px-4 py-3 bg-white/[0.02] border border-white/10 hover:border-white/40 hover:bg-white/5 rounded-lg text-sm font-medium transition-all group flex justify-between items-center text-white/70 hover:text-white"
            >
              <span>{b.label}</span>
              <span className="text-white/20 group-hover:text-white transition-colors font-mono text-base">
                +
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CenterCanvas() {
  const {
    questions,
    activeQuestionId,
    setActiveQuestionId,
    removeQuestion,
    moveQuestionUp,
    moveQuestionDown,
    branding,
  } = useSurveyBuilder()

  const getTypeLabel = (type: QuestionType) => {
    if (type === 'short_text') return 'Short text'
    if (type === 'multiple_choice') return 'Multiple choice'
    return 'Rating component'
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      {branding.logo_url && (
        <div className="mb-8 flex justify-start">
          <img
            src={branding.logo_url}
            alt="Logo"
            className="max-h-12 object-contain filter grayscale invert"
          />
        </div>
      )}

      {questions.length === 0 ? (
        <div className="border-2 border-dashed border-[#1C1917]/10 rounded-xl p-12 text-center bg-[#FDFBF8]/50">
          <p className="text-sm font-medium text-[#1C1917]/40 tracking-tight">
            Your canvas is empty. Add a structural block from the toolbox to start.
          </p>
        </div>
      ) : (
        questions.map((q, index) => {
          const isActive = activeQuestionId === q.id
          return (
            <div
              key={q.id}
              onClick={() => setActiveQuestionId(q.id)}
              className={`p-8 bg-[#FDFBF8] border rounded-xl transition-all text-left relative group cursor-pointer ${
                isActive
                  ? 'border-[#1C1917] shadow-[4px_4px_0_0_#1C1917] opacity-100 scale-[1.01]'
                  : 'border-[#1C1917]/10 opacity-70 hover:opacity-100'
              }`}
            >
              {/* Question Context Meta Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1C1917]/5 text-[#1C1917]/60 border border-[#1C1917]/5">
                    Q{index + 1} · {getTypeLabel(q.type)}
                  </span>
                  {q.is_required && (
                    <span
                      className="font-bold text-sm"
                      style={{ color: branding.primary_color || '#1C1917' }}
                    >
                      *
                    </span>
                  )}
                </div>

                {/* Canvas Controls */}
                {isActive && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveQuestionUp(q.id)
                      }}
                      disabled={index === 0}
                      className="text-[#1C1917]/40 hover:text-[#1C1917] transition-colors p-1.5 rounded hover:bg-[#1C1917]/5 disabled:opacity-20"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveQuestionDown(q.id)
                      }}
                      disabled={index === questions.length - 1}
                      className="text-[#1C1917]/40 hover:text-[#1C1917] transition-colors p-1.5 rounded hover:bg-[#1C1917]/5 disabled:opacity-20"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-[#1C1917]/10 mx-1" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeQuestion(q.id)
                      }}
                      className="text-[#1C1917]/40 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* ⚡ PURE PREVIEW PROMPT (Editing moved to right panel) */}
              <h3 className="text-xl font-semibold tracking-tight text-[#1C1917] mb-4">
                {q.prompt || <span className="italic text-[#1C1917]/30">Untitled Question</span>}
              </h3>

              {/* Render Type Structural Mockups */}
              {q.type === 'short_text' && (
                <div className="border-b border-[#1C1917]/10 w-full pt-4 pb-1 text-[#1C1917]/20 text-xs italic font-mono">
                  Respondent short response vector will input here...
                </div>
              )}

              {q.type === 'multiple_choice' && (
                <div className="space-y-2 mt-4 pointer-events-none">
                  {q.options?.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-3 px-4 py-3 border border-[#1C1917]/10 bg-[#F7F4EF]/20 rounded-lg text-sm font-medium text-[#1C1917]/70"
                    >
                      <div className="w-3.5 h-3.5 rounded-full border border-[#1C1917]/20 bg-[#FDFBF8] shrink-0" />
                      <span>{opt.value || `Option ${idx + 1}`}</span>
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'rating' && (
                <div className="flex gap-1.5 mt-5 pointer-events-none">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div
                      key={num}
                      className="w-10 h-10 border border-[#1C1917]/10 rounded-lg flex items-center justify-center font-mono text-xs font-bold bg-[#F7F4EF]/10 text-[#1C1917]/40"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function RightSettings() {
  const { questions, activeQuestionId, updateQuestion, branding, setBranding } = useSurveyBuilder()
  const activeQuestion = questions.find((q) => q.id === activeQuestionId)

  const [activeTab, setActiveTab] = useState<'question' | 'brand'>('question')

  // Auto-switch to Question tab when a new question is selected
  useEffect(() => {
    if (activeQuestionId) setActiveTab('question')
  }, [activeQuestionId])

  const colorPresets = [
    '#1C1917', // Graphite
    '#CC0000', // Crimson (From your screenshot)
    '#EA580C', // Orange
    '#D97706', // Amber
    '#16A34A', // Emerald
    '#2563EB', // Blue
    '#7C3AED', // Violet
    '#DB2777', // Pink
  ]

  return (
    <div className="w-[340px] border-l border-[#1C1917]/10 bg-[#FDFBF8] flex flex-col relative z-10 shadow-sm shrink-0">
      {/* Tabs Header */}
      <div className="flex border-b border-[#1C1917]/10 shrink-0">
        <button
          onClick={() => setActiveTab('question')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'question' ? 'text-[#1C1917] border-b-2 border-[#1C1917] bg-[#1C1917]/[0.02]' : 'text-[#1C1917]/40 hover:text-[#1C1917]/70 hover:bg-[#1C1917]/[0.02]'}`}
        >
          Question
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'brand' ? 'text-[#1C1917] border-b-2 border-[#1C1917] bg-[#1C1917]/[0.02]' : 'text-[#1C1917]/40 hover:text-[#1C1917]/70 hover:bg-[#1C1917]/[0.02]'}`}
        >
          Brand
        </button>
      </div>

      {/* Scrollable Tab Content */}
      <div
        className="p-6 overflow-y-auto flex-1 pb-24"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#E2D9CE #FDFBF8' }}
      >
        {/* --- TAB 1: QUESTION CONFIG --- */}
        {activeTab === 'question' &&
          (!activeQuestion ? (
            <div className="flex flex-col items-center justify-center text-center pt-20 px-4 text-[#1C1917]/40">
              <PenTool className="h-8 w-8 mb-4 opacity-50" />
              <p className="text-xs italic leading-relaxed">
                Select a block on the center canvas to configure its rules and content here.
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Question Text Editor */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#1C1917]/60 block mb-2 font-mono">
                  Question Prompt
                </label>
                <textarea
                  className="w-full min-h-[100px] border border-[#1C1917]/10 rounded-lg p-3 text-sm font-medium text-[#1C1917] bg-[#F7F4EF]/50 outline-none focus:border-[#1C1917] focus:bg-white transition-all resize-y"
                  placeholder="Type your question here..."
                  value={activeQuestion.prompt}
                  onChange={(e) => updateQuestion(activeQuestion.id, { prompt: e.target.value })}
                />
              </div>

              {/* Required Toggle */}
              <div className="flex items-center justify-between py-3 border-y border-[#1C1917]/5">
                <span className="text-sm font-semibold text-[#1C1917]">Mark as required</span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuestion(activeQuestion.id, { is_required: !activeQuestion.is_required })
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    activeQuestion.is_required ? 'bg-[#1C1917]' : 'bg-[#E2D9CE]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      activeQuestion.is_required ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Type-Specific: Multiple Choice Options */}
              {activeQuestion.type === 'multiple_choice' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#1C1917]/60 block mb-3 font-mono">
                    Choices
                  </label>
                  <div className="space-y-2">
                    {activeQuestion.options?.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2 group">
                        <input
                          type="text"
                          className="flex-1 border border-[#1C1917]/10 rounded-md p-2 text-sm bg-white outline-none focus:border-[#1C1917] transition-colors placeholder:text-[#1C1917]/30"
                          value={opt.value}
                          onChange={(e) => {
                            const nextOpts = [...(activeQuestion.options || [])]
                            nextOpts[idx]!.value = e.target.value
                            updateQuestion(activeQuestion.id, { options: nextOpts })
                          }}
                          placeholder={`Option ${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextOpts = (activeQuestion.options || []).filter(
                              (o) => o.id !== opt.id,
                            )
                            updateQuestion(activeQuestion.id, { options: nextOpts })
                          }}
                          className="p-2 text-[#1C1917]/30 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpts = [
                          ...(activeQuestion.options || []),
                          {
                            id: crypto.randomUUID(),
                            value: `Option ${(activeQuestion.options?.length || 0) + 1}`,
                          },
                        ]
                        updateQuestion(activeQuestion.id, { options: nextOpts })
                      }}
                      className="w-full mt-2 py-2 border border-dashed border-[#1C1917]/20 rounded-md text-xs font-bold text-[#1C1917]/60 hover:text-[#1C1917] hover:border-[#1C1917]/50 hover:bg-[#1C1917]/5 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Choice
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

        {/* --- TAB 2: BRAND CONFIG --- */}
        {activeTab === 'brand' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Color Presets */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#1C1917]/60 block mb-3 font-mono">
                Accent Brand Color
              </label>

              {/* Frictionless Presets */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {colorPresets.map((color) => {
                  const isActive = branding.primary_color.toUpperCase() === color.toUpperCase()
                  return (
                    <button
                      key={color}
                      onClick={() => setBranding((prev) => ({ ...prev, primary_color: color }))}
                      className={`w-full aspect-square rounded-md border transition-all ${isActive ? 'scale-110 shadow-md border-white/50 ring-2 ring-[#1C1917]/20 z-10' : 'border-black/10 hover:scale-105 hover:shadow-sm'}`}
                      style={{ backgroundColor: color }}
                    >
                      {isActive && <Check className="w-4 h-4 text-white mx-auto drop-shadow-md" />}
                    </button>
                  )
                })}
              </div>

              {/* Escape Hatch Hex Input */}
              <div className="flex gap-2 items-center bg-[#F7F4EF]/50 p-1.5 rounded-lg border border-[#1C1917]/10">
                <input
                  type="color"
                  className="w-8 h-8 rounded-md border border-[#1C1917]/20 p-0 cursor-pointer bg-transparent overflow-hidden shrink-0"
                  value={branding.primary_color}
                  onChange={(e) =>
                    setBranding((prev) => ({ ...prev, primary_color: e.target.value }))
                  }
                />
                <input
                  type="text"
                  className="flex-1 bg-transparent border-none outline-none text-xs font-mono uppercase text-[#1C1917] px-2"
                  value={branding.primary_color}
                  onChange={(e) =>
                    setBranding((prev) => ({ ...prev, primary_color: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Logo Configuration */}
            <div className="pt-6 border-t border-[#1C1917]/10">
              <label className="text-xs font-bold uppercase tracking-widest text-[#1C1917]/60 block mb-3 font-mono">
                Logo Settings
              </label>

              <input
                type="text"
                placeholder="https://brand.com/logo.png"
                className="w-full border border-[#1C1917]/10 p-2.5 text-xs bg-white rounded-md outline-none focus:border-[#1C1917] transition-colors font-mono mb-3"
                value={branding.logo_url || ''}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, logo_url: e.target.value || null }))
                }
              />

              {/* Live Thumbnail Preview */}
              <div className="w-full h-24 border border-dashed border-[#1C1917]/20 rounded-lg bg-[#F7F4EF]/50 flex items-center justify-center p-4">
                {branding.logo_url ? (
                  <img
                    src={branding.logo_url}
                    alt="Brand Logo Preview"
                    className="max-h-full max-w-full object-contain filter grayscale"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = ''
                      ;(e.target as HTMLImageElement).alt = 'Invalid URL'
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#1C1917]/30">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      No Logo Added
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
