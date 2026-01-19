import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { BrandMark } from '@/components/layout/brand-mark'
import { LanguageToggle } from '@/components/layout/language-toggle'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { getAndClearRedirectUrl } from '@/lib/redirect-utils'

export const Route = createFileRoute('/login')({
  component: LoginPage
})

function LoginPage() {
  const { t } = useTranslation()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = getAndClearRedirectUrl() ?? '/collection'
      void navigate({ to: redirectUrl })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!username.trim() || !token.trim()) {
      return
    }

    setIsLoading(true)

    try {
      await login(username.trim(), token.trim())
      toast.success(t('auth.loginSuccess'))
      // Navigation is handled by the useEffect when isAuthenticated becomes true
    } catch {
      toast.error(t('auth.loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(1200px_circle_at_top,rgba(120,120,120,0.16),transparent_60%)] p-4">
      <div className="bg-primary/15 animate-float-slow pointer-events-none absolute top-12 -left-24 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-secondary/25 animate-float-slower pointer-events-none absolute top-1/3 right-[-6rem] h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-accent/20 animate-float-slowest pointer-events-none absolute bottom-[-6rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl" />
      {/* Theme and language toggles with fade-in animation */}
      <div className="animate-in fade-in slide-in-from-top-2 absolute top-4 right-4 z-10 flex items-center gap-2 duration-500">
        <LanguageToggle />
        <ModeToggle />
      </div>

      {/* Main login card with stagger animation */}
      <Card className="bg-card/80 animate-in fade-in zoom-in-95 fill-mode-backwards z-10 w-full max-w-md shadow-2xl backdrop-blur-xl duration-500">
        <CardHeader className="text-center">
          {/* App logo/icon with spin animation on mount */}
          <BrandMark className="animate-in spin-in fill-mode-backwards mx-auto mb-4 delay-150 duration-700" />
          <CardTitle className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards text-2xl delay-300 duration-500">
            {t('app.name')}
          </CardTitle>
          <CardDescription className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards delay-400 duration-500">
            {t('app.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
            className="space-y-4"
          >
            <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards space-y-3 delay-500 duration-500">
              <Label htmlFor="username">{t('auth.username')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('auth.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                className="transition-all duration-200 focus:scale-[1.01]"
              />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards space-y-3 delay-600 duration-500">
              <Label htmlFor="token">{t('auth.token')}</Label>
              <Input
                id="token"
                type="password"
                placeholder={t('auth.tokenPlaceholder')}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="transition-all duration-200 focus:scale-[1.01]"
              />
            </div>
            <Button
              type="submit"
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards w-full duration-500"
              disabled={isLoading || !username.trim() || !token.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.loggingIn')}
                </>
              ) : (
                t('auth.loginButton')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
