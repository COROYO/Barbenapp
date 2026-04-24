import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { logger } from 'firebase-functions'

// Unambiguous alphabet (no I/O/0/1, lower/upper distinction removed).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8
const MAX_GENERATE_TRIES = 8

function generateCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

function normalize(code: unknown): string {
  if (typeof code !== 'string') return ''
  return code.replace(/[\s-]/g, '').toUpperCase()
}

/**
 * createLoginCode: authenticated user generates (or rotates) their personal
 * login code. Old code (if any) is revoked.
 */
export const createLoginCode = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Login required')
  }

  const db = getFirestore()
  const userRef = db.doc(`users/${uid}`)

  // Pick a unique code (extremely rare collision but guard anyway).
  let code = ''
  for (let attempt = 0; attempt < MAX_GENERATE_TRIES; attempt++) {
    const candidate = generateCode()
    const exists = await db.doc(`loginCodes/${candidate}`).get()
    if (!exists.exists) {
      code = candidate
      break
    }
  }
  if (!code) {
    throw new HttpsError('internal', 'Could not generate unique code')
  }

  // Revoke previous code, if any.
  const userSnap = await userRef.get()
  const previous = (userSnap.data() as { loginCode?: string } | undefined)?.loginCode
  const batch = db.batch()
  if (previous && previous !== code) {
    batch.delete(db.doc(`loginCodes/${previous}`))
  }
  batch.set(db.doc(`loginCodes/${code}`), {
    uid,
    createdAt: FieldValue.serverTimestamp(),
  })
  batch.set(
    userRef,
    { loginCode: code, loginCodeUpdatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  )
  await batch.commit()

  logger.info('login code generated', { uid })
  return { code }
})

/**
 * signInWithCode: unauthenticated. Exchanges a personal login code for a
 * Firebase custom token usable with signInWithCustomToken on the client.
 */
export const signInWithCode = onCall(async (request) => {
  const code = normalize(request.data?.code)
  if (code.length !== CODE_LENGTH) {
    throw new HttpsError('invalid-argument', 'Invalid code')
  }

  const db = getFirestore()
  const codeRef = db.doc(`loginCodes/${code}`)
  const codeSnap = await codeRef.get()
  if (!codeSnap.exists) {
    throw new HttpsError('not-found', 'Code unknown')
  }

  const { uid } = codeSnap.data() as { uid?: string }
  if (!uid) {
    throw new HttpsError('failed-precondition', 'Code corrupted')
  }

  await codeRef.update({ lastUsedAt: FieldValue.serverTimestamp() }).catch(() => {})

  const token = await getAuth().createCustomToken(uid)
  logger.info('login code redeemed', { uid })
  return { token }
})
