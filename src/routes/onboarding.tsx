import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Baby, Loader2, LogOut, Plus, Users } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/providers/auth-provider'
import { useBabyContext } from '@/providers/baby-provider'
import { createBaby, joinBabyByInviteCode } from '@/lib/queries/babies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingRoute() {
  const { user } = useAuth()
  const { babies, loading: babiesLoading, setCurrentBabyId } = useBabyContext()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice')
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [code, setCode] = useState('')

  // While creating/joining we navigate away ourselves; don't auto-redirect during that window
  useEffect(() => {
    if (busy) return
    if (!babiesLoading && babies.length > 0) {
      setCurrentBabyId(babies[0].id)
    }
  }, [babies, babiesLoading, busy, setCurrentBabyId])

  if (babiesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!busy && babies.length > 0) {
    return <Navigate to="/" replace />
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !name.trim()) return
    setBusy(true)
    try {
      const babyId = await createBaby({
        name: name.trim(),
        birthday: birthday ? new Date(birthday) : null,
        uid: user.uid,
      })
      setCurrentBabyId(babyId)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error('Konnte Baby nicht anlegen', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !code.trim()) return
    setBusy(true)
    try {
      const babyId = await joinBabyByInviteCode(code, user.uid)
      setCurrentBabyId(babyId)
      toast.success('Baby verknüpft')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error('Konnte nicht beitreten', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col p-6 safe-top safe-bottom">
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-2">
          <Baby className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Willkommen</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut(auth).then(() => navigate('/login'))}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {mode === 'choice' && (
        <div className="flex flex-1 flex-col justify-center gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Neues Baby anlegen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Starte mit dem Tracking. Partner kannst du später einladen.
              </p>
              <Button size="lg" className="w-full" onClick={() => setMode('create')}>
                Neu anlegen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Einladung einlösen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Hast du einen 6-stelligen Code?
              </p>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => setMode('join')}
              >
                Code eingeben
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Neues Baby</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Max"
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthday">Geburtstag (optional)</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setMode('choice')}>
              Zurück
            </Button>
            <Button type="submit" className="flex-1" disabled={busy}>
              Anlegen
            </Button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Einladungs-Code</h2>
          <div className="space-y-2">
            <Label htmlFor="code">6-stelliger Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              autoFocus
              required
              className="text-center text-2xl font-mono tracking-[0.5em]"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setMode('choice')}>
              Zurück
            </Button>
            <Button type="submit" className="flex-1" disabled={busy}>
              Beitreten
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
