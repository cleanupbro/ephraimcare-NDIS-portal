import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ShiftStoreState {
  activeShiftId: string | null
  activeShiftStart: string | null // ISO string for serialization
  activeParticipantName: string | null
  setActiveShift: (shiftId: string, startTime: Date, participantName: string) => void
  clearActiveShift: () => void
  getActiveStartDate: () => Date | null
}

export const useShiftStore = create<ShiftStoreState>()(
  persist(
    (set, get) => ({
      activeShiftId: null,
      activeShiftStart: null,
      activeParticipantName: null,
      setActiveShift: (shiftId, startTime, participantName) =>
        set({
          activeShiftId: shiftId,
          activeShiftStart: startTime.toISOString(),
          activeParticipantName: participantName,
        }),
      clearActiveShift: () =>
        set({
          activeShiftId: null,
          activeShiftStart: null,
          activeParticipantName: null,
        }),
      getActiveStartDate: () => {
        const iso = get().activeShiftStart
        return iso ? new Date(iso) : null
      },
    }),
    {
      name: 'active-shift',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
