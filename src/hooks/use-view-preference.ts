import { useState } from 'react'

import type { ViewMode } from '@/types/preferences'

// Temporary implementation - file will be deleted in next task
function getViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'grid'
  const stored = localStorage.getItem('vinyldeck-prefs')
  if (!stored) return 'grid'
  try {
    const prefs = JSON.parse(stored) as { state?: { viewMode?: string } }
    return prefs.state?.viewMode === 'table' ? 'table' : 'grid'
  } catch {
    return 'grid'
  }
}

interface ViewPreference {
  viewMode: ViewMode
  toggleView: () => void
  isGrid: boolean
  isTable: boolean
}

export function useViewPreference(): ViewPreference {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => getViewMode())

  // Note: Persistence now handled by Zustand preferences store
  // This hook is temporary and will be deleted in next task

  const toggleView = () => {
    setViewModeState((current) => (current === 'grid' ? 'table' : 'grid'))
  }

  return {
    viewMode,
    toggleView,
    isGrid: viewMode === 'grid',
    isTable: viewMode === 'table'
  }
}
