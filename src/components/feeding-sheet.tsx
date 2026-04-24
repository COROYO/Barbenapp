import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Minus, Plus, Trash2 } from 'lucide-react'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DateTimeField } from '@/components/date-time-field'
import { useUiStore } from '@/stores/ui-store'
import { useAuth } from '@/providers/auth-provider'
import { useBabyContext } from '@/providers/baby-provider'
import {
  createFeeding,
  deleteFeeding,
  updateFeeding,
} from '@/lib/queries/feedings'
import type { FeedingType } from '@/lib/types'

type LocalDraft = NonNullable<ReturnType<typeof useUiStore.getState>['feedingSheetDraft']>

function Stepper({
  value,
  onChange,
  step = 5,
  min = 0,
  label,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="flex-1 rounded-md border border-input bg-background text-center">
          <div className="text-3xl font-bold py-2 tabular-nums">
            {value}
            <span className="ml-1 text-base font-normal text-muted-foreground">ml</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={() => onChange(value + step)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

export function FeedingSheet() {
  const open = useUiStore((s) => s.feedingSheetOpen)
  const draft = useUiStore((s) => s.feedingSheetDraft)
  const mode = useUiStore((s) => s.feedingSheetMode)
  const close = useUiStore((s) => s.closeFeedingSheet)
  const { user } = useAuth()
  const { currentBaby } = useBabyContext()

  const [local, setLocal] = useState<LocalDraft | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open && draft) setLocal(draft)
  }, [open, draft])

  if (!local || !currentBaby || !user) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && close()}>
        <DrawerContent />
      </Drawer>
    )
  }

  const setType = (t: FeedingType) =>
    setLocal((prev) => {
      if (!prev) return prev
      const next = { ...prev, type: t }
      if (t === 'pre') {
        next.amountPreMl = prev.amountPreMl ?? prev.amountMilkMl ?? 25
        next.amountMilkMl = null
      } else if (t === 'milk') {
        next.amountMilkMl = prev.amountMilkMl ?? prev.amountPreMl ?? 25
        next.amountPreMl = null
      } else if (t === 'combo') {
        next.amountPreMl = prev.amountPreMl ?? 25
        next.amountMilkMl = prev.amountMilkMl ?? 25
      } else if (t === 'pump') {
        next.amountPreMl = null
        next.amountMilkMl = null
      }
      return next
    })

  async function handleSave() {
    if (!local || !user || !currentBaby) return
    setBusy(true)
    try {
      if (mode === 'create') {
        await createFeeding(currentBaby.id, {
          type: local.type,
          occurredAt: local.occurredAt,
          amountPreMl: local.amountPreMl,
          amountMilkMl: local.amountMilkMl,
          note: local.note,
          uid: user.uid,
        })
        toast.success('Eintrag gespeichert')
      } else if (mode === 'edit' && local.id) {
        await updateFeeding(currentBaby.id, local.id, {
          type: local.type,
          occurredAt: local.occurredAt,
          amountPreMl: local.amountPreMl,
          amountMilkMl: local.amountMilkMl,
          note: local.note,
        })
        toast.success('Aktualisiert')
      }
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
    if (!local?.id || !currentBaby) return
    setBusy(true)
    try {
      await deleteFeeding(currentBaby.id, local.id)
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
          <DrawerTitle>{mode === 'edit' ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Typ</Label>
              <ToggleGroup
                type="single"
                size="lg"
                value={local.type}
                onValueChange={(v) => v && setType(v as FeedingType)}
              >
                <ToggleGroupItem value="pre">Pre</ToggleGroupItem>
                <ToggleGroupItem value="milk">Milch</ToggleGroupItem>
                <ToggleGroupItem value="combo">Kombi</ToggleGroupItem>
                <ToggleGroupItem value="pump">Pumpen</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <DateTimeField
              label="Zeitpunkt"
              value={local.occurredAt}
              onChange={(d) =>
                setLocal((prev) => (prev ? { ...prev, occurredAt: d } : prev))
              }
              autoFocusTime={mode === 'create'}
            />

            {(local.type === 'pre' || local.type === 'combo') && (
              <Stepper
                label="Pre"
                value={local.amountPreMl ?? 0}
                onChange={(v) => setLocal((prev) => (prev ? { ...prev, amountPreMl: v } : prev))}
              />
            )}

            {(local.type === 'milk' || local.type === 'combo') && (
              <Stepper
                label="Milch"
                value={local.amountMilkMl ?? 0}
                onChange={(v) => setLocal((prev) => (prev ? { ...prev, amountMilkMl: v } : prev))}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="note">Notiz (optional)</Label>
              <Input
                id="note"
                value={local.note ?? ''}
                onChange={(e) =>
                  setLocal((prev) => (prev ? { ...prev, note: e.target.value || null } : prev))
                }
                placeholder="z.B. Papa hat gefüttert"
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button size="lg" disabled={busy} onClick={handleSave}>
            {mode === 'edit' ? 'Speichern' : 'Eintragen'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={close}>
              Abbrechen
            </Button>
            {mode === 'edit' && (
              <Button variant="destructive" className="flex-1" disabled={busy} onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
