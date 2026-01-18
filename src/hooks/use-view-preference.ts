import { useState } from 'react'
import { getViewMode, setViewMode, type ViewMode } from '@/lib/storage'

export function useViewPreference() {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => getViewMode())

  const toggleView = () => {
    setViewModeState((current) => {
      const next: ViewMode = current === 'grid' ? 'table' : 'grid'
      setViewMode(next)
      return next
    })
  }

  return {
    viewMode,
    toggleView,
    isGrid: viewMode === 'grid',
    isTable: viewMode === 'table'
  }
}
