import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { LanguageToggle } from '@/components/layout/language-toggle'
import { BrandMark } from '@/components/layout/brand-mark'

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
      navigate({ to: '/collection' })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !token.trim()) {
      return
    }

    setIsLoading(true)

    try {
      await login(username.trim(), token.trim())
      toast.success(t('auth.loginSuccess'))
      navigate({ to: '/collection' })
    } catch {
      toast.error(t('auth.loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(1200px_circle_at_top,rgba(120,120,120,0.16),transparent_60%)] p-4">
      <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-primary/15 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute right-[-6rem] top-1/3 h-72 w-72 rounded-full bg-secondary/25 blur-3xl animate-float-slower" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl animate-float-slowest" />
      {/* Theme and language toggles with fade-in animation */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
        <LanguageToggle />
        <ModeToggle />
      </div>

      {/* Main login card with stagger animation */}
      <Card className="z-10 w-full max-w-md bg-card/80 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 fill-mode-backwards">
        <CardHeader className="text-center">
          {/* App logo/icon with spin animation on mount */}
          <BrandMark className="mx-auto mb-4 animate-in spin-in duration-700 fill-mode-backwards delay-150" />
          <CardTitle className="text-2xl animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards delay-300">
            {t('app.name')}
          </CardTitle>
          <CardDescription className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards delay-400">
            {t('app.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards delay-500">
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
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards delay-600">
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
              className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards"
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
