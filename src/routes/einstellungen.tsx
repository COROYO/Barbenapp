import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Trash2,
  UserPlus,
  Bell,
  BellOff,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/providers/auth-provider'
import { useBabyContext } from '@/providers/baby-provider'
import {
  joinBabyByInviteCode,
  removeMember,
  rotateInviteCode,
  updateBaby,
} from '@/lib/queries/babies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { useLoginCode } from '@/lib/hooks/use-login-code'
import { formatLoginCode } from '@/lib/auth-codes'

const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Aus' },
  { value: 2, label: 'Alle 2 h' },
  { value: 3, label: 'Alle 3 h' },
  { value: 4, label: 'Alle 4 h' },
]

export default function EinstellungenRoute() {
  const { user } = useAuth()
  const { currentBaby, setCurrentBabyId } = useBabyContext()
  const navigate = useNavigate()
  const { permission, enabled, requestAndEnable, disable, busy: notifBusy } = useNotifications()
  const { code: loginCode, loading: loginCodeLoading, busy: loginCodeBusy, rotate: rotateLoginCode } = useLoginCode()

  const [name, setName] = useState(currentBaby?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [removingUid, setRemovingUid] = useState<string | null>(null)

  if (!currentBaby || !user) return null

  async function handleRename() {
    if (!name.trim() || !currentBaby || name.trim() === currentBaby.name) return
    setSavingName(true)
    try {
      await updateBaby(currentBaby.id, { name: name.trim() })
      toast.success('Name gespeichert')
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSavingName(false)
    }
  }

  async function handleCopyCode() {
    if (!currentBaby) return
    try {
      await navigator.clipboard.writeText(currentBaby.inviteCode)
      toast.success('Code kopiert')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }

  async function handleRotate() {
    if (!user || !currentBaby) return
    setRotating(true)
    try {
      const newCode = await rotateInviteCode(currentBaby.id, user.uid)
      toast.success('Neuer Code', { description: newCode })
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setRotating(false)
    }
  }

  async function handleJoin() {
    if (!user || !joinCode.trim()) return
    setJoining(true)
    try {
      const babyId = await joinBabyByInviteCode(joinCode, user.uid)
      setCurrentBabyId(babyId)
      toast.success('Baby verknüpft')
      setJoinOpen(false)
      setJoinCode('')
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setJoining(false)
    }
  }

  async function handleRemove(uid: string) {
    if (!currentBaby) return
    setRemovingUid(uid)
    try {
      await removeMember(currentBaby.id, uid)
      toast.success('Entfernt')
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setRemovingUid(null)
    }
  }

  async function handleReminderChange(value: number | null) {
    if (!currentBaby) return
    try {
      await updateBaby(currentBaby.id, { reminderAfterHours: value })
      toast.success(value === null ? 'Erinnerungen aus' : `Alle ${value} h`)
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  async function handleGenerateLoginCode() {
    try {
      const code = await rotateLoginCode()
      toast.success('Login-Code erstellt', { description: formatLoginCode(code) })
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function handleCopyLoginCode() {
    if (!loginCode) return
    try {
      await navigator.clipboard.writeText(loginCode)
      toast.success('Code kopiert')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-8">
      <h1 className="text-xl font-bold">Einstellungen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Baby</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="baby-name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="baby-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                onClick={handleRename}
                disabled={savingName || !name.trim() || name.trim() === currentBaby.name}
              >
                Speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erinnerungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="pb-2 block">Push aktivieren</Label>
            {enabled ? (
              <Button
                variant="outline"
                className="w-full"
                disabled={notifBusy}
                onClick={disable}
              >
                <BellOff className="mr-2 h-4 w-4" />
                Deaktivieren
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={notifBusy || permission === 'denied'}
                onClick={requestAndEnable}
              >
                <Bell className="mr-2 h-4 w-4" />
                {permission === 'denied' ? 'Im Browser blockiert' : 'Aktivieren'}
              </Button>
            )}
          </div>

          <div>
            <Label className="pb-2 block">Erinnerung nach</Label>
            <div className="grid grid-cols-4 gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleReminderChange(opt.value)}
                  className={
                    'rounded-lg border px-2 py-2 text-sm ' +
                    (currentBaby.reminderAfterHours === opt.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground')
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Login-Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Mit diesem Code meldest du dich auf einem anderen Gerät schnell an –
            ohne E-Mail. Wichtig zur PWA-Installation.
          </p>
          {loginCodeLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : loginCode ? (
            <>
              <div className="rounded-lg bg-muted p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Dein persönlicher Code
                </div>
                <div className="py-2 font-mono text-2xl font-bold tracking-[0.25em]">
                  {formatLoginCode(loginCode)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyLoginCode}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Kopieren
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleGenerateLoginCode}
                  disabled={loginCodeBusy}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Neu generieren
                </Button>
              </div>
            </>
          ) : (
            <Button
              className="w-full"
              onClick={handleGenerateLoginCode}
              disabled={loginCodeBusy}
            >
              {loginCodeBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Login-Code erstellen
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teilen mit Partner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted p-4 text-center">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Einladungs-Code</div>
            <div className="py-2 font-mono text-3xl font-bold tracking-[0.4em]">
              {currentBaby.inviteCode}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCopyCode}>
              <Copy className="mr-2 h-4 w-4" />
              Kopieren
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleRotate} disabled={rotating}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Neu generieren
            </Button>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setJoinOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Code einlösen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mitglieder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentBaby.memberIds.map((uid) => (
            <div
              key={uid}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
            >
              <div className="truncate">
                {uid === user.uid ? (
                  <>
                    <span className="font-medium">{user.email}</span>
                    <span className="ml-1 text-muted-foreground">(du)</span>
                  </>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{uid.slice(0, 8)}…</span>
                )}
              </div>
              {uid !== user.uid && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={removingUid === uid}
                  onClick={() => handleRemove(uid)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" size="lg" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Abmelden
      </Button>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Code einlösen</DialogTitle>
            <DialogDescription>
              Gib den 6-stelligen Code deines Partners ein.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoFocus
            className="text-center font-mono text-2xl tracking-[0.4em]"
            placeholder="ABC123"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleJoin} disabled={joining || joinCode.length !== 6}>
              Beitreten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
