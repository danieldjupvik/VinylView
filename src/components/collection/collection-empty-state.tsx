import { Disc3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function CollectionEmptyState(): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="animate-in fade-in zoom-in-95 flex flex-col items-center justify-center py-20 text-center duration-500">
      <div className="animate-in spin-in fill-mode-backwards duration-700">
        <Disc3 className="text-muted-foreground h-20 w-20 opacity-50" />
      </div>
      <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards mt-6 text-lg font-medium delay-200 duration-500">
        {t('collection.empty')}
      </p>
    </div>
  )
}
