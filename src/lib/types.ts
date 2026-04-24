import type { Timestamp } from 'firebase/firestore'

export type FeedingType = 'pre' | 'milk' | 'combo' | 'pump'

export interface Baby {
  id: string
  name: string
  birthday: Timestamp | null
  memberIds: string[]
  inviteCode: string
  currentSleepId: string | null
  reminderAfterHours: number | null
  lastReminderSentAt: Timestamp | null
  createdAt: Timestamp
  createdBy: string
}

export interface Feeding {
  id: string
  occurredAt: Timestamp
  type: FeedingType
  amountPreMl: number | null
  amountMilkMl: number | null
  note: string | null
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface SleepSession {
  id: string
  startedAt: Timestamp
  endedAt: Timestamp | null
  note: string | null
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Invite {
  babyId: string
  createdAt: Timestamp
  createdBy: string
}

export interface UserDoc {
  fcmTokens: string[]
  updatedAt: Timestamp
}

export type TimelineItem =
  | { kind: 'feeding'; id: string; at: Date; feeding: Feeding }
  | { kind: 'sleep'; id: string; at: Date; sleep: SleepSession }
