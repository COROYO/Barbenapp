import { Droplet, Milk, Baby as BabyIcon, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useBabyContext } from "@/providers/baby-provider";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [30, 60, 90] as const;
const DEFAULT_OFFSET_MIN = 10;

function vibrate(ms = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

// Default time for a new entry: now - 10 min, snapped to minute
function defaultOccurredAt(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() - DEFAULT_OFFSET_MIN, 0, 0);
  return d;
}

export function QuickFeedButtons() {
  const { user } = useAuth();
  const { currentBaby } = useBabyContext();
  const preferredType = useUiStore((s) => s.preferredType);
  const setPreferredType = useUiStore((s) => s.setPreferredType);
  const openFeedingSheet = useUiStore((s) => s.openFeedingSheet);

  if (!currentBaby || !user) return null;

  function openAmount(type: "pre" | "milk", amount: number) {
    vibrate();
    openFeedingSheet(
      {
        type,
        occurredAt: defaultOccurredAt(),
        amountPreMl: type === "pre" ? amount : null,
        amountMilkMl: type === "milk" ? amount : null,
        note: null,
      },
      "create",
    );
  }

  function openPump() {
    vibrate();
    openFeedingSheet(
      {
        type: "pump",
        occurredAt: defaultOccurredAt(),
        amountPreMl: null,
        amountMilkMl: null,
        note: null,
      },
      "create",
    );
  }

  function openCustom() {
    vibrate(8);
    openFeedingSheet(
      {
        type: preferredType,
        occurredAt: defaultOccurredAt(),
        amountPreMl: preferredType === "pre" ? 25 : null,
        amountMilkMl: preferredType === "milk" ? 25 : null,
        note: null,
      },
      "create",
    );
  }

  return (
    <div className="space-y-3">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => {
            vibrate(6);
            setPreferredType("pre");
          }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
            preferredType === "pre"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <Droplet className="h-4 w-4" />
          Pre
        </button>
        <button
          type="button"
          onClick={() => {
            vibrate(6);
            setPreferredType("milk");
          }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
            preferredType === "milk"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <Milk className="h-4 w-4" />
          Milch
        </button>
      </div>

      {/* Preset amounts */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => openAmount(preferredType, amount)}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card py-5 text-card-foreground transition-transform active:scale-95"
          >
            <span className="text-3xl font-bold text-primary">{amount}</span>
            <span className="text-xs text-muted-foreground">ml</span>
          </button>
        ))}
      </div>

      {/* Pump + custom */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14"
          onClick={openPump}
        >
          <BabyIcon className="mr-2 h-5 w-5" />
          Pumpen
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14"
          onClick={openCustom}
        >
          <MoreHorizontal className="mr-2 h-5 w-5" />
          Andere
        </Button>
      </div>
    </div>
  );
}
