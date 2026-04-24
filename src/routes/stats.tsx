import { useMemo, useState } from 'react'
import { differenceInMinutes, format, startOfDay, subDays, endOfDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Droplet, Moon, Clock, Gauge } from 'lucide-react'
import { useBabyContext } from '@/providers/baby-provider'
import { useFeedingsInRange } from '@/lib/hooks/use-feedings'
import { useSleepInRange } from '@/lib/hooks/use-sleep'
import { totalMl } from '@/lib/queries/feedings'
import { formatDuration } from '@/lib/time'
import { StatCard } from '@/components/stats-cards'
import { cn } from '@/lib/utils'

type Range = 'today' | '7d' | '30d'

export default function StatsRoute() {
  const { currentBaby } = useBabyContext()
  const babyId = currentBaby?.id ?? null
  const [range, setRange] = useState<Range>('7d')

  const { from, to } = useMemo(() => {
    const end = endOfDay(new Date())
    if (range === 'today') return { from: startOfDay(new Date()), to: end }
    if (range === '7d') return { from: startOfDay(subDays(new Date(), 6)), to: end }
    return { from: startOfDay(subDays(new Date(), 29)), to: end }
  }, [range])

  const { feedings } = useFeedingsInRange(babyId, from, to)
  const { sessions } = useSleepInRange(babyId, from, to)

  const stats = useMemo(() => {
    const totalMlAll = feedings.reduce((acc, f) => acc + totalMl(f), 0)
    const feedCount = feedings.filter((f) => f.type !== 'pump').length

    const liquid = feedings
      .filter((f) => f.type !== 'pump')
      .map((f) => f.occurredAt.toDate())
      .sort((a, b) => a.getTime() - b.getTime())
    let avgIntervalMin = 0
    if (liquid.length > 1) {
      let sum = 0
      for (let i = 1; i < liquid.length; i++) {
        sum += differenceInMinutes(liquid[i], liquid[i - 1])
      }
      avgIntervalMin = Math.round(sum / (liquid.length - 1))
    }

    const avgAmount = feedCount > 0 ? Math.round(totalMlAll / feedCount) : 0

    const completedSleep = sessions.filter((s) => s.endedAt)
    const totalSleepMin = completedSleep.reduce(
      (acc, s) => acc + differenceInMinutes(s.endedAt!.toDate(), s.startedAt.toDate()),
      0,
    )
    const longestSleepMin = completedSleep.reduce(
      (acc, s) =>
        Math.max(acc, differenceInMinutes(s.endedAt!.toDate(), s.startedAt.toDate())),
      0,
    )

    return { totalMlAll, feedCount, avgIntervalMin, avgAmount, totalSleepMin, longestSleepMin }
  }, [feedings, sessions])

  const chartData = useMemo(() => {
    const days =
      range === 'today' ? 1 : range === '7d' ? 7 : 30
    const data: { day: string; ml: number; sleepH: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const target = startOfDay(subDays(new Date(), i))
      const key = target.getTime()
      const end = endOfDay(target).getTime()
      const dayMl = feedings
        .filter((f) => {
          const t = f.occurredAt.toMillis()
          return t >= key && t <= end
        })
        .reduce((acc, f) => acc + totalMl(f), 0)
      const dayMin = sessions
        .filter((s) => s.endedAt)
        .reduce((acc, s) => {
          const st = s.startedAt.toMillis()
          const en = s.endedAt!.toMillis()
          // count portion falling in day
          const overlapStart = Math.max(st, key)
          const overlapEnd = Math.min(en, end)
          if (overlapEnd > overlapStart) {
            return acc + (overlapEnd - overlapStart) / 60000
          }
          return acc
        }, 0)
      data.push({
        day: format(target, range === '30d' ? 'dd.MM.' : 'EEE', { locale: de }),
        ml: dayMl,
        sleepH: Math.round((dayMin / 60) * 10) / 10,
      })
    }
    return data
  }, [feedings, sessions, range])

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-8">
      <h1 className="text-xl font-bold">Statistik</h1>

      <div className="flex gap-2">
        {(['today', '7d', '30d'] as Range[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              'flex-1 rounded-lg border px-3 py-2 text-sm',
              range === r
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            {r === 'today' ? 'Heute' : r === '7d' ? '7 Tage' : '30 Tage'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Gesamt"
          value={`${stats.totalMlAll} ml`}
          sub={`${stats.feedCount} Mahlzeiten`}
          icon={<Droplet className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Ø Menge"
          value={`${stats.avgAmount} ml`}
          sub="pro Mahlzeit"
          icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Ø Intervall"
          value={stats.avgIntervalMin > 0 ? formatDuration(stats.avgIntervalMin) : '–'}
          sub="zwischen Mahlzeiten"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Schlaf"
          value={stats.totalSleepMin > 0 ? formatDuration(stats.totalSleepMin) : '–'}
          sub={
            stats.longestSleepMin > 0
              ? `längste: ${formatDuration(stats.longestSleepMin)}`
              : '—'
          }
          icon={<Moon className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="pb-2 text-sm font-semibold">Menge pro Tag (ml)</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Bar dataKey="ml" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="pb-2 text-sm font-semibold">Schlaf pro Tag (h)</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="sleepH" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
