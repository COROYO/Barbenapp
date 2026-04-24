import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Baby } from '@/lib/types'

function generateInviteCode() {
  // 6-char A-Z0-9, without I/O/0/1 to avoid ambiguity
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function babiesCollection() {
  return collection(db, 'babies')
}

export function babyDoc(babyId: string) {
  return doc(db, 'babies', babyId)
}

export function inviteDoc(code: string) {
  return doc(db, 'invites', code.toUpperCase())
}

export function myBabiesQuery(uid: string) {
  return query(babiesCollection(), where('memberIds', 'array-contains', uid))
}

export async function createBaby(input: {
  name: string
  birthday: Date | null
  uid: string
}): Promise<string> {
  const { name, birthday, uid } = input
  const inviteCode = generateInviteCode()

  const babyRef = await addDoc(babiesCollection(), {
    name,
    birthday,
    memberIds: [uid],
    inviteCode,
    currentSleepId: null,
    reminderAfterHours: null,
    lastReminderSentAt: null,
    createdAt: serverTimestamp(),
    createdBy: uid,
  })

  await setDoc(inviteDoc(inviteCode), {
    babyId: babyRef.id,
    createdAt: serverTimestamp(),
    createdBy: uid,
  })

  return babyRef.id
}

export async function updateBaby(babyId: string, data: Partial<Baby>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(babyDoc(babyId), data as any)
}

export async function joinBabyByInviteCode(code: string, uid: string): Promise<string> {
  const normalized = code.trim().toUpperCase()
  const inviteSnap = await getDoc(inviteDoc(normalized))
  if (!inviteSnap.exists()) throw new Error('Code ungültig')
  const { babyId } = inviteSnap.data() as { babyId: string }

  await updateDoc(babyDoc(babyId), {
    memberIds: arrayUnion(uid),
  })

  return babyId
}

export async function rotateInviteCode(babyId: string, uid: string): Promise<string> {
  const babySnap = await getDoc(babyDoc(babyId))
  if (!babySnap.exists()) throw new Error('Baby nicht gefunden')
  const oldCode = (babySnap.data() as Baby).inviteCode

  const newCode = generateInviteCode()
  await setDoc(inviteDoc(newCode), {
    babyId,
    createdAt: serverTimestamp(),
    createdBy: uid,
  })
  await updateDoc(babyDoc(babyId), { inviteCode: newCode })
  if (oldCode) await deleteDoc(inviteDoc(oldCode)).catch(() => {})

  return newCode
}

export async function removeMember(babyId: string, userIdToRemove: string) {
  await updateDoc(babyDoc(babyId), {
    memberIds: arrayRemove(userIdToRemove),
  })
}
