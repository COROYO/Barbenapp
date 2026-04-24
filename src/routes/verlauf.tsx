import { useMemo, useState } from 'react'
import { startOfDay, differenceInMinutes, subDays, endOfDay } from 'date-fns'
import { useBabyContext } from '@/providers/baby-provider'
import { useFeedingsInRange } from '@/lib/hooks/use-feedings'
import { useSleepInRange } from '@/lib/hooks/use-sleep'
import { totalMl } from '@/lib/queries/feedings'
import { buildTimeline, Timeline } from '@/components/timeline'
import { formatDayLabel, formatDuration } from '@/lib/time'
import { cn } from '@/lib/utils'

type FilterKind = 'all' | 'feedings' | 'sleep'

const DEFAULT_RANGE_DAYS = 14

export default function VerlaufRoute() {
  const { currentBaby } = useBabyContext()
  const babyId = currentBaby?.id ?? null
  const [days, setDays] = useState(DEFAULT_RANGE_DAYS)
  const [filter, setFilter] = useState<FilterKind>('all')

  const { from, to } = useMemo(
    () => ({
      from: startOfDay(subDays(new Date(), days - 1)),
      to: endOfDay(new Date()),
    }),
    [days],
  )

  const { feedings } = useFeedingsInRange(babyId, from, to)
  const { sessions } = useSleepInRange(babyId, from, to)

  const itemsByDay = useMemo(() => {
    const shownFeedings = filter === 'sleep' ? [] : feedings
    const shownSleep = filter === 'feedings' ? [] : sessions
    const items = buildTimeline(shownFeedings, shownSleep)
    const map = new Map<number, typeof items>()
    for (const it of items) {
      const key = startOfDay(it.at).getTime()
      const list = map.get(key) ?? []
      list.push(it)
      map.set(key, list)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([key, list]) => ({ day: new Date(key), items: list }))
  }, [feedings, sessions, filter])

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-8">
      <h1 className="text-xl font-bold">Verlauf</h1>

      <div className="flex items-center gap-2 overflow-x-auto">
        {(['all', 'feedings', 'sleep'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm',
              filter === f
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            {f === 'all' ? 'Alles' : f === 'feedings' ? 'Fütterung' : 'Schlaf'}
          </button>
        ))}
      </div>

      {itemsByDay.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Keine Einträge im ausgewählten Zeitraum
        </div>
      )}

      {itemsByDay.map(({ day, items }) => {
        const dayFeedings = items.filter((i) => i.kind === 'feeding').map((i) => i.feeding!)
        const daySleep = items.filter((i) => i.kind === 'sleep').map((i) => i.sleep!)
        const dayMl = dayFeedings.reduce((s, f) => s + totalMl(f), 0)

        // average interval between consecutive liquid feedings
        const liquid = dayFeedings
          .filter((f) => f.type !== 'pump')
          .map((f) => f.occurredAt.toDate())
          .sort((a, b) => a.getTime() - b.getTime())
        let avgInterval = 0
        if (liquid.length > 1) {
          let sum = 0
          for (let i = 1; i < liquid.length; i++) {
            sum += differenceInMinutes(liquid[i], liquid[i - 1])
          }
          avgInterval = Math.round(sum / (liquid.length - 1))
        }

        const sleepMinutes = daySleep.reduce((acc, s) => {
          if (!s.endedAt) return acc
          return acc + differenceInMinutes(s.endedAt.toDate(), s.startedAt.toDate())
        }, 0)

        return (
          <section key={day.getTime()} className="space-y-2">
            <div className="flex items-end justify-between pb-1">
              <h2 className="text-base font-semibold">{formatDayLabel(day)}</h2>
              <div className="text-xs text-muted-foreground">
                {dayMl > 0 && <span>{dayMl} ml</span>}
                {dayMl > 0 && avgInterval > 0 && <span> &middot; </span>}
                {avgInterval > 0 && <span>Ø {formatDuration(avgInterval)}</span>}
                {sleepMinutes > 0 && (dayMl > 0 || avgInterval > 0) && <span> &middot; </span>}
                {sleepMinutes > 0 && <span>Schlaf {formatDuration(sleepMinutes)}</span>}
              </div>
            </div>
            <Timeline feedings={dayFeedings} sleep={daySleep} />
          </section>
        )
      })}

      <div className="pt-4">
        <button
          type="button"
          className="w-full rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
          onClick={() => setDays((d) => d + 14)}
        >
          Weiter zurück laden
        </button>
      </div>
    </div>
  )
}
