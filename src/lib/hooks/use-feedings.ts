import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import {
  feedingsInRangeQuery,
  recentFeedingsQuery,
} from '@/lib/queries/feedings'
import type { Feeding } from '@/lib/types'

export function useFeedingsInRange(
  babyId: string | null,
  fromDate: Date,
  toDate: Date,
) {
  const [feedings, setFeedings] = useState<Feeding[]>([])
  const [loading, setLoading] = useState(true)
  const fromMs = fromDate.getTime()
  const toMs = toDate.getTime()

  useEffect(() => {
    if (!babyId) {
      setFeedings([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = feedingsInRangeQuery(babyId, new Date(fromMs), new Date(toMs))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Feeding[]
      setFeedings(list)
      setLoading(false)
    })
    return unsub
  }, [babyId, fromMs, toMs])

  return { feedings, loading }
}

export function useRecentFeedings(babyId: string | null, count = 100) {
  const [feedings, setFeedings] = useState<Feeding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!babyId) {
      setFeedings([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = recentFeedingsQuery(babyId, count)
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Feeding[]
      setFeedings(list)
      setLoading(false)
    })
    return unsub
  }, [babyId, count])

  return { feedings, loading }
}
