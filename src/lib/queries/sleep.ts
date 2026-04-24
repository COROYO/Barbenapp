import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function sleepCollection(babyId: string) {
  return collection(db, 'babies', babyId, 'sleepSessions')
}

export function sleepDoc(babyId: string, sleepId: string) {
  return doc(db, 'babies', babyId, 'sleepSessions', sleepId)
}

export function sleepInRangeQuery(babyId: string, fromDate: Date, toDate: Date) {
  return query(
    sleepCollection(babyId),
    where('startedAt', '>=', Timestamp.fromDate(fromDate)),
    where('startedAt', '<', Timestamp.fromDate(toDate)),
    orderBy('startedAt', 'desc'),
  )
}

export function recentSleepQuery(babyId: string, count: number) {
  return query(sleepCollection(babyId), orderBy('startedAt', 'desc'), limit(count))
}

export async function startSleep(babyId: string, uid: string, startedAt: Date = new Date()) {
  const ref = await addDoc(sleepCollection(babyId), {
    startedAt: Timestamp.fromDate(startedAt),
    endedAt: null,
    note: null,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'babies', babyId), { currentSleepId: ref.id })
  return ref.id
}

export async function stopSleep(
  babyId: string,
  sleepId: string,
  endedAt: Date = new Date(),
) {
  await updateDoc(sleepDoc(babyId, sleepId), {
    endedAt: Timestamp.fromDate(endedAt),
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'babies', babyId), { currentSleepId: null })
}

export interface UpdateSleepInput {
  startedAt?: Date
  endedAt?: Date | null
  note?: string | null
}

export async function updateSleep(babyId: string, sleepId: string, input: UpdateSleepInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = { updatedAt: serverTimestamp() }
  if (input.startedAt !== undefined) patch.startedAt = Timestamp.fromDate(input.startedAt)
  if (input.endedAt !== undefined) {
    patch.endedAt = input.endedAt ? Timestamp.fromDate(input.endedAt) : null
  }
  if (input.note !== undefined) patch.note = input.note
  await updateDoc(sleepDoc(babyId, sleepId), patch)
}

export async function deleteSleep(babyId: string, sleepId: string, clearCurrent = false) {
  await deleteDoc(sleepDoc(babyId, sleepId))
  if (clearCurrent) {
    await updateDoc(doc(db, 'babies', babyId), { currentSleepId: null })
  }
}
