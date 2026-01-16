import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/')({
  component: IndexComponent
})

function IndexComponent() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate({ to: '/collection' })
      } else {
        navigate({ to: '/login' })
      }
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  )
}
