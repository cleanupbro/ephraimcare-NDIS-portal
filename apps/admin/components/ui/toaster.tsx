'use client'

import { useToastStore } from '@/lib/toast'
import { cn } from '@ephraimcare/ui'
import { X } from 'lucide-react'

export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-md border p-4 shadow-lg min-w-[300px] max-w-[420px] animate-in slide-in-from-bottom-2',
            t.variant === 'success' && 'border-green-200 bg-green-50 text-green-900',
            t.variant === 'error' && 'border-red-200 bg-red-50 text-red-900',
            t.variant === 'default' && 'border-border bg-card text-card-foreground'
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && (
              <p className="mt-1 text-xs opacity-80">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 rounded-sm opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
