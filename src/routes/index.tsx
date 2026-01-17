import { useAuth } from '@/hooks/use-auth'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BrandMark } from '@/components/layout/brand-mark'
import { useEffect } from 'react'

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
      <BrandMark
        size="lg"
        spinning
        className="animate-in fade-in duration-300"
      />
    </div>
  )
}
