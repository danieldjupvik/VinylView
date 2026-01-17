import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { APP_VERSION } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { usePreferences } from '@/hooks/use-preferences'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage
})

function SettingsPage() {
  const { t } = useTranslation()
  const { username, avatarUrl } = useAuth()
  const { avatarSource, gravatarUrl, setAvatarSource } = usePreferences()
  const initials = username
    ? username
        .split(/[\s_-]/)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="mt-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile.title')}</CardTitle>
            <CardDescription>
              {t('settings.profile.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">
                  {t('settings.profile.avatar.title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.profile.avatar.description')}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAvatarSource('discogs')}
                  className={cn(
                    'hover:bg-accent/50 flex w-full items-center gap-3 rounded-md border p-3 text-left transition',
                    avatarSource === 'discogs'
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border'
                  )}
                >
                  <Avatar className="size-10 rounded-md">
                    {avatarUrl ? (
                      <AvatarImage
                        src={avatarUrl}
                        alt={username ?? 'User'}
                        className="rounded-md object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="rounded-md text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {t('settings.profile.avatar.discogs')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('settings.profile.avatar.discogsHint')}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarSource('gravatar')}
                  className={cn(
                    'hover:bg-accent/50 flex w-full items-center gap-3 rounded-md border p-3 text-left transition',
                    avatarSource === 'gravatar'
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border'
                  )}
                >
                  <Avatar className="size-10 rounded-md">
                    {gravatarUrl ? (
                      <AvatarImage
                        src={gravatarUrl}
                        alt={username ?? 'User'}
                        className="rounded-md object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="rounded-md text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {t('settings.profile.avatar.gravatar')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('settings.profile.avatar.gravatarHint')}
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.profile.gravatarEmail')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.profile.gravatarFetched')}
              </p>
            </div>
          </CardContent>
        </Card>
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
