import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { APP_VERSION } from '@/lib/constants'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage
})

function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('app.name')}</CardTitle>
            <CardDescription>{t('app.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('settings.version')}
                </span>
                <span className="text-sm font-mono">{APP_VERSION}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
