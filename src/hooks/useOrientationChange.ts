import { useEffect, useRef } from 'react'

/** Runs `onChange` whenever the device orientation flips, so components with their own imperative
 * sizing (e.g. a chart.js instance) can recompute instead of relying solely on layout/CSS to catch
 * up. `resize` is also watched as a fallback for browsers that don't fire `orientationchange`, and
 * the call is debounced since mobile browsers can report stale viewport dimensions for a moment
 * right as the event fires. */
export function useOrientationChange(onChange: () => void) {
  const latest = useRef(onChange)
  useEffect(() => {
    latest.current = onChange
  })

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const handle = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => latest.current(), 150)
    }
    window.addEventListener('orientationchange', handle)
    window.addEventListener('resize', handle)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('orientationchange', handle)
      window.removeEventListener('resize', handle)
    }
  }, [])
}
