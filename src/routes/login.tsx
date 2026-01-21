import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { BrandMark } from '@/components/layout/brand-mark'
import { LanguageToggle } from '@/components/layout/language-toggle'
import { ModeToggle } from '@/components/layout/mode-toggle'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
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

/**
 * Visual vinyl record showcase component for desktop view
 */
function VinylShowcase(): React.JSX.Element {
  return (
    <div className="relative" aria-hidden="true">
      {/* Vinyl record container */}
      <div className="relative h-80 w-80 xl:h-96 xl:w-96">
        {/* Spinning vinyl record */}
        <div className="animate-vinyl-spin-slow absolute inset-0">
          {/* Outer ring / vinyl body */}
          <div className="dark:from-foreground/25 dark:to-foreground/10 absolute inset-0 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-800" />

          {/* Groove rings */}
          <div className="dark:border-foreground/20 absolute inset-4 rounded-full border border-zinc-700" />
          <div className="dark:border-foreground/15 absolute inset-6 rounded-full border border-zinc-600" />
          <div className="dark:border-foreground/20 absolute inset-8 rounded-full border border-zinc-700" />
          <div className="dark:border-foreground/15 absolute inset-10 rounded-full border border-zinc-600" />
          <div className="dark:border-foreground/20 absolute inset-12 rounded-full border border-zinc-700" />
          <div className="dark:border-foreground/15 absolute inset-14 rounded-full border border-zinc-600" />
          <div className="dark:border-foreground/20 absolute inset-16 rounded-full border border-zinc-700" />
          <div className="dark:border-foreground/15 absolute inset-20 rounded-full border border-zinc-600" />
          <div className="dark:border-foreground/20 absolute inset-24 rounded-full border border-zinc-700" />

          {/* Center label */}
          <div className="from-primary/50 to-primary/30 absolute inset-[35%] rounded-full bg-gradient-to-br" />
          {/* Small vinyl icon - positioned at top of label */}
          <div className="absolute top-[39%] left-1/2 -translate-x-1/2">
            <svg
              viewBox="0 0 24 24"
              className="dark:text-primary-foreground/90 h-3 w-3 text-zinc-900 xl:h-4 xl:w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 5c3.87 0 7 3.13 7 7" strokeLinecap="round" />
            </svg>
          </div>
          {/* RPM text - positioned at bottom of label */}
          <span className="dark:text-primary-foreground/90 absolute bottom-[39%] left-1/2 -translate-x-1/2 text-[10px] font-medium text-zinc-900 xl:text-xs">
            {'33⅓'}
          </span>
          {/* Center hole */}
          <div className="bg-background/90 absolute inset-[47%] rounded-full" />
        </div>
      </div>
    </div>
  )
}

function LoginPage(): React.JSX.Element {
  const { t } = useTranslation()
  const { isAuthenticated, validateOAuthTokens } = useAuth()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)

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
    setError(null)

    try {
      await validateOAuthTokens()
      // Navigation handled by isAuthenticated effect
    } catch {
      // Tokens were invalid, they've been cleared
      const errorMessage = t('auth.oauthSessionExpired')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsValidating(false)
    }
  }

  /**
   * Use different account - clear tokens and start fresh OAuth flow
   */
  const handleUseDifferentAccount = () => {
    setShowSwitchDialog(false)
    setError(null)
    removeOAuthTokens()
    // Force re-render by triggering OAuth flow
    void handleOAuthLogin()
  }

  /**
   * Start new OAuth flow
   */
  const handleOAuthLogin = async () => {
    setIsLoading(true)
    setError(null)

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
      const errorMessage = t('auth.oauthError')
      setError(errorMessage)
      toast.error(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,rgba(120,120,120,0.16),transparent_60%)]">
      {/* Floating gradient orbs */}
      <div className="bg-primary/15 animate-float-slow pointer-events-none absolute top-12 -left-24 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-secondary/25 animate-float-slower pointer-events-none absolute top-1/3 right-[-6rem] h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-accent/20 animate-float-slowest pointer-events-none absolute bottom-[-6rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl" />

      {/* Theme and language toggles */}
      <div className="animate-in fade-in slide-in-from-top-2 absolute top-4 right-4 z-10 flex items-center gap-2 duration-500">
        <LanguageToggle />
        <ModeToggle />
      </div>

      {/* Main layout - split on desktop with max-width for widescreen */}
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Visual showcase panel (desktop only) */}
        <div className="hidden items-center justify-end pr-12 lg:flex xl:pr-16">
          <VinylShowcase />
        </div>

        {/* Login section */}
        <div className="flex items-center justify-center p-4 sm:p-6 lg:justify-start lg:pr-8 lg:pl-12 xl:pl-16">
          <Card className="lg:bg-card/80 z-10 w-full max-w-md border-0 bg-transparent shadow-none lg:border lg:shadow-2xl lg:backdrop-blur-xl">
            <CardHeader className="pt-8 pb-6 text-center">
              {/* App logo with spin animation */}
              <BrandMark
                size="lg"
                className="animate-in spin-in fill-mode-backwards mx-auto mb-6 delay-500 duration-700"
              />
              <CardTitle className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards text-3xl delay-600 duration-500">
                {t('app.name')}
              </CardTitle>
              <CardDescription className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards mt-2 text-base delay-700 duration-500">
                {t('login.subtitle')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 px-6 pb-8">
              {/* Inline error display */}
              {error !== null && (
                <div
                  role="alert"
                  className="animate-in fade-in slide-in-from-top-1 border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-3 text-sm duration-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login actions */}
              {hasExistingSession ? (
                // Welcome back flow - user has existing tokens
                <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards space-y-4 delay-800 duration-500">
                  <div className="mb-2 text-center">
                    <p className="text-lg font-medium">
                      {t('auth.welcomeBack', { username: storedUsername })}
                    </p>
                  </div>
                  <Button
                    onClick={() => void handleContinue()}
                    className="w-full"
                    size="lg"
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
                  <AlertDialog
                    open={showSwitchDialog}
                    onOpenChange={setShowSwitchDialog}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
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
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('auth.switchAccount.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('auth.switchAccount.description')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleUseDifferentAccount}
                          className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                          {t('auth.switchAccount.confirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                // Fresh login - no existing tokens
                <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards space-y-3 delay-800 duration-500">
                  <Button
                    onClick={() => void handleOAuthLogin()}
                    className="w-full"
                    size="lg"
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
                  <p className="text-muted-foreground text-center text-sm">
                    {t('login.connectAccount')}
                  </p>
                </div>
              )}

              {/* Public browse section */}
              <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards border-border border-t pt-8 delay-900 duration-500">
                <p className="text-muted-foreground mb-4 text-center text-sm">
                  {t('login.publicBrowse.title')}
                  <span className="text-muted-foreground/60 ml-2 text-xs">
                    {t('common.comingSoon')}
                  </span>
                </p>
                <div className="mx-auto flex max-w-xs gap-2 opacity-50">
                  <Label htmlFor="public-browse-username" className="sr-only">
                    {t('login.publicBrowse.placeholder')}
                  </Label>
                  <Input
                    id="public-browse-username"
                    type="text"
                    placeholder={t('login.publicBrowse.placeholder')}
                    className="flex-1"
                    disabled
                    aria-disabled="true"
                  />
                  <Button type="button" variant="outline" disabled>
                    {t('login.publicBrowse.button')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
