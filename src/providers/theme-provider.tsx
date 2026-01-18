import { type ReactNode, useEffect, useState } from 'react'
import type { Theme } from './theme-context'
import { ThemeProviderContext } from './theme-context'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vinyldeck-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey)
    const validThemes: Theme[] = ['light', 'dark', 'system']
    return validThemes.includes(stored as Theme)
      ? (stored as Theme)
      : defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const applySystemTheme = () => {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(systemTheme)
      }

      applySystemTheme()
      mediaQuery.addEventListener('change', applySystemTheme)
      return () => mediaQuery.removeEventListener('change', applySystemTheme)
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (nextTheme: Theme) => {
      const validThemes: Theme[] = ['light', 'dark', 'system']
      const safeTheme = validThemes.includes(nextTheme)
        ? nextTheme
        : defaultTheme
      localStorage.setItem(storageKey, safeTheme)
      setTheme(safeTheme)
    }
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
