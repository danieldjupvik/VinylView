import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import { ThemeProviderContext } from './theme-context'

import type { Theme } from './theme-context'

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
    try {
      const stored = localStorage.getItem(storageKey)
      const validThemes: Theme[] = ['light', 'dark', 'system']
      return validThemes.includes(stored as Theme)
        ? (stored as Theme)
        : defaultTheme
    } catch {
      return defaultTheme
    }
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
    return undefined
  }, [theme])

  const handleSetTheme = useCallback(
    (nextTheme: Theme) => {
      const validThemes: Theme[] = ['light', 'dark', 'system']
      const safeTheme = validThemes.includes(nextTheme)
        ? nextTheme
        : defaultTheme
      try {
        localStorage.setItem(storageKey, safeTheme)
      } catch {
        // Ignore storage errors
      }
      setTheme(safeTheme)
    },
    [defaultTheme, storageKey]
  )

  const value = useMemo(
    () => ({
      theme,
      setTheme: handleSetTheme
    }),
    [theme, handleSetTheme]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
