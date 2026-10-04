import { useCallback, useState } from 'react'
import { loadHistory, saveHistory } from '../lib/storage'
import type { Choice, HistoryEntry } from '../types'

export function useHistory() {
  const [history, setHistory] = useState(loadHistory)

  const add = useCallback((choice: Choice) => {
    setHistory((prev) => {
      const next: HistoryEntry[] = [{ kind: choice.kind, id: choice.id, name: choice.name, at: Date.now() }, ...prev]
      saveHistory(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    saveHistory([])
    setHistory([])
  }, [])

  return { history, add, clear }
}
