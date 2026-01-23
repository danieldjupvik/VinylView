import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { CollectionSyncBanner } from '@/components/collection/collection-sync-banner'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { BrandMark } from '@/components/layout/brand-mark'
import { LanguageToggle } from '@/components/layout/language-toggle'
import { ModeToggle } from '@/components/layout/mode-toggle'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { storeRedirectUrl } from '@/lib/redirect-utils'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout
})

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const location = useRouterState({ select: (s) => s.location })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentUrl = location.pathname + location.searchStr + location.hash
      storeRedirectUrl(currentUrl)
      void navigate({ to: '/login' })
    }
  }, [
    isAuthenticated,
    isLoading,
    navigate,
    location.pathname,
    location.searchStr,
    location.hash
  ])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BrandMark
          size="lg"
          spinning
          className="animate-in fade-in duration-300"
        />
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_top,rgba(120,120,120,0.12),transparent_60%)] opacity-70 dark:bg-[radial-gradient(1200px_circle_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="relative z-10 flex min-h-svh flex-col">
          <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 flex h-14 items-center justify-between border-b px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="flex items-center gap-2 md:hidden">
                <BrandMark size="sm" />
                <span className="font-semibold">{t('app.name')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ModeToggle />
            </div>
          </header>
          {/* Global collection sync banner - shows on all authenticated pages */}
          <div className="px-6 pt-6">
            <CollectionSyncBanner />
          </div>
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
