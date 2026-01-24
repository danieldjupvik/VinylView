import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { THEME } from '@/lib/constants'
import { setupCrossTabSync } from '@/lib/cross-tab-sync'
import { AuthProvider } from '@/providers/auth-provider'
import { PreferencesProvider } from '@/providers/preferences-provider'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'

import { routeTree } from './routeTree.gen'
import '@/providers/i18n-provider'
import './index.css'

const router = createRouter({
  routeTree,
  defaultViewTransition: false
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Setup cross-tab auth synchronization
setupCrossTabSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme={THEME.DEFAULT} storageKey={THEME.STORAGE_KEY}>
      <QueryProvider>
        <PreferencesProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </PreferencesProvider>
      </QueryProvider>
    </ThemeProvider>
  </StrictMode>
)
