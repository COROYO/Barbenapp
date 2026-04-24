import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateTimeField } from '@/components/date-time-field'
import { useUiStore } from '@/stores/ui-store'
import { useBabyContext } from '@/providers/baby-provider'
import { deleteSleep, updateSleep } from '@/lib/queries/sleep'

interface LocalState {
  startedAt: Date
  endedAt: Date | null
  note: string | null
}

export function SleepSheet() {
  const open = useUiStore((s) => s.sleepSheetOpen)
  const draft = useUiStore((s) => s.sleepSheetDraft)
  const close = useUiStore((s) => s.closeSleepSheet)
  const { currentBaby } = useBabyContext()

  const [local, setLocal] = useState<LocalState | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open && draft) {
      setLocal({
        startedAt: draft.startedAt.toDate(),
        endedAt: draft.endedAt?.toDate() ?? null,
        note: draft.note,
      })
    }
  }, [open, draft])

  if (!local || !currentBaby || !draft) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && close()}>
        <DrawerContent />
      </Drawer>
    )
  }

  async function handleSave() {
    if (!local || !draft || !currentBaby) return
    setBusy(true)
    try {
      await updateSleep(currentBaby.id, draft.id, {
        startedAt: local.startedAt,
        endedAt: local.endedAt,
        note: local.note,
      })
      toast.success('Aktualisiert')
      close()
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!draft || !currentBaby) return
    setBusy(true)
    try {
      const isActive = currentBaby.currentSleepId === draft.id
      await deleteSleep(currentBaby.id, draft.id, isActive)
      toast.success('Gelöscht')
      close()
    } catch (err) {
      toast.error('Fehler', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && close()}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle>Schlaf bearbeiten</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4">
            <DateTimeField
              label="Start"
              value={local.startedAt}
              onChange={(d) => setLocal((p) => (p ? { ...p, startedAt: d } : p))}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ende</Label>
                {local.endedAt ? (
                  <button
                    type="button"
                    onClick={() => setLocal((p) => (p ? { ...p, endedAt: null } : p))}
                    className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Noch schlafend
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Noch schlafend</span>
                )}
              </div>
              {local.endedAt ? (
                <DateTimeField
                  value={local.endedAt}
                  onChange={(d) => setLocal((p) => (p ? { ...p, endedAt: d } : p))}
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full"
                  onClick={() => {
                    const n = new Date()
                    n.setSeconds(0, 0)
                    setLocal((p) => (p ? { ...p, endedAt: n } : p))
                  }}
                >
                  Endzeit setzen
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Notiz (optional)</Label>
              <Input
                id="note"
                value={local.note ?? ''}
                onChange={(e) =>
                  setLocal((p) => (p ? { ...p, note: e.target.value || null } : p))
                }
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button size="lg" disabled={busy} onClick={handleSave}>
            Speichern
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={close}>
              Abbrechen
            </Button>
            <Button variant="destructive" className="flex-1" disabled={busy} onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
