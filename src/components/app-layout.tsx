import { Outlet, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useBabyContext } from '@/providers/baby-provider'
import { BottomNav } from '@/components/bottom-nav'
import { BabySwitcher } from '@/components/baby-switcher'
import { FeedingSheet } from '@/components/feeding-sheet'
import { SleepSheet } from '@/components/sleep-sheet'
import { InstallHint } from '@/components/install-hint'

export function AppLayout() {
  const { currentBaby, loading, babies } = useBabyContext()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (babies.length === 0 || !currentBaby) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 safe-top">
        <BabySwitcher />
      </header>
      <main className="flex-1 overflow-y-auto">
        <InstallHint />
        <Outlet />
      </main>
      <BottomNav />
      <FeedingSheet />
      <SleepSheet />
    </div>
  )
}
