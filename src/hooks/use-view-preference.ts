import { useEffect, useState } from 'react'

import { getViewMode, setViewMode, type ViewMode } from '@/lib/storage'

interface ViewPreference {
  viewMode: ViewMode
  toggleView: () => void
  isGrid: boolean
  isTable: boolean
}

export function useViewPreference(): ViewPreference {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => getViewMode())

  useEffect(() => {
    setViewMode(viewMode)
  }, [viewMode])

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
