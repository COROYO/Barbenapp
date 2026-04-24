import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import {
  recentSleepQuery,
  sleepDoc,
  sleepInRangeQuery,
} from '@/lib/queries/sleep'
import type { SleepSession } from '@/lib/types'

export function useSleepInRange(babyId: string | null, fromDate: Date, toDate: Date) {
  const [sessions, setSessions] = useState<SleepSession[]>([])
  const [loading, setLoading] = useState(true)
  const fromMs = fromDate.getTime()
  const toMs = toDate.getTime()

  useEffect(() => {
    if (!babyId) {
      setSessions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = sleepInRangeQuery(babyId, new Date(fromMs), new Date(toMs))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SleepSession[]
      setSessions(list)
      setLoading(false)
    })
    return unsub
  }, [babyId, fromMs, toMs])

  return { sessions, loading }
}

export function useRecentSleep(babyId: string | null, count = 100) {
  const [sessions, setSessions] = useState<SleepSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!babyId) {
      setSessions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = recentSleepQuery(babyId, count)
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SleepSession[]
      setSessions(list)
      setLoading(false)
    })
    return unsub
  }, [babyId, count])

  return { sessions, loading }
}

export function useSleepSession(babyId: string | null, sleepId: string | null) {
  const [session, setSession] = useState<SleepSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!babyId || !sleepId) {
      setSession(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(sleepDoc(babyId, sleepId), (snap) => {
      if (snap.exists()) {
        setSession({ id: snap.id, ...snap.data() } as SleepSession)
      } else {
        setSession(null)
      }
      setLoading(false)
    })
    return unsub
  }, [babyId, sleepId])

  return { session, loading }
}
