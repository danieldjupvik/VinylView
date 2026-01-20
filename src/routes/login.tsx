import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { useAuth } from '@/hooks/use-auth'
import { getAndClearRedirectUrl } from '@/lib/redirect-utils'
import {
  getOAuthTokens,
  getUsername,
  removeOAuthTokens,
  setOAuthRequestTokens
} from '@/lib/storage'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/login')({
  component: LoginPage
})

function LoginPage() {
  const { t } = useTranslation()
  const { isAuthenticated, validateOAuthTokens } = useAuth()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Check if user has existing tokens (signed out but can quick-login)
  const existingTokens = getOAuthTokens()
  const storedUsername = getUsername()
  const hasExistingSession = existingTokens !== null && storedUsername !== null

  const getRequestToken = trpc.oauth.getRequestToken.useMutation()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = getAndClearRedirectUrl() ?? '/collection'
      void navigate({ to: redirectUrl })
    }
  }, [isAuthenticated, navigate])

  /**
   * Continue with existing tokens (Welcome back flow)
   */
  const handleContinue = async () => {
    setIsValidating(true)

    try {
      await validateOAuthTokens()
      // Navigation handled by isAuthenticated effect
    } catch {
      // Tokens were invalid, they've been cleared
      toast.error(t('auth.oauthSessionExpired'))
    } finally {
      setIsValidating(false)
    }
  }

  /**
   * Use different account - clear tokens and start fresh OAuth flow
   */
  const handleUseDifferentAccount = () => {
    removeOAuthTokens()
    // Force re-render by triggering OAuth flow
    void handleOAuthLogin()
  }

  /**
   * Start new OAuth flow
   */
  const handleOAuthLogin = async () => {
    setIsLoading(true)

    try {
      // Build the callback URL based on current origin
      const callbackUrl = `${window.location.origin}/oauth-callback`

      // Get request token from server
      const result = await getRequestToken.mutateAsync({ callbackUrl })

      // Store request tokens in sessionStorage for the callback
      setOAuthRequestTokens({
        requestToken: result.requestToken,
        requestTokenSecret: result.requestTokenSecret
      })

      // Redirect to Discogs authorization page
      window.location.href = result.authorizeUrl
    } catch {
      toast.error(t('auth.oauthError'))
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
          {hasExistingSession ? (
            // Welcome back flow - user has existing tokens
            <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards space-y-3 delay-500 duration-500">
              <p className="text-muted-foreground text-center text-sm">
                {t('auth.welcomeBack', { username: storedUsername })}
              </p>
              <Button
                onClick={() => void handleContinue()}
                className="w-full"
                disabled={isValidating || isLoading}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.loggingIn')}
                  </>
                ) : (
                  t('auth.continue')
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleUseDifferentAccount}
                className="w-full"
                disabled={isValidating || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.redirecting')}
                  </>
                ) : (
                  t('auth.useDifferentAccount')
                )}
              </Button>
            </div>
          ) : (
            // Fresh login - no existing tokens
            <Button
              onClick={() => void handleOAuthLogin()}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards w-full delay-500 duration-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.redirecting')}
                </>
              ) : (
                t('auth.signInWithDiscogs')
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
