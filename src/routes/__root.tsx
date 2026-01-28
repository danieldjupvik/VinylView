import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { useTranslation } from 'react-i18next'

import { AppErrorBoundary } from '@/components/error-boundary'
import { GradientBackground } from '@/components/layout/gradient-background'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent
})

function RootComponent() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <AppErrorBoundary>
        <Outlet />
      </AppErrorBoundary>
      <Toaster />
      <SpeedInsights />
    </div>
  )
}

function NotFoundComponent() {
  const { t } = useTranslation()

  return (
    <GradientBackground>
      <div className="animate-in fade-in zoom-in-95 flex min-h-screen flex-col items-center justify-center p-6 text-center duration-300">
        <span
          className="text-8xl font-bold tracking-tighter opacity-20"
          aria-hidden="true"
        >
          404
        </span>
        <h1 className="mt-4 text-2xl font-semibold">
          {t('errors.notFoundTitle')}
        </h1>
        <p className="text-muted-foreground mt-3 text-base whitespace-pre-line">
          {t('errors.notFoundDescription')}
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link to="/" viewTransition>
            {t('errors.backHome')}
          </Link>
        </Button>
      </div>
    </GradientBackground>
  )
}
