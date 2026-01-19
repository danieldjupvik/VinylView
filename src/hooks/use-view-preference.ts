import { useEffect, useState } from 'react'

import { getViewMode, setViewMode, type ViewMode } from '@/lib/storage'

export function useViewPreference() {
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
