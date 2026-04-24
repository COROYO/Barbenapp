import { httpsCallable } from 'firebase/functions'
import { signInWithCustomToken } from 'firebase/auth'
import { auth, functions } from '@/lib/firebase'

const createCodeFn = httpsCallable<void, { code: string }>(functions, 'createLoginCode')
const signInWithCodeFn = httpsCallable<{ code: string }, { token: string }>(
  functions,
  'signInWithCode',
)

export function normalizeLoginCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

export function formatLoginCode(code: string): string {
  const c = normalizeLoginCode(code)
  if (c.length !== 8) return c
  return `${c.slice(0, 4)}-${c.slice(4)}`
}

export async function createOrRotateLoginCode(): Promise<string> {
  const res = await createCodeFn()
  return res.data.code
}

export async function signInWithLoginCode(code: string): Promise<void> {
  const normalized = normalizeLoginCode(code)
  const res = await signInWithCodeFn({ code: normalized })
  await signInWithCustomToken(auth, res.data.token)
}
