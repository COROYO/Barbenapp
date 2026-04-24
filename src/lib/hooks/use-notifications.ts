import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/providers/auth-provider'
import {
  isPushSupported,
  onForegroundMessage,
  registerFcm,
  unregisterFcm,
} from '@/lib/messaging'

const STORAGE_KEY = 'babyTracker:pushEnabled'

export function useNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>(
    isPushSupported() ? Notification.permission : 'default',
  )
  const [enabled, setEnabled] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1',
  )
  const [busy, setBusy] = useState(false)

  // Foreground messages → toast
  useEffect(() => {
    if (!enabled || !user) return
    const unsub = onForegroundMessage(({ title, body }) => {
      if (title) toast(title, { description: body })
    })
    return unsub
  }, [enabled, user])

  async function requestAndEnable() {
    if (!user || !isPushSupported()) {
      toast.error('Push wird vom Browser nicht unterstützt')
      return
    }
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        toast.error('Berechtigung nicht erteilt')
        return
      }
      const token = await registerFcm(user.uid)
      if (token) {
        window.localStorage.setItem(STORAGE_KEY, '1')
        setEnabled(true)
        toast.success('Benachrichtigungen aktiviert')
      }
    } catch (err) {
      toast.error('Fehler bei Aktivierung', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    if (!user) return
    setBusy(true)
    try {
      await unregisterFcm(user.uid)
      window.localStorage.removeItem(STORAGE_KEY)
      setEnabled(false)
      toast.success('Benachrichtigungen deaktiviert')
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return { permission, enabled, busy, requestAndEnable, disable, supported: isPushSupported() }
}
