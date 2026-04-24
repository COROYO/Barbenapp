import { useEffect, useState } from 'react'
import { Share, X } from 'lucide-react'

const DISMISS_KEY = 'babyTracker:installHintDismissed'

function isIos() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  // @ts-expect-error iOS specific
  if (window.navigator.standalone === true) return true
  return window.matchMedia('(display-mode: standalone)').matches
}

export function InstallHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (!isIos()) return
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return
    setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="mx-4 my-3 rounded-xl border border-border bg-card p-3 text-sm">
      <div className="flex items-start gap-3">
        <Share className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          App auf den Home-Bildschirm legen: <strong>Teilen → "Zum Home-Bildschirm"</strong>.
        </div>
        <button
          type="button"
          className="shrink-0 text-muted-foreground"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, '1')
            setVisible(false)
          }}
          aria-label="Hinweis schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
