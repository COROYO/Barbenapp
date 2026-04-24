import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Feeding, FeedingType } from '@/lib/types'

export function feedingsCollection(babyId: string) {
  return collection(db, 'babies', babyId, 'feedings')
}

export function feedingDoc(babyId: string, feedingId: string) {
  return doc(db, 'babies', babyId, 'feedings', feedingId)
}

export function feedingsInRangeQuery(babyId: string, fromDate: Date, toDate: Date) {
  return query(
    feedingsCollection(babyId),
    where('occurredAt', '>=', Timestamp.fromDate(fromDate)),
    where('occurredAt', '<', Timestamp.fromDate(toDate)),
    orderBy('occurredAt', 'desc'),
  )
}

export function recentFeedingsQuery(babyId: string, count: number) {
  return query(feedingsCollection(babyId), orderBy('occurredAt', 'desc'), limit(count))
}

export interface CreateFeedingInput {
  type: FeedingType
  occurredAt: Date
  amountPreMl: number | null
  amountMilkMl: number | null
  note: string | null
  uid: string
}

export async function createFeeding(babyId: string, input: CreateFeedingInput) {
  return addDoc(feedingsCollection(babyId), {
    type: input.type,
    occurredAt: Timestamp.fromDate(input.occurredAt),
    amountPreMl: input.amountPreMl,
    amountMilkMl: input.amountMilkMl,
    note: input.note,
    createdBy: input.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export interface UpdateFeedingInput {
  type?: FeedingType
  occurredAt?: Date
  amountPreMl?: number | null
  amountMilkMl?: number | null
  note?: string | null
}

export async function updateFeeding(babyId: string, feedingId: string, input: UpdateFeedingInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = { updatedAt: serverTimestamp() }
  if (input.type !== undefined) patch.type = input.type
  if (input.occurredAt !== undefined) patch.occurredAt = Timestamp.fromDate(input.occurredAt)
  if (input.amountPreMl !== undefined) patch.amountPreMl = input.amountPreMl
  if (input.amountMilkMl !== undefined) patch.amountMilkMl = input.amountMilkMl
  if (input.note !== undefined) patch.note = input.note
  await updateDoc(feedingDoc(babyId, feedingId), patch)
}

export async function deleteFeeding(babyId: string, feedingId: string) {
  await deleteDoc(feedingDoc(babyId, feedingId))
}

export function totalMl(feeding: Feeding): number {
  return (feeding.amountPreMl ?? 0) + (feeding.amountMilkMl ?? 0)
}
