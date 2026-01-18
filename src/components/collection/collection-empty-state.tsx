import { Disc3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function CollectionEmptyState() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="animate-in spin-in duration-700 fill-mode-backwards">
        <Disc3 className="h-20 w-20 text-muted-foreground opacity-50" />
      </div>
      <p className="mt-6 text-lg font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards delay-200">
        {t('collection.empty')}
      </p>
    </div>
  )
}
