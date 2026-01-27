import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface PendingAction {
  id: string
  type: 'check_in' | 'check_out' | 'case_note' | 'photo_upload'
  shiftId: string
  timestamp: string
  latitude: number
  longitude: number
  createdAt: string
  retryCount?: number
  payload?: {
    note?: string
    photoId?: string
    localUri?: string
    [key: string]: unknown
  }
}

interface SyncStoreState {
  pendingActions: PendingAction[]
  addPendingAction: (action: Omit<PendingAction, 'id' | 'createdAt'>) => void
  removePendingAction: (id: string) => void
  getPendingCount: () => number
  clearAll: () => void
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export const useSyncStore = create<SyncStoreState>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      addPendingAction: (action) =>
        set((state) => ({
          pendingActions: [
            ...state.pendingActions,
            {
              ...action,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removePendingAction: (id) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== id),
        })),
      getPendingCount: () => get().pendingActions.length,
      clearAll: () => set({ pendingActions: [] }),
    }),
    {
      name: 'sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
