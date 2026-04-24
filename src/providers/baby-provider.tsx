import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useMyBabies } from '@/lib/hooks/use-babies'
import type { Baby } from '@/lib/types'

const STORAGE_KEY = 'babyTracker:currentBabyId'

type BabyContextValue = {
  babies: Baby[]
  currentBaby: Baby | null
  setCurrentBabyId: (id: string) => void
  loading: boolean
}

const BabyContext = createContext<BabyContextValue>({
  babies: [],
  currentBaby: null,
  setCurrentBabyId: () => {},
  loading: true,
})

export function BabyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { babies, loading } = useMyBabies(user?.uid)
  const [currentBabyId, setCurrentBabyIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(STORAGE_KEY)
  })

  useEffect(() => {
    if (loading) return
    if (babies.length === 0) {
      setCurrentBabyIdState(null)
      return
    }
    if (!currentBabyId || !babies.some((b) => b.id === currentBabyId)) {
      setCurrentBabyIdState(babies[0].id)
    }
  }, [babies, loading, currentBabyId])

  useEffect(() => {
    if (currentBabyId) {
      window.localStorage.setItem(STORAGE_KEY, currentBabyId)
    }
  }, [currentBabyId])

  const currentBaby = useMemo(
    () => babies.find((b) => b.id === currentBabyId) ?? null,
    [babies, currentBabyId],
  )

  const value: BabyContextValue = {
    babies,
    currentBaby,
    setCurrentBabyId: setCurrentBabyIdState,
    loading,
  }

  return <BabyContext.Provider value={value}>{children}</BabyContext.Provider>
}

export function useBabyContext() {
  return useContext(BabyContext)
}
