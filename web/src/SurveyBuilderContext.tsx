import type React from 'react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export type QuestionType = 'short_text' | 'multiple_choice' | 'rating'

export interface QuestionOption {
  id: string
  value: string
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  is_required: boolean
  options?: QuestionOption[]
}

export interface Branding {
  title: string
  primary_color: string
  logo_url: string | null
  slug: string
}

interface SurveyBuilderContextType {
  questions: Question[]
  activeQuestionId: string | null
  branding: Branding
  isLoading: boolean
  isSaving: boolean
  moveQuestionUp: (id: string) => void
  moveQuestionDown: (id: string) => void
  setActiveQuestionId: (id: string | null) => void
  setBranding: React.Dispatch<React.SetStateAction<Branding>>
  addQuestion: (type: QuestionType) => void
  updateQuestion: (id: string, fields: Partial<Question>) => void
  removeQuestion: (id: string) => void
  saveSurvey: () => Promise<void>
}

const SurveyBuilderContext = createContext<SurveyBuilderContextType | undefined>(undefined)

export function SurveyBuilderProvider({
  surveyId,
  children,
}: {
  surveyId: string
  children: React.ReactNode
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [branding, setBranding] = useState<Branding>({
    title: '',
    primary_color: '#1C1917',
    logo_url: null,
    slug: '',
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const isInitialLoad = useRef(true)

  // --- 1. HYDRATION: Fetch current structure from database on mount ---
  useEffect(() => {
    async function loadSurvey() {
      setIsLoading(true)
      try {
        const response = await fetch(`http://localhost:8787/api/surveys/${surveyId}`, {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setBranding({
            title: data.title || 'Untitled Survey Structure',
            primary_color: data.primary_color || '#1C1917',
            logo_url: data.logo_url || null,
            slug: data.slug || '',
          })
          setQuestions(data.questions || [])
          if (data.questions && data.questions.length > 0) {
            setActiveQuestionId(data.questions[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to load survey layout:', error)
      } finally {
        setIsLoading(false)
        setTimeout(() => {
          isInitialLoad.current = false
        }, 100)
      }
    }
    loadSurvey()
  }, [surveyId])

  // --- 2. SYNCHRONIZATION: The Core Save Pipeline ---
  // Memoized so it can be safely used as a dependency
  const saveSurvey = useCallback(async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`http://localhost:8787/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: branding.title,
          slug: branding.slug,
          primary_color: branding.primary_color,
          logo_url: branding.logo_url,
          questions: questions,
        }),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Sync failed')
    } catch (error) {
      console.error('Autosave synchronization failure:', error)
    } finally {
      setIsSaving(false)
    }
  }, [surveyId, branding, questions])

  // --- 3. AUTOSAVE: Debounced state listener ---
  useEffect(() => {
    if (isInitialLoad.current) return

    const timer = setTimeout(() => {
      saveSurvey()
    }, 800)

    return () => clearTimeout(timer)
  }, [saveSurvey]) // Now depends on the stable memoized function

  // --- 4. STATE UTILITIES ---
  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      prompt: '',
      is_required: false,
      options:
        type === 'multiple_choice' ? [{ id: crypto.randomUUID(), value: 'Option 1' }] : undefined,
    }
    setQuestions((prev) => [...prev, newQuestion])
    setActiveQuestionId(newQuestion.id)
  }

  const updateQuestion = (id: string, fields: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...fields } : q)))
  }

  const removeQuestion = (id: string) => {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== id)
      if (activeQuestionId === id) {
        setActiveQuestionId(filtered.length > 0 ? (filtered[0]?.id ?? null) : null)
      }
      return filtered
    })
  }

  const moveQuestionUp = (id: string) => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id)
      if (index <= 0) return prev
      const newQuestions = [...prev]
      const current = newQuestions[index]
      const above = newQuestions[index - 1]
      if (current && above) {
        ;[newQuestions[index - 1], newQuestions[index]] = [current, above]
      }
      return newQuestions
    })
  }

  const moveQuestionDown = (id: string) => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id)
      if (index < 0 || index >= prev.length - 1) return prev
      const newQuestions = [...prev]
      const current = newQuestions[index]
      const below = newQuestions[index + 1]
      if (current && below) {
        ;[newQuestions[index], newQuestions[index + 1]] = [below, current]
      }
      return newQuestions
    })
  }

  return (
    <SurveyBuilderContext.Provider
      value={{
        questions,
        activeQuestionId,
        branding,
        isLoading,
        isSaving,
        moveQuestionUp,
        moveQuestionDown,
        setActiveQuestionId,
        setBranding,
        addQuestion,
        updateQuestion,
        removeQuestion,
        saveSurvey,
      }}
    >
      {children}
    </SurveyBuilderContext.Provider>
  )
}

export function useSurveyBuilder() {
  const context = useContext(SurveyBuilderContext)
  if (!context) throw new Error('useSurveyBuilder must be used within a SurveyBuilderProvider')
  return context
}
