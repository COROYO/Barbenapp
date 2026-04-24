import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}
