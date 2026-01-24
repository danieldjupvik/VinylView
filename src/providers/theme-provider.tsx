// src/providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes'

import { THEME } from '@/lib/constants'

import type { ReactNode } from 'react'

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Theme provider using next-themes.
 * Prevents FOUC (flash of unstyled content) and flickering during theme toggle.
 *
 * IMPORTANT: Keep THEME.DEFAULT in sync with index.html inline script.
 */
export function ThemeProvider({
  children
}: ThemeProviderProps): React.JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={THEME.DEFAULT}
      storageKey={THEME.STORAGE_KEY}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
