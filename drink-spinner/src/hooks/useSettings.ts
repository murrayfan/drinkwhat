import { useCallback, useState } from 'react'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../lib/storage'
import type { AppSettings } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings)

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS)
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return { settings, update, reset }
}
