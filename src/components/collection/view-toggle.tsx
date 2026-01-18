import { LayoutGrid, TableProperties } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/lib/storage'

interface ViewToggleProps {
  viewMode: ViewMode
  onToggle: () => void
}

export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  const { t } = useTranslation()
  const isGrid = viewMode === 'grid'
  const label = isGrid ? t('collection.view.table') : t('collection.view.grid')

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-label={label}
      className="gap-2"
    >
      {isGrid ? (
        <TableProperties className="h-4 w-4" />
      ) : (
        <LayoutGrid className="h-4 w-4" />
      )}
      <span className="text-sm">{label}</span>
    </Button>
  )
}
