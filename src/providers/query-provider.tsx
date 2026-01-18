import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { isAxiosError } from '@/api/client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401 (unauthorized), 404, or 429 (rate limited)
        if (isAxiosError(error)) {
          const status = error.response?.status
          if (status === 401 || status === 404 || status === 429) {
            return false
          }
        }
        return failureCount < 2
      }
    }
  }
})

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
