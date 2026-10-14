import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useAiFeedbackStore } from '../store/aiFeedbackStore'
import { registerTools } from './modelContext'
import { NINFO_TOOLS } from './tools'

/**
 * Registers Ninfo's WebMCP tools once for the app's lifetime (handlers read live state from the
 * stores, so nothing re-registers on render) and keeps AI feedback scoped to the loaded source.
 * Renders nothing; without WebMCP it only records `supported: false`.
 */
export default function WebMcpBridge() {
  const sourceKey = useAppStore((s) =>
    !s.meta ? null : s.meta.mode === 'sheet-link' ? `sheet:${s.sheetLinkId}` : s.meta.mode
  )

  useEffect(() => {
    useAiFeedbackStore.getState().setSource(sourceKey)
  }, [sourceKey])

  useEffect(() => {
    // Aborting unregisters every tool — this also absorbs StrictMode's double mount.
    // `cancelled` (not the signal) tells a cleanup apart from a failed registration, which
    // aborts the signal itself.
    const controller = new AbortController()
    let cancelled = false
    registerTools(NINFO_TOOLS, controller).then((result) => {
      if (!cancelled) useAiFeedbackStore.getState().setWebMcpStatus(result)
    })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return null
}
