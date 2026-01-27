import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  // User info
  userId: string | null
  workerId: string | null
  organizationId: string | null

  // Biometric/PIN state
  hasSetupBiometrics: boolean
  hasSetupPin: boolean
  requiresAuthForCheckIn: boolean
}

interface AuthActions {
  setUser: (userId: string, workerId: string, organizationId: string) => void
  clearUser: () => void
  setHasSetupBiometrics: (value: boolean) => void
  setHasSetupPin: (value: boolean) => void
  checkAuthSetup: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      userId: null,
      workerId: null,
      organizationId: null,
      hasSetupBiometrics: false,
      hasSetupPin: false,
      requiresAuthForCheckIn: true, // Always require for check-in

      // Actions
      setUser: (userId, workerId, organizationId) =>
        set({ userId, workerId, organizationId }),

      clearUser: () =>
        set({
          userId: null,
          workerId: null,
          organizationId: null,
          hasSetupBiometrics: false,
          hasSetupPin: false,
        }),

      setHasSetupBiometrics: (value) => set({ hasSetupBiometrics: value }),
      setHasSetupPin: (value) => set({ hasSetupPin: value }),

      checkAuthSetup: async () => {
        const { checkBiometricSupport } = await import('../lib/biometrics')
        const { hasPin } = await import('../lib/pin-auth')

        const [bioStatus, pinStatus] = await Promise.all([
          checkBiometricSupport(),
          hasPin(),
        ])

        set({
          hasSetupBiometrics: bioStatus.supported && bioStatus.enrolled,
          hasSetupPin: pinStatus,
        })
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialState: (state) => ({
        userId: state.userId,
        workerId: state.workerId,
        organizationId: state.organizationId,
        hasSetupPin: state.hasSetupPin,
      }),
    }
  )
)
