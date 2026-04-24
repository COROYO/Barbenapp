import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from 'firebase/auth'
import { toast } from 'sonner'
import { KeyRound, Loader2, Mail } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeLoginCode, signInWithLoginCode } from '@/lib/auth-codes'

const EMAIL_STORAGE_KEY = 'babyTracker:emailForSignIn'

type Mode = 'code' | 'email'

export default function LoginRoute() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('code')

  // email-link state
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submittingMail, setSubmittingMail] = useState(false)

  // code state
  const [code, setCode] = useState('')
  const [submittingCode, setSubmittingCode] = useState(false)

  // Complete sign-in if arriving via email link
  useEffect(() => {
    const url = window.location.href
    if (!isSignInWithEmailLink(auth, url)) return

    const stored = window.localStorage.getItem(EMAIL_STORAGE_KEY)
    const emailToUse = stored ?? window.prompt('Bitte E-Mail zur Bestätigung eingeben') ?? ''
    if (!emailToUse) return

    signInWithEmailLink(auth, emailToUse, url)
      .then(() => {
        window.localStorage.removeItem(EMAIL_STORAGE_KEY)
        toast.success('Angemeldet')
        navigate('/', { replace: true })
      })
      .catch((err) => {
        toast.error('Anmeldung fehlgeschlagen', { description: err.message })
      })
  }, [navigate])

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmittingMail(true)
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      })
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email)
      setSent(true)
    } catch (err) {
      toast.error('Konnte Link nicht senden', {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      })
    } finally {
      setSubmittingMail(false)
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const normalized = normalizeLoginCode(code)
    if (normalized.length !== 8) {
      toast.error('Code muss 8 Zeichen haben')
      return
    }
    setSubmittingCode(true)
    try {
      await signInWithLoginCode(normalized)
      toast.success('Angemeldet')
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
      toast.error('Anmeldung fehlgeschlagen', {
        description: msg.includes('not-found') ? 'Code unbekannt' : msg,
      })
    } finally {
      setSubmittingCode(false)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 safe-top safe-bottom">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Baby Tracker</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'code'
              ? 'Gib deinen 8-stelligen Login-Code ein.'
              : 'Wir schicken dir einen Anmelde-Link.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('code')}
            className={
              'flex items-center justify-center gap-2 rounded-md py-2 transition-colors ' +
              (mode === 'code'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground')
            }
          >
            <KeyRound className="h-4 w-4" />
            Code
          </button>
          <button
            type="button"
            onClick={() => setMode('email')}
            className={
              'flex items-center justify-center gap-2 rounded-md py-2 transition-colors ' +
              (mode === 'email'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground')
            }
          >
            <Mail className="h-4 w-4" />
            E-Mail
          </button>
        </div>

        {mode === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Login-Code</Label>
              <Input
                id="code"
                inputMode="text"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                placeholder="ABCD-1234"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={9}
                required
                className="text-center font-mono text-2xl tracking-[0.3em]"
              />
              <p className="text-xs text-muted-foreground">
                Code findest du in den Einstellungen auf deinem anderen Gerät.
              </p>
            </div>
            <Button
              type="submit"
              size="xl"
              className="w-full"
              disabled={submittingCode || normalizeLoginCode(code).length !== 8}
            >
              {submittingCode ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>
        )}

        {mode === 'email' && sent && (
          <div className="space-y-4 rounded-xl border bg-card p-6 text-center">
            <Mail className="mx-auto h-10 w-10 text-primary" />
            <div>
              <p className="font-medium">Check deine Mails</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Öffne den Link auf diesem Gerät, um dich anzumelden.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
              Andere E-Mail verwenden
            </Button>
          </div>
        )}

        {mode === 'email' && !sent && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="du@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="xl" className="w-full" disabled={submittingMail}>
              {submittingMail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link senden'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
