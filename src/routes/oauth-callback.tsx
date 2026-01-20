import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BrandMark } from '@/components/layout/brand-mark'
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
  clearOAuthRequestTokens,
  getOAuthRequestTokens,
  setOAuthTokens
} from '@/lib/storage'
import { trpc } from '@/lib/trpc'

type OAuthCallbackStatus = 'loading' | 'error' | 'success'

type OAuthError =
  | 'denied'
  | 'missing_params'
  | 'session_expired'
  | 'exchange_failed'
  | 'validation_failed'

interface OAuthCallbackSearch {
  oauth_token: string | undefined
  oauth_verifier: string | undefined
  denied: string | undefined
}

/**
 * Normalize a URL search parameter value into a usable string.
 *
 * @param value - The raw search parameter value (often from router or URLSearchParams)
 * @returns The string value when `value` is a string, otherwise `undefined`
 */
function parseSearchParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export const Route = createFileRoute('/oauth-callback')({
  validateSearch: (search: Record<string, unknown>): OAuthCallbackSearch => ({
    oauth_token: parseSearchParam(search['oauth_token']),
    oauth_verifier: parseSearchParam(search['oauth_verifier']),
    denied: parseSearchParam(search['denied'])
  }),
  component: OAuthCallbackPage
})

/**
 * Handles the OAuth 1.0a callback flow: exchanges the temporary request token for access tokens,
 * validates and persists the resulting tokens, and redirects the user based on outcome.
 *
 * The component reads OAuth callback search parameters, shows loading/error/success UI states,
 * clears temporary request tokens on failure, and navigates to a stored redirect URL or the
 * default collection route on success.
 *
 * @returns A React element that renders the OAuth callback status UI.
 */
function OAuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { oauth_token, oauth_verifier, denied } = Route.useSearch()
  const { validateOAuthTokens } = useAuth()

  const [status, setStatus] = useState<OAuthCallbackStatus>('loading')
  const [error, setError] = useState<OAuthError | null>(null)

  // Prevent double execution in React StrictMode
  const hasStartedRef = useRef(false)

  const getAccessToken = trpc.oauth.getAccessToken.useMutation()

  useEffect(() => {
    // Guard against double execution (React StrictMode runs effects twice)
    if (hasStartedRef.current) {
      return
    }
    hasStartedRef.current = true

    const exchangeTokens = async () => {
      // Check if user denied authorization
      if (denied) {
        setError('denied')
        setStatus('error')
        clearOAuthRequestTokens()
        return
      }

      // Check for required URL parameters
      if (!oauth_token || !oauth_verifier) {
        setError('missing_params')
        setStatus('error')
        return
      }

      // Capture values after type narrowing for use in async context
      const token = oauth_token
      const verifier = oauth_verifier

      // Get the request token secret from session storage
      const requestTokens = getOAuthRequestTokens()
      if (!requestTokens) {
        setError('session_expired')
        setStatus('error')
        return
      }

      // Verify the oauth_token matches what we stored
      if (requestTokens.requestToken !== token) {
        setError('session_expired')
        setStatus('error')
        clearOAuthRequestTokens()
        return
      }

      try {
        // Exchange request token for access token
        const result = await getAccessToken.mutateAsync({
          requestToken: token,
          requestTokenSecret: requestTokens.requestTokenSecret,
          verifier: verifier
        })

        // Clear the temporary request tokens
        clearOAuthRequestTokens()

        const tokens = {
          accessToken: result.accessToken,
          accessTokenSecret: result.accessTokenSecret
        }

        // Validate tokens before storing - if validation fails, tokens are not persisted
        try {
          await validateOAuthTokens(tokens)
        } catch {
          setError('validation_failed')
          setStatus('error')
          return
        }

        // Store tokens only after successful validation
        setOAuthTokens(tokens)

        setStatus('success')

        // Navigate to the stored redirect URL or collection
        const redirectUrl = getAndClearRedirectUrl() ?? '/collection'
        void navigate({ to: redirectUrl })
      } catch {
        setError('exchange_failed')
        setStatus('error')
        clearOAuthRequestTokens()
      }
    }

    void exchangeTokens()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run once on mount
  }, [])

  const getErrorMessage = (): string => {
    switch (error) {
      case 'denied':
        return t('auth.oauthDenied')
      case 'missing_params':
        return t('auth.oauthMissingParams')
      case 'session_expired':
        return t('auth.oauthSessionExpired')
      case 'exchange_failed':
        return t('auth.oauthError')
      case 'validation_failed':
        return t('auth.oauthValidationFailed')
      default:
        return t('auth.oauthError')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(1200px_circle_at_top,rgba(120,120,120,0.16),transparent_60%)] p-4">
      <div className="bg-primary/15 animate-float-slow pointer-events-none absolute top-12 -left-24 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-secondary/25 animate-float-slower pointer-events-none absolute top-1/3 right-[-6rem] h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-accent/20 animate-float-slowest pointer-events-none absolute bottom-[-6rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl" />

      <Card className="bg-card/80 animate-in fade-in zoom-in-95 z-10 w-full max-w-md shadow-2xl backdrop-blur-xl duration-500">
        <CardHeader className="text-center">
          <BrandMark className="mx-auto mb-4" />
          <CardTitle className="text-2xl">{t('app.name')}</CardTitle>
          <CardDescription>
            {status === 'loading' && t('auth.completingLogin')}
            {status === 'error' && getErrorMessage()}
            {status === 'success' && t('auth.loginSuccess')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          )}
          {status === 'error' && (
            <Button asChild variant="outline">
              <Link to="/login">{t('auth.backToLogin')}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}