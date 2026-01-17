import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { useTranslation } from 'react-i18next'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
      <Toaster />
    </div>
  )
}

function NotFoundComponent() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-300">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">
        {t('errors.notFound', 'Page not found')}
      </p>
      <Link
        to="/"
        viewTransition
        className="text-primary underline-offset-4 hover:underline"
      >
        {t('nav.backHome', 'Go back home')}
      </Link>
    </div>
  )
}
