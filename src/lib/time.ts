import { differenceInMinutes, format, startOfDay, endOfDay, subDays } from 'date-fns'
import { de } from 'date-fns/locale'

export function startOfToday() {
  return startOfDay(new Date())
}

export function endOfToday() {
  return endOfDay(new Date())
}

export function rangeDays(days: number) {
  const to = endOfDay(new Date())
  const from = startOfDay(subDays(new Date(), days - 1))
  return { from, to }
}

export function formatTime(d: Date): string {
  return format(d, 'HH:mm', { locale: de })
}

export function formatDate(d: Date): string {
  return format(d, 'dd.MM.yyyy', { locale: de })
}

export function formatDayLabel(d: Date): string {
  const today = startOfDay(new Date())
  const yesterday = startOfDay(subDays(new Date(), 1))
  const target = startOfDay(d)
  if (target.getTime() === today.getTime()) return 'Heute'
  if (target.getTime() === yesterday.getTime()) return 'Gestern'
  return format(d, 'EEEE, dd.MM.', { locale: de })
}

export function formatDelta(fromDate: Date, toDate: Date = new Date()): string {
  const totalMin = Math.max(0, differenceInMinutes(toDate, fromDate))
  if (totalMin < 1) return 'gerade eben'
  const hours = Math.floor(totalMin / 60)
  const minutes = totalMin % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 1) return '< 1 min'
  const h = Math.floor(totalMinutes / 60)
  const m = Math.floor(totalMinutes % 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export function formatDurationLive(fromDate: Date, toDate: Date = new Date()): string {
  const totalSec = Math.max(0, Math.floor((toDate.getTime() - fromDate.getTime()) / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (h === 0) return `${pad(m)}:${pad(s)}`
  return `${h}:${pad(m)}:${pad(s)}`
}
