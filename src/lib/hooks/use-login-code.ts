import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/providers/auth-provider'
import { createOrRotateLoginCode } from '@/lib/auth-codes'

export function useLoginCode() {
  const { user } = useAuth()
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) {
      setCode(null)
      setLoading(false)
      return
    }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.data() as { loginCode?: string } | undefined
        setCode(data?.loginCode ?? null)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  async function rotate(): Promise<string> {
    setBusy(true)
    try {
      const newCode = await createOrRotateLoginCode()
      setCode(newCode)
      return newCode
    } finally {
      setBusy(false)
    }
  }

  return { code, loading, busy, rotate }
}
