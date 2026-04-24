import { useBabyContext } from "@/providers/baby-provider";
import { ChevronDown } from "lucide-react";

export function BabySwitcher() {
  const { babies, currentBaby, setCurrentBabyId } = useBabyContext();

  if (!currentBaby) return null;
  if (babies.length <= 1) {
    return <div className="text-base font-semibold">{currentBaby.name}</div>;
  }

  return (
    <div className="relative">
      <select
        value={currentBaby.id}
        onChange={(e) => setCurrentBabyId(e.target.value)}
        className="appearance-none bg-transparent pr-6 text-base font-semibold focus:outline-none"
      >
        {babies.map((b) => (
          <option key={b.id} value={b.id} className="bg-background">
            {b.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
