import type { ReactNode } from 'react'

interface GradientBackgroundProps {
  children: ReactNode
}

/**
 * Full-screen background with radial gradient and floating orbs.
 * Used for standalone pages like login and error states.
 *
 * @param props - Component props
 * @param props.children - Content to render inside the gradient container
 * @returns The gradient background wrapper element
 */
export function GradientBackground({
  children
}: GradientBackgroundProps): React.JSX.Element {
  return (
    <div className="bg-background relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_circle_at_top,rgba(120,120,120,0.16),transparent_60%)]">
      {/* Floating gradient orbs */}
      <div className="bg-primary/15 animate-float-slow pointer-events-none absolute top-12 -left-24 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-secondary/25 animate-float-slower pointer-events-none absolute top-1/3 right-[-6rem] h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-accent/20 animate-float-slowest pointer-events-none absolute bottom-[-6rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl" />

      {children}
    </div>
  )
}
