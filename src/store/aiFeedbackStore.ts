import { create } from 'zustand'
import type { RegistrationResult } from '../webmcp/modelContext'

export type AiPriority = 'high' | 'medium' | 'low'

export interface AiRecommendation {
  title: string
  detail: string | null
  priority: AiPriority | null
}

export interface AiEstimate {
  label: string
  value: string
  note: string | null
}

/** One AI analysis shown on a panel — always plain text, rendered escaped (never as HTML). */
export interface AiFeedback {
  target: string
  title: string | null
  summary: string
  recommendations: AiRecommendation[]
  estimates: AiEstimate[]
  observations: string[]
  receivedAt: string
  /** Until the user opens it — drives the dot on the panel's AI icon. */
  unread: boolean
}

const STORAGE_KEY = 'ninfo:ai-feedback'
// Per data source; oldest analyses are dropped first past this.
const MAX_PER_SOURCE = 200

type Persisted = Record<string, Record<string, AiFeedback>>

function readAll(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeSource(sourceKey: string, feedback: Record<string, AiFeedback>) {
  try {
    const all = readAll()
    const entries = Object.values(feedback)
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .slice(0, MAX_PER_SOURCE)
    all[sourceKey] = Object.fromEntries(entries.map((f) => [f.target, f]))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable or full — the analysis still shows for this session.
  }
}

interface AiFeedbackState {
  /** Which data source the feedback belongs to — demo, upload, or a specific linked sheet. */
  sourceKey: string | null
  feedback: Record<string, AiFeedback>
  /** WebMCP registration outcome, null until App has tried (see WebMcpBridge). */
  webmcp: RegistrationResult | null

  setSource: (sourceKey: string | null) => void
  setFeedback: (feedback: AiFeedback) => void
  markRead: (target: string) => void
  removeFeedback: (target: string) => void
  setWebMcpStatus: (status: RegistrationResult) => void
}

export const useAiFeedbackStore = create<AiFeedbackState>((set, get) => ({
  sourceKey: null,
  feedback: {},
  webmcp: null,

  setSource: (sourceKey) => {
    if (sourceKey === get().sourceKey) return
    set({ sourceKey, feedback: sourceKey ? readAll()[sourceKey] ?? {} : {} })
  },

  setFeedback: (feedback) => {
    const next = { ...get().feedback, [feedback.target]: feedback }
    set({ feedback: next })
    const { sourceKey } = get()
    if (sourceKey) writeSource(sourceKey, next)
  },

  markRead: (target) => {
    const existing = get().feedback[target]
    if (!existing?.unread) return
    get().setFeedback({ ...existing, unread: false })
  },

  removeFeedback: (target) => {
    const next = { ...get().feedback }
    delete next[target]
    set({ feedback: next })
    const { sourceKey } = get()
    if (sourceKey) writeSource(sourceKey, next)
  },

  setWebMcpStatus: (status) => set({ webmcp: status }),
}))

/** True when the AI affordances should show at all: an agent is connected or analysis exists. */
export function useAiAvailable(target: string): boolean {
  return useAiFeedbackStore((s) => Boolean(s.webmcp?.registered.length) || Boolean(s.feedback[target]))
}
