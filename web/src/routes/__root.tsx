import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Outlet />
      <Toaster />
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found.</p>
    </div>
  ),
})
