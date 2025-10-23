import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const duration = toast.duration ?? 4000
    setToasts((prev) => [...prev, { id, ...toast }])
    if (duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration)
      timers.current.set(id, timer)
    }
  }, [removeToast])

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer))
      timers.current.clear()
    }
  }, [])

  const value = useMemo(() => pushToast, [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:right-4 sm:left-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }) {
  const { id, title, description, variant = 'info' } = toast
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? XCircle : Info

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-card p-4 shadow-lg transition-transform sm:w-80',
        variant === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950 dark:text-emerald-100',
        variant === 'error' && 'border-destructive/40 bg-destructive/10 text-destructive',
        variant === 'info' && 'border-border'
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className="mt-1 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 text-sm">
        <p className="font-medium leading-5">{title}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
