import { useMemo } from 'react'
import { differenceInMinutes } from 'date-fns'
import { Droplet, Milk, Baby as BabyIcon, Moon, ArrowUp } from 'lucide-react'
import type { Feeding, SleepSession, TimelineItem } from '@/lib/types'
import { formatTime, formatDelta, formatDuration } from '@/lib/time'
import { useUiStore } from '@/stores/ui-store'

export function buildTimeline(feedings: Feeding[], sleep: SleepSession[]): TimelineItem[] {
  const items: TimelineItem[] = []
  for (const f of feedings) {
    items.push({ kind: 'feeding', id: f.id, at: f.occurredAt.toDate(), feeding: f })
  }
  for (const s of sleep) {
    items.push({ kind: 'sleep', id: s.id, at: s.startedAt.toDate(), sleep: s })
  }
  items.sort((a, b) => b.at.getTime() - a.at.getTime())
  return items
}

function FeedingDescription({ feeding }: { feeding: Feeding }) {
  switch (feeding.type) {
    case 'pre':
      return (
        <span className="flex items-center gap-2">
          <Droplet className="h-4 w-4 text-primary" />
          {feeding.amountPreMl ?? 0} ml Pre
        </span>
      )
    case 'milk':
      return (
        <span className="flex items-center gap-2">
          <Milk className="h-4 w-4 text-primary" />
          {feeding.amountMilkMl ?? 0} ml Milch
        </span>
      )
    case 'combo':
      return (
        <span className="flex items-center gap-2">
          <Droplet className="h-4 w-4 text-primary" />
          {feeding.amountPreMl ?? 0} Pre + {feeding.amountMilkMl ?? 0} Milch
        </span>
      )
    case 'pump':
      return (
        <span className="flex items-center gap-2">
          <BabyIcon className="h-4 w-4 text-primary" />
          Pumpen
        </span>
      )
  }
}

export function Timeline({
  feedings,
  sleep,
  emptyText = 'Noch keine Einträge heute',
}: {
  feedings: Feeding[]
  sleep: SleepSession[]
  emptyText?: string
}) {
  const items = useMemo(() => buildTimeline(feedings, sleep), [feedings, sleep])
  const openFeedingSheet = useUiStore((s) => s.openFeedingSheet)
  const openSleepSheet = useUiStore((s) => s.openSleepSheet)

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    )
  }

  return (
    <ol className="space-y-2">
      {items.map((item, idx) => {
        const next = items[idx + 1]
        const delta = next ? differenceInMinutes(item.at, next.at) : null
        return (
          <li key={`${item.kind}-${item.id}`}>
            <button
              type="button"
              onClick={() => {
                if (item.kind === 'feeding') {
                  const f = item.feeding
                  openFeedingSheet(
                    {
                      id: f.id,
                      type: f.type,
                      occurredAt: f.occurredAt.toDate(),
                      amountPreMl: f.amountPreMl,
                      amountMilkMl: f.amountMilkMl,
                      note: f.note,
                    },
                    'edit',
                  )
                } else {
                  openSleepSheet(item.sleep)
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors active:scale-[0.99]"
            >
              <div className="w-14 shrink-0 text-right font-mono text-sm tabular-nums text-muted-foreground">
                {formatTime(item.at)}
              </div>
              <div className="flex-1 text-sm">
                {item.kind === 'feeding' ? (
                  <>
                    <FeedingDescription feeding={item.feeding} />
                    {item.feeding.note && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{item.feeding.note}</div>
                    )}
                  </>
                ) : (
                  <SleepDescription sleep={item.sleep} />
                )}
              </div>
              {delta !== null && (
                <div className="flex flex-col items-end text-xs text-muted-foreground">
                  <ArrowUp className="h-3 w-3" />
                  <span>{formatDelta(next!.at, item.at)}</span>
                </div>
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function SleepDescription({ sleep }: { sleep: SleepSession }) {
  const start = sleep.startedAt.toDate()
  const endDate = sleep.endedAt?.toDate() ?? null
  const durationMin = endDate
    ? differenceInMinutes(endDate, start)
    : differenceInMinutes(new Date(), start)
  return (
    <span className="flex items-center gap-2">
      <Moon className="h-4 w-4 text-primary" />
      {endDate ? (
        <>
          Schlaf {formatTime(start)} – {formatTime(endDate)} ({formatDuration(durationMin)})
        </>
      ) : (
        <>Schläft seit {formatTime(start)} …</>
      )}
    </span>
  )
}
