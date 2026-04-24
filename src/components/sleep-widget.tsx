import { Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/providers/auth-provider'
import { useBabyContext } from '@/providers/baby-provider'
import { useSleepSession } from '@/lib/hooks/use-sleep'
import { startSleep, stopSleep } from '@/lib/queries/sleep'
import { useUiStore } from '@/stores/ui-store'
import { useNow } from '@/lib/hooks/use-now'
import { formatDurationLive } from '@/lib/time'
import { cn } from '@/lib/utils'

function vibrate(ms = 18) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms)
  }
}

export function SleepWidget() {
  const { user } = useAuth()
  const { currentBaby } = useBabyContext()
  const { session } = useSleepSession(currentBaby?.id ?? null, currentBaby?.currentSleepId ?? null)
  const openSleepSheet = useUiStore((s) => s.openSleepSheet)
  const now = useNow(session ? 1000 : 60000)

  if (!currentBaby || !user) return null

  const isSleeping = !!currentBaby.currentSleepId && !!session && !session.endedAt
  const startedAt = session?.startedAt.toDate() ?? null

  async function handleStart() {
    if (!user || !currentBaby) return
    vibrate()
    try {
      await startSleep(currentBaby.id, user.uid)
      toast.success('Schlaf gestartet')
    } catch (err) {
      toast.error('Konnte nicht starten', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function handleStop() {
    if (!user || !currentBaby || !session) return
    vibrate(22)
    try {
      await stopSleep(currentBaby.id, session.id)
      toast.success('Schlaf beendet')
    } catch (err) {
      toast.error('Konnte nicht stoppen', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <button
      type="button"
      onClick={isSleeping ? handleStop : handleStart}
      onContextMenu={(e) => {
        if (isSleeping && session) {
          e.preventDefault()
          openSleepSheet(session)
        }
      }}
      className={cn(
        'flex w-full items-center justify-between rounded-2xl border border-border px-5 py-4 text-left transition-colors active:scale-[0.99]',
        isSleeping ? 'bg-primary/10 border-primary/40' : 'bg-card',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            isSleeping ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          {isSleeping ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
        </div>
        <div>
          <div className="text-sm text-muted-foreground">
            {isSleeping ? 'Schläft seit' : 'Schlaf starten'}
          </div>
          {isSleeping && startedAt && (
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {formatDurationLive(startedAt, new Date(now))}
            </div>
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-primary">
        {isSleeping ? 'Stopp' : 'Start'}
      </span>
    </button>
  )
}
