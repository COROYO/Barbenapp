import { format, isToday, isYesterday } from 'date-fns'
import { de } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const DEFAULT_OFFSETS_MIN = [-30, -15, -10, -5, 5, 10, 15] as const

interface Props {
  label?: string
  value: Date
  onChange: (d: Date) => void
  offsetsMin?: readonly number[]
  showRelative?: boolean
  autoFocusTime?: boolean
  className?: string
}

export function DateTimeField({
  label,
  value,
  onChange,
  offsetsMin = DEFAULT_OFFSETS_MIN,
  showRelative = true,
  autoFocusTime = false,
  className,
}: Props) {
  const dateStr = format(value, 'yyyy-MM-dd')
  const timeStr = format(value, 'HH:mm')

  function handleDate(s: string) {
    if (!s) return
    const [y, m, d] = s.split('-').map(Number)
    const next = new Date(value)
    next.setFullYear(y, m - 1, d)
    onChange(next)
  }

  function handleTime(s: string) {
    if (!s) return
    const [h, m] = s.split(':').map(Number)
    const next = new Date(value)
    next.setHours(h, m, 0, 0)
    onChange(next)
  }

  function setNow() {
    const n = new Date()
    n.setSeconds(0, 0)
    onChange(n)
  }

  // Shift relative to current value (additive, so multiple taps stack)
  function applyOffset(min: number) {
    const next = new Date(value)
    next.setMinutes(next.getMinutes() + min, 0, 0)
    onChange(next)
  }

  const isJustNow = Math.abs(value.getTime() - Date.now()) < 60_000

  const negatives = [...offsetsMin].filter((n) => n < 0).sort((a, b) => a - b)
  const positives = [...offsetsMin].filter((n) => n > 0).sort((a, b) => a - b)

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}

      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <Input
          type="date"
          value={dateStr}
          onChange={(e) => handleDate(e.target.value)}
          className="h-12 text-base"
        />
        <Input
          type="time"
          value={timeStr}
          onChange={(e) => handleTime(e.target.value)}
          autoFocus={autoFocusTime}
          className="h-12 text-center text-xl font-semibold tabular-nums"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {negatives.map((min) => (
          <Chip key={min} onClick={() => applyOffset(min)}>
            {formatOffset(min)}
          </Chip>
        ))}
        <Chip active={isJustNow} onClick={setNow} variant="primary">
          Jetzt
        </Chip>
        {positives.map((min) => (
          <Chip key={min} onClick={() => applyOffset(min)}>
            {formatOffset(min)}
          </Chip>
        ))}
        {showRelative && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
            {describe(value)}
          </span>
        )}
      </div>
    </div>
  )
}

function Chip({
  onClick,
  active,
  variant = 'default',
  children,
}: {
  onClick: () => void
  active?: boolean
  variant?: 'default' | 'primary'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.97]',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : variant === 'primary'
            ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
            : 'border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      {children}
    </button>
  )
}

function formatOffset(min: number): string {
  const sign = min > 0 ? '+' : '−'
  const abs = Math.abs(min)
  if (abs >= 60 && abs % 60 === 0) {
    const h = abs / 60
    return `${sign}${h} h`
  }
  return `${sign}${abs} min`
}

function describe(d: Date): string {
  const diffMs = d.getTime() - Date.now()
  const diffMin = Math.round(diffMs / 60_000)
  const abs = Math.abs(diffMin)

  if (abs < 1) return 'jetzt'
  if (abs < 60) {
    const unit = abs === 1 ? 'Min' : 'Min'
    return diffMin < 0 ? `vor ${abs} ${unit}` : `in ${abs} ${unit}`
  }
  const hours = Math.round(abs / 60)
  if (abs < 24 * 60) {
    const unit = hours === 1 ? 'Std' : 'Std'
    return diffMin < 0 ? `vor ${hours} ${unit}` : `in ${hours} ${unit}`
  }
  const prefix = isToday(d) ? 'Heute' : isYesterday(d) ? 'Gestern' : format(d, 'EEE, d.M.', { locale: de })
  return prefix
}
