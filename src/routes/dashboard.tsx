import { useMemo } from 'react'
import { useBabyContext } from '@/providers/baby-provider'
import { useFeedingsInRange, useRecentFeedings } from '@/lib/hooks/use-feedings'
import { useSleepInRange } from '@/lib/hooks/use-sleep'
import { endOfToday, startOfToday } from '@/lib/time'
import { DashboardHeader } from '@/components/dashboard-header'
import { QuickFeedButtons } from '@/components/quick-feed-buttons'
import { SleepWidget } from '@/components/sleep-widget'
import { Timeline } from '@/components/timeline'

export default function DashboardRoute() {
  const { currentBaby } = useBabyContext()
  const babyId = currentBaby?.id ?? null

  const { from, to } = useMemo(() => ({ from: startOfToday(), to: endOfToday() }), [])
  const { feedings: todayFeedings } = useFeedingsInRange(babyId, from, to)
  const { sessions: todaySleep } = useSleepInRange(babyId, from, to)
  const { feedings: recentFeedings } = useRecentFeedings(babyId, 20)

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 p-4 pb-8">
      <DashboardHeader feedingsToday={todayFeedings} allRecentFeedings={recentFeedings} />
      <QuickFeedButtons />
      <SleepWidget />

      <section className="space-y-2 pt-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Heute</h2>
        <Timeline feedings={todayFeedings} sleep={todaySleep} />
      </section>
    </div>
  )
}
