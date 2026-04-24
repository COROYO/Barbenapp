/// <reference lib="webworker" />
/* eslint-disable @typescript-eslint/triple-slash-reference */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
  __FIREBASE_CONFIG__?: Record<string, string>
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

// --- Firebase Messaging ---
let messagingInit = false
let pendingConfig: Record<string, string> | null = null

async function initMessagingIfReady() {
  if (messagingInit) return
  if (!pendingConfig) return
  try {
    const [{ initializeApp }, { getMessaging, onBackgroundMessage }] = await Promise.all([
      import('firebase/app'),
      import('firebase/messaging/sw'),
    ])
    const app = initializeApp(pendingConfig)
    const messaging = getMessaging(app)
    onBackgroundMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? payload.data?.title ?? 'Baby Tracker'
      const body = payload.notification?.body ?? payload.data?.body ?? ''
      self.registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url: '/' },
      })
    })
    messagingInit = true
  } catch (e) {
    // ignore – FCM optional
    console.warn('FCM init failed', e)
  }
}

self.addEventListener('message', (event) => {
  const data = (event as ExtendableMessageEvent).data as { type?: string; config?: Record<string, string> } | null
  if (data?.type === 'FIREBASE_CONFIG' && data.config) {
    pendingConfig = data.config
    event.waitUntil(initMessagingIfReady())
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if ('focus' in c) return (c as WindowClient).focus()
        }
        return self.clients.openWindow('/')
      }),
  )
})
