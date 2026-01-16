import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/collection')({
  component: CollectionPage
})

function CollectionPage() {
  const { t } = useTranslation()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('collection.title')}</h1>
      {/* Collection grid will be added in Phase 7 */}
      <p className="mt-4 text-muted-foreground">{t('collection.loading')}</p>
    </div>
  )
}
