import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
  if (isAuthenticated) {
    navigate({ to: '/collection' })
    return null
  }

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('app.name')}</CardTitle>
          <CardDescription>{t('app.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.username')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('auth.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">{t('auth.token')}</Label>
              <Input
                id="token"
                type="password"
                placeholder={t('auth.tokenPlaceholder')}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !username.trim() || !token.trim()}
            >
              {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
