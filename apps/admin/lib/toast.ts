import { create } from 'zustand'

export type ToastVariant = 'default' | 'success' | 'error'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

export function toast(options: { title: string; description?: string; variant?: ToastVariant }) {
  useToastStore.getState().addToast({
    title: options.title,
    description: options.description,
    variant: options.variant ?? 'default',
  })
}
