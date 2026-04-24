import { getMessaging, getToken, onMessage, deleteToken, type Messaging } from 'firebase/messaging'
import { arrayRemove, arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { app, db } from '@/lib/firebase'

let messaging: Messaging | null = null

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (!('serviceWorker' in navigator)) return false
  return true
}

function getMessagingLazy(): Messaging | null {
  if (!isPushSupported()) return null
  if (!messaging) {
    try {
      messaging = getMessaging(app)
    } catch {
      return null
    }
  }
  return messaging
}

export async function registerFcm(uid: string): Promise<string | null> {
  const m = getMessagingLazy()
  if (!m) return null

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    throw new Error('VITE_FIREBASE_VAPID_KEY fehlt')
  }

  // use the app service worker (registered by vite-plugin-pwa)
  const registration = await navigator.serviceWorker.ready

  // hand over firebase config to the SW
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  registration.active?.postMessage({ type: 'FIREBASE_CONFIG', config })

  const token = await getToken(m, {
    vapidKey,
    serviceWorkerRegistration: registration,
  })
  if (!token) return null

  await setDoc(
    doc(db, 'users', uid),
    {
      fcmTokens: arrayUnion(token),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return token
}

export async function unregisterFcm(uid: string): Promise<void> {
  const m = getMessagingLazy()
  if (!m) return
  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    const token = await getToken(m, { vapidKey }).catch(() => null)
    if (token) {
      await deleteToken(m)
      await setDoc(
        doc(db, 'users', uid),
        { fcmTokens: arrayRemove(token), updatedAt: serverTimestamp() },
        { merge: true },
      )
    }
  } catch {
    // ignore
  }
}

export function onForegroundMessage(cb: (payload: { title?: string; body?: string }) => void) {
  const m = getMessagingLazy()
  if (!m) return () => {}
  return onMessage(m, (payload) => {
    const title = payload.notification?.title ?? payload.data?.title
    const body = payload.notification?.body ?? payload.data?.body
    cb({ title, body })
  })
}
