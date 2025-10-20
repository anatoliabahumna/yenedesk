import { Link, Outlet, useLocation } from 'react-router-dom'
import { FileText, DollarSign, Dumbbell, UtensilsCrossed, Home, Moon, Sun, Cpu, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'

const navigation = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Notes', path: '/notes', icon: FileText },
  { name: 'Finance', path: '/finance', icon: DollarSign },
  { name: 'Fitness', path: '/fitness', icon: Dumbbell },
  { name: 'Meals', path: '/meals', icon: UtensilsCrossed },
  { name: 'PC Build', path: '/pc', icon: Cpu },
]

export default function Layout() {
  const location = useLocation()
  const [theme, setTheme] = useState('light')
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const initial = saved || 'light'
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
    try {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches)
    } catch {}
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('navOrder')
    if (saved) {
      try {
        const order = JSON.parse(saved)
        const ordered = order
          .map((p) => navigation.find((n) => n.path === p))
          .filter(Boolean)
        const missing = navigation.filter((n) => !order.includes(n.path))
        return [...ordered, ...missing]
      } catch {}
    }
    return navigation
  })

  useEffect(() => {
    localStorage.setItem('navOrder', JSON.stringify(items.map((i) => i.path)))
  }, [items])

  const dragState = useMemo(() => ({ index: -1 }), [])

  function onDragStart(e, index) {
    dragState.index = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e, index) {
    e.preventDefault()
    const from = dragState.index
    if (from === -1 || from === index) return
    setItems((prev) => {
      const next = prev.slice()
      const [moved] = next.splice(from, 1)
      next.splice(index, 0, moved)
      return next
    })
    dragState.index = -1
  }

  function onDragEnd() {
    dragState.index = -1
  }

  const SidebarContent = ({ onNavigate }) => (
    <nav className="flex-1 space-y-1 p-4">
      {items.map((item, idx) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <div
            key={item.path}
            draggable={!isTouch}
            onDragStart={!isTouch ? (e) => onDragStart(e, idx) : undefined}
            onDragOver={!isTouch ? onDragOver : undefined}
            onDrop={!isTouch ? (e) => onDrop(e, idx) : undefined}
            onDragEnd={!isTouch ? onDragEnd : undefined}
            className="rounded-lg"
          >
            <Link
              to={item.path}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between gap-3 border-b px-6">
            <h1 className="text-xl font-bold">Personal Toolbox</h1>
            <button
              onClick={toggleTheme}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <SidebarContent />
        </div>
      </aside>

      {/* Content column */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden safe-pt">
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
            aria-label="Open menu"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">Personal Toolbox</h1>
          <button
            onClick={toggleTheme}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>

        {/* Mobile drawer */}
        {isSidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r md:hidden">
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center justify-between gap-3 border-b px-4">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    )}
                    aria-label="Close menu"
                    title="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <SidebarContent onNavigate={() => setSidebarOpen(false)} />
              </div>
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 sm:p-6 md:p-8 safe-pb">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

