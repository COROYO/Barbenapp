import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { myBabiesQuery, babyDoc } from '@/lib/queries/babies'
import type { Baby } from '@/lib/types'

export function useMyBabies(uid: string | undefined) {
  const [babies, setBabies] = useState<Baby[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setBabies([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      myBabiesQuery(uid),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Baby[]
        list.sort((a, b) => a.name.localeCompare(b.name))
        setBabies(list)
        setLoading(false)
      },
      (err) => {
        console.error('useMyBabies snapshot error', err)
        setBabies([])
        setLoading(false)
      },
    )
    return unsub
  }, [uid])

  return { babies, loading }
}

export function useBaby(babyId: string | null) {
  const [baby, setBaby] = useState<Baby | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!babyId) {
      setBaby(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      babyDoc(babyId),
      (snap) => {
        if (snap.exists()) {
          setBaby({ id: snap.id, ...snap.data() } as Baby)
        } else {
          setBaby(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('useBaby snapshot error', err)
        setBaby(null)
        setLoading(false)
      },
    )
    return unsub
  }, [babyId])

  return { baby, loading }
}
