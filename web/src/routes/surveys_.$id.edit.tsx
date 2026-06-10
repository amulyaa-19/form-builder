import { createFileRoute, Link } from "@tanstack/react-router";
import { SurveyBuilderProvider, useSurveyBuilder, type QuestionType } from "../SurveyBuilderContext";
import { Activity, Calendar, ArrowRight, FileText, PlusCircle, Loader2, ArrowLeft, Share2, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute('/surveys_/$id/edit')({
  component: SurveyWorkspaceWrapper,
})

export default function SurveyWorkspaceWrapper() {
  const { id } = Route.useParams()
  
  return (
    <SurveyBuilderProvider surveyId={id}>
      <SurveyWorkspace />
    </SurveyBuilderProvider>
  );
}

function SurveyWorkspace() {
  const { isLoading, isSaving, branding, setBranding } = useSurveyBuilder();

  if (isLoading) {
    return (
      <div className="h-screen bg-[#F7F4EF] flex items-center justify-center text-sm font-medium tracking-tight">
        Loading Master Workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F7F4EF] text-[#1C1917] font-sans overflow-hidden antialiased select-none">
      {/* LEFT PANE: Toolbox */}
      <LeftToolbox />

      {/* CENTER CANVAS: Interactive Live WYSIWYG View */}
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
              onChange={(e) => setBranding(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Untitled Survey Structure"
            />
          </div>
          
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
            
            <button 
              type="button"
              className="text-xs font-semibold text-white/60 hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-md hover:bg-white/10"
            >
              Share <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Canvas Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-[#F7F4EF]">
          <CenterCanvas />
        </div>
      </div>

      {/* RIGHT PANE: Parameter Inspector */}
      <RightSettings />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function LeftToolbox() {
  const { addQuestion } = useSurveyBuilder();
  const blocks: { type: QuestionType; label: string }[] = [
    { type: "short_text", label: "Short Text Input" },
    { type: "multiple_choice", label: "Multiple Choice" },
    { type: "rating", label: "1–5 Scale Rating" },
  ];

  return (
    <div className="w-72 bg-[#1C1917] p-6 flex flex-col gap-6 text-white border-r border-white/5 shadow-xl relative z-10">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 font-mono">Blocks</h2>
        <div className="space-y-2">
          {blocks.map((b) => (
            <button
              key={b.type}
              onClick={() => addQuestion(b.type)}
              className="w-full text-left px-4 py-3 bg-white/[0.02] border border-white/10 hover:border-white/40 hover:bg-white/5 rounded-lg text-sm font-medium transition-all group flex justify-between items-center text-white/70 hover:text-white"
            >
              <span>{b.label}</span>
              <span className="text-white/20 group-hover:text-white transition-colors font-mono text-base">+</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CenterCanvas() {
  const { questions, activeQuestionId, setActiveQuestionId, updateQuestion, removeQuestion, branding } = useSurveyBuilder();

  const getTypeLabel = (type: QuestionType) => {
    if (type === "short_text") return "Short text";
    if (type === "multiple_choice") return "Multiple choice";
    return "Rating component";
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      {branding.logo_url && (
        <div className="mb-8 flex justify-start">
          <img src={branding.logo_url} alt="Logo" className="max-h-12 object-contain filter grayscale invert" />
        </div>
      )}

      {questions.length === 0 ? (
        <div className="border-2 border-dashed border-[#1C1917]/10 rounded-xl p-12 text-center bg-[#FDFBF8]/50">
          <p className="text-sm font-medium text-[#1C1917]/40 tracking-tight">Your canvas is empty. Add a structural block from the toolbox to start.</p>
        </div>
      ) : (
        questions.map((q, index) => {
          const isActive = activeQuestionId === q.id;
          return (
            <div
              key={q.id}
              onClick={() => setActiveQuestionId(q.id)}
              className={`p-8 bg-[#FDFBF8] border rounded-xl transition-all text-left relative group ${
                isActive 
                  ? "border-[#1C1917] shadow-[6px_6px_0px_0px_#1C1917] opacity-100 scale-[1.01]" 
                  : "border-[#1C1917]/10 opacity-60 hover:opacity-85"
              }`}
            >
              {/* Question Context Meta Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1C1917]/5 text-[#1C1917]/60 border border-[#1C1917]/5">
                    Q{index + 1} · {getTypeLabel(q.type)}
                  </span>
                  {q.is_required && <span className="font-bold text-sm" style={{ color: branding.primary_color || '#1C1917' }}>*</span>}
                </div>
                
                {/* Immediate Canvas Deletion Node */}
                {isActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(q.id);
                    }}
                    className="text-[#1C1917]/40 hover:text-red-600 transition-colors p-1 rounded hover:bg-[#1C1917]/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* ⚡ INLINE PROMPT EDITOR: Complete Locality of Behavior */}
              <input
                type="text"
                className="w-full font-semibold text-base tracking-tight text-[#1C1917] bg-transparent border-none outline-none focus:ring-0 p-0 mb-2 placeholder:text-[#1C1917]/20 placeholder:italic placeholder:font-normal"
                value={q.prompt}
                onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                placeholder="Type your question prompt inline here..."
                onClick={(e) => e.stopPropagation()}
              />

              {/* Render Type Structural Mockups & Inline Option Controllers */}
              {q.type === "short_text" && (
                <div className="border-b border-[#1C1917]/10 w-full pt-4 pb-1 text-[#1C1917]/20 text-xs italic font-mono">
                  Respondent short response vector will input here...
                </div>
              )}

              {q.type === "multiple_choice" && (
                <div className="space-y-2 mt-4" onClick={(e) => e.stopPropagation()}>
                  {q.options?.map((opt, idx) => (
                    <div 
                      key={opt.id} 
                      className="flex items-center gap-3 px-4 py-2 border border-[#1C1917]/10 bg-[#F7F4EF]/20 rounded-lg text-xs font-medium text-[#1C1917]/70 focus-within:border-[#1C1917]/40 transition-colors group/opt"
                    >
                      <div className="w-3.5 h-3.5 rounded-full border border-[#1C1917]/20 bg-[#FDFBF8] shrink-0" />
                      
                      {/* ⚡ INLINE OPTION STRING EDITOR */}
                      <input
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-medium text-[#1C1917] placeholder:text-[#1C1917]/30"
                        value={opt.value}
                        onChange={(e) => {
                          const nextOpts = [...(q.options || [])];
                          nextOpts[idx].value = e.target.value;
                          updateQuestion(q.id, { options: nextOpts });
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                      
                      {/* Option Purge Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextOpts = (q.options || []).filter((o) => o.id !== opt.id);
                          updateQuestion(q.id, { options: nextOpts });
                        }}
                        className="opacity-0 group-hover/opt:opacity-100 text-[#1C1917]/30 hover:text-red-500 transition-all p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const nextOpts = [...(q.options || []), { id: crypto.randomUUID(), value: `Option ${(q.options?.length || 0) + 1}` }];
                      updateQuestion(q.id, { options: nextOpts });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1C1917]/40 underline mt-2 hover:text-[#1C1917] transition-colors pl-1"
                  >
                    <Plus className="h-3 w-3" /> Add Choice
                  </button>
                </div>
              )}

              {q.type === "rating" && (
                <div className="flex gap-1.5 mt-5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="w-9 h-9 border border-[#1C1917]/10 rounded-lg flex items-center justify-center font-mono text-xs font-semibold bg-[#F7F4EF]/10 text-[#1C1917]/40">
                      {num}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function RightSettings() {
  const { questions, activeQuestionId, updateQuestion, branding, setBranding } = useSurveyBuilder();
  const activeQuestion = questions.find((q) => q.id === activeQuestionId);

  return (
    <div className="w-80 border-l border-[#1C1917]/10 bg-[#FDFBF8] p-6 flex flex-col gap-6 overflow-y-auto relative z-10 shadow-sm">
      {/* Global Theme Settings Layout Section */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#1C1917]/40 mb-4 font-mono">Global Branding</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#1C1917]/60 block mb-1.5">Accent Brand Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-8 h-8 rounded-md border border-[#1C1917]/20 p-0 cursor-pointer bg-transparent overflow-hidden"
                value={branding.primary_color}
                onChange={(e) => setBranding((prev) => ({ ...prev, primary_color: e.target.value }))}
              />
              <input
                type="text"
                className="flex-1 border border-[#1C1917]/10 rounded-md p-1.5 text-xs font-mono uppercase bg-[#F7F4EF]/30 text-[#1C1917]"
                value={branding.primary_color}
                onChange={(e) => setBranding((prev) => ({ ...prev, primary_color: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#1C1917]/60 block mb-1.5">Logo Target URL</label>
            <input
              type="text"
              placeholder="https://brand.com/logo.png"
              className="w-full border border-[#1C1917]/10 p-2 text-xs bg-[#F7F4EF]/30 rounded-md outline-none focus:border-[#1C1917] font-mono"
              value={branding.logo_url || ""}
              onChange={(e) => setBranding((prev) => ({ ...prev, logo_url: e.target.value || null }))}
            />
          </div>
        </div>
      </div>

      <hr className="border-[#1C1917]/10" />

      {/* Block Parameters Section */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#1C1917]/40 mb-4 font-mono">Block Rules</h2>
        {activeQuestion ? (
          <div className="space-y-4">
            {/* Contextual Logic Switch Toggle */}
            <div className="flex items-center justify-between py-2.5 border-b border-[#1C1917]/5">
              <span className="text-xs font-semibold text-[#1C1917]/80">Mark field as required</span>
              <button
                type="button"
                onClick={() => updateQuestion(activeQuestion.id, { is_required: !activeQuestion.is_required })}
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
            
            <p className="text-[11px] text-[#1C1917]/40 italic leading-normal">
              Edit text prompt and option properties directly inside the canvas layout workspace cards.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#1C1917]/40 italic leading-relaxed">Select a survey element on the canvas to inspect its validation rule architecture.</p>
        )}
      </div>
    </div>
  );
}