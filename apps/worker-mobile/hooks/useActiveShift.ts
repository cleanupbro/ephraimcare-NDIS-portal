import { useState, useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useShiftStore } from '../stores/shiftStore'

export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useElapsedTimer() {
  const getActiveStartDate = useShiftStore((s) => s.getActiveStartDate)
  const activeShiftId = useShiftStore((s) => s.activeShiftId)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  const calcElapsed = () => {
    const start = getActiveStartDate()
    if (!start) return 0
    return Math.floor((Date.now() - start.getTime()) / 1000)
  }

  useEffect(() => {
    if (!activeShiftId) {
      setElapsed(0)
      return
    }

    setElapsed(calcElapsed())

    intervalRef.current = setInterval(() => {
      setElapsed(calcElapsed())
    }, 1000)

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        setElapsed(calcElapsed())
      }
      appStateRef.current = nextState
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      subscription.remove()
    }
  }, [activeShiftId])

  return { elapsed, formatted: formatElapsed(elapsed), isActive: !!activeShiftId }
}
