import { create } from 'zustand'
import type { SleepSession } from '@/lib/types'

interface UiState {
  // Feeding sheet state
  feedingSheetOpen: boolean
  feedingSheetMode: 'create' | 'edit'
  feedingSheetDraft: {
    id?: string
    type: 'pre' | 'milk' | 'combo' | 'pump'
    occurredAt: Date
    amountPreMl: number | null
    amountMilkMl: number | null
    note: string | null
  } | null
  openFeedingSheet: (
    draft: UiState['feedingSheetDraft'],
    mode: UiState['feedingSheetMode'],
  ) => void
  closeFeedingSheet: () => void
  setFeedingDraft: (patch: Partial<NonNullable<UiState['feedingSheetDraft']>>) => void

  // Sleep sheet state
  sleepSheetOpen: boolean
  sleepSheetDraft: SleepSession | null
  openSleepSheet: (session: SleepSession) => void
  closeSleepSheet: () => void

  // Preferred feeding type (last used)
  preferredType: 'pre' | 'milk'
  setPreferredType: (t: 'pre' | 'milk') => void
}

const STORAGE_PREF_TYPE = 'babyTracker:preferredType'

const initialType = (typeof window !== 'undefined'
  ? (window.localStorage.getItem(STORAGE_PREF_TYPE) as 'pre' | 'milk' | null)
  : null) ?? 'pre'

export const useUiStore = create<UiState>((set) => ({
  feedingSheetOpen: false,
  feedingSheetMode: 'create',
  feedingSheetDraft: null,
  openFeedingSheet: (draft, mode) =>
    set({ feedingSheetOpen: true, feedingSheetDraft: draft, feedingSheetMode: mode }),
  closeFeedingSheet: () => set({ feedingSheetOpen: false }),
  setFeedingDraft: (patch) =>
    set((state) => ({
      feedingSheetDraft: state.feedingSheetDraft
        ? { ...state.feedingSheetDraft, ...patch }
        : null,
    })),

  sleepSheetOpen: false,
  sleepSheetDraft: null,
  openSleepSheet: (session) => set({ sleepSheetOpen: true, sleepSheetDraft: session }),
  closeSleepSheet: () => set({ sleepSheetOpen: false }),

  preferredType: initialType,
  setPreferredType: (t) => {
    window.localStorage.setItem(STORAGE_PREF_TYPE, t)
    set({ preferredType: t })
  },
}))
