import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FileText, Monitor, Moon, Scale, Shield, Sun } from 'lucide-react'
import { NO, US } from 'country-flag-icons/react/3x2'
import { APP_VERSION } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { usePreferences } from '@/hooks/use-preferences'
import { useTheme } from '@/hooks/use-theme'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { Theme } from '@/providers/theme-context'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage
})

const normalizeLanguage = (value: string) => {
  const normalized = value.toLowerCase()
  if (
    normalized.startsWith('no') ||
    normalized.startsWith('nb') ||
    normalized.startsWith('nn')
  ) {
    return 'no'
  }
  return 'en'
}

interface SelectionCardProps {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  hint: string
}

function SelectionCard({
  selected,
  onClick,
  icon,
  title,
  hint
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-all duration-200 hover:scale-[1.02] hover:bg-accent/50 hover:shadow-md',
        selected ? 'border-primary/60 bg-primary/10 shadow-sm' : 'border-border'
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{hint}</div>
      </div>
    </button>
  )
}

function LanguageFlag({ lang }: { lang: 'en' | 'no' }) {
  const FlagComponent = lang === 'no' ? NO : US

  return (
    <span
      className="flex size-5 items-center justify-center overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <FlagComponent className="max-w-none scale-[1.8]" />
    </span>
  )
}

function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { username, avatarUrl } = useAuth()
  const { avatarSource, gravatarUrl, setAvatarSource } = usePreferences()
  const { theme, setTheme } = useTheme()
  const currentLanguage = normalizeLanguage(
    i18n.resolvedLanguage ?? i18n.language ?? 'en'
  )

  const initials = username
    ? username
        .split(/[\s_-]/)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {/* Profile Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards delay-100">
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
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAvatarSource('discogs')}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-all duration-200 hover:scale-[1.02] hover:bg-accent/50 hover:shadow-md',
                    avatarSource === 'discogs'
                      ? 'border-primary/60 bg-primary/10 shadow-sm'
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
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {t('settings.profile.avatar.discogs')}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t('settings.profile.avatar.discogsHint')}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarSource('gravatar')}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-all duration-200 hover:scale-[1.02] hover:bg-accent/50 hover:shadow-md',
                    avatarSource === 'gravatar'
                      ? 'border-primary/60 bg-primary/10 shadow-sm'
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
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {t('settings.profile.avatar.gravatar')}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t('settings.profile.avatar.gravatarHint')}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards delay-150">
          <CardHeader>
            <CardTitle>{t('settings.appearance.title')}</CardTitle>
            <CardDescription>
              {t('settings.appearance.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language Selection */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium">
                  {t('settings.appearance.language.title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.appearance.language.description')}
                </p>
              </div>
              <Select
                value={currentLanguage}
                onValueChange={(value) => i18n.changeLanguage(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <LanguageFlag lang={currentLanguage as 'en' | 'no'} />
                      <span>
                        {currentLanguage === 'en'
                          ? t('settings.appearance.language.english')
                          : t('settings.appearance.language.norwegian')}
                      </span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <span className="flex items-center gap-2">
                      <LanguageFlag lang="en" />
                      <span>{t('settings.appearance.language.english')}</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="no">
                    <span className="flex items-center gap-2">
                      <LanguageFlag lang="no" />
                      <span>{t('settings.appearance.language.norwegian')}</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Theme Selection */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">
                  {t('settings.appearance.theme.title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.appearance.theme.description')}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectionCard
                  selected={theme === 'light'}
                  onClick={() => setTheme('light' as Theme)}
                  icon={<Sun className="size-5 text-foreground/70" />}
                  title={t('settings.appearance.theme.light')}
                  hint={t('settings.appearance.theme.lightHint')}
                />
                <SelectionCard
                  selected={theme === 'dark'}
                  onClick={() => setTheme('dark' as Theme)}
                  icon={<Moon className="size-5 text-foreground/70" />}
                  title={t('settings.appearance.theme.dark')}
                  hint={t('settings.appearance.theme.darkHint')}
                />
                <SelectionCard
                  selected={theme === 'system'}
                  onClick={() => setTheme('system' as Theme)}
                  icon={<Monitor className="size-5 text-foreground/70" />}
                  title={t('settings.appearance.theme.system')}
                  hint={t('settings.appearance.theme.systemHint')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards delay-200">
          <CardHeader>
            <CardTitle>{t('settings.about.title')}</CardTitle>
            <CardDescription>{t('settings.about.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent/50 disabled:pointer-events-none disabled:opacity-50"
              >
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-sm">{t('settings.about.changelog')}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {t('common.comingSoon')}
                </span>
              </button>
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent/50 disabled:pointer-events-none disabled:opacity-50"
              >
                <Shield className="size-4 text-muted-foreground" />
                <span className="text-sm">{t('settings.about.privacy')}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {t('common.comingSoon')}
                </span>
              </button>
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent/50 disabled:pointer-events-none disabled:opacity-50"
              >
                <Scale className="size-4 text-muted-foreground" />
                <span className="text-sm">{t('settings.about.terms')}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {t('common.comingSoon')}
                </span>
              </button>
              <Separator className="my-3" />
              <div className="flex items-center justify-between px-2">
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
