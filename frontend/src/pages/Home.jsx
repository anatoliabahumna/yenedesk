import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, DollarSign, Dumbbell, UtensilsCrossed, Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export default function Home() {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    try {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches)
    } catch {}
  }, [])
  const defaultModules = [
    {
      name: 'Notes',
      description: 'Capture and organize your thoughts',
      icon: FileText,
      path: '/notes',
      color: 'text-blue-500',
    },
    {
      name: 'Finance',
      description: 'Track income and expenses',
      icon: DollarSign,
      path: '/finance',
      color: 'text-green-500',
    },
    {
      name: 'Fitness',
      description: 'Log your workouts',
      icon: Dumbbell,
      path: '/fitness',
      color: 'text-orange-500',
    },
    {
      name: 'Meals',
      description: 'Manage recipes and meal plans',
      icon: UtensilsCrossed,
      path: '/meals',
      color: 'text-purple-500',
    },
    {
      name: 'PC Build',
      description: 'Plan parts and track orders/returns',
      icon: Cpu,
      path: '/pc',
      color: 'text-cyan-500',
    },
  ]

  const [modules, setModules] = useState(() => {
    const saved = localStorage.getItem('homeOrder')
    if (saved) {
      try {
        const order = JSON.parse(saved)
        const ordered = order
          .map((p) => defaultModules.find((m) => m.path === p))
          .filter(Boolean)
        const missing = defaultModules.filter((m) => !order.includes(m.path))
        return [...ordered, ...missing]
      } catch {}
    }
    return defaultModules
  })

  useEffect(() => {
    localStorage.setItem('homeOrder', JSON.stringify(modules.map((m) => m.path)))
  }, [modules])

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
    setModules((prev) => {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to Your Personal Toolbox</h1>
        <p className="text-muted-foreground mt-2">
          A private, local-only app to organize your everyday life
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((module, idx) => {
          const Icon = module.icon
          return (
            <div
              key={module.path}
              draggable={!isTouch}
              onDragStart={!isTouch ? (e) => onDragStart(e, idx) : undefined}
              onDragOver={!isTouch ? onDragOver : undefined}
              onDrop={!isTouch ? (e) => onDrop(e, idx) : undefined}
              onDragEnd={!isTouch ? onDragEnd : undefined}
              className="rounded-lg"
            >
              <Link to={module.path}>
                <Card className="transition-shadow hover:shadow-lg cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={cn('p-3 rounded-lg bg-secondary', module.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle>{module.name}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

