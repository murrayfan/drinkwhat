import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom 沒有實作的瀏覽器 API
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
