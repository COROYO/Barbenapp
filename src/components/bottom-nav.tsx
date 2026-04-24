import { NavLink } from 'react-router-dom'
import { Home, List, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/verlauf', label: 'Verlauf', icon: List, end: false },
  { to: '/stats', label: 'Statistik', icon: BarChart2, end: false },
  { to: '/einstellungen', label: 'Mehr', icon: Settings, end: false },
]

export function BottomNav() {
  return (
    <nav className="border-t border-border bg-background/95 backdrop-blur safe-bottom">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
