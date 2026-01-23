import { create } from 'zustand'
import type { BasicInfoData, PlanDetailsData, ContactsData, SupportNeedsData } from './schemas'

interface ParticipantFormState {
  // State
  currentStep: number
  basicInfo: BasicInfoData | null
  planDetails: PlanDetailsData | null
  contacts: ContactsData | null
  supportNeeds: SupportNeedsData | null
  completedSteps: Set<number>

  // Actions
  setStep: (step: number) => void
  setBasicInfo: (data: BasicInfoData) => void
  setPlanDetails: (data: PlanDetailsData) => void
  setContacts: (data: ContactsData) => void
  setSupportNeeds: (data: SupportNeedsData) => void
  markStepComplete: (step: number) => void
  reset: () => void

  // Derived
  getFullFormData: () => {
    basicInfo: BasicInfoData
    planDetails: PlanDetailsData
    contacts: ContactsData
    supportNeeds: SupportNeedsData
  } | null
  canNavigateToStep: (step: number) => boolean
}

const initialState = {
  currentStep: 0,
  basicInfo: null,
  planDetails: null,
  contacts: null,
  supportNeeds: null,
  completedSteps: new Set<number>(),
}

export const useParticipantFormStore = create<ParticipantFormState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setBasicInfo: (data) => set({ basicInfo: data }),

  setPlanDetails: (data) => set({ planDetails: data }),

  setContacts: (data) => set({ contacts: data }),

  setSupportNeeds: (data) => set({ supportNeeds: data }),

  markStepComplete: (step) =>
    set((state) => ({
      completedSteps: new Set([...state.completedSteps, step]),
    })),

  reset: () =>
    set({
      currentStep: 0,
      basicInfo: null,
      planDetails: null,
      contacts: null,
      supportNeeds: null,
      completedSteps: new Set<number>(),
    }),

  getFullFormData: () => {
    const { basicInfo, planDetails, contacts, supportNeeds } = get()
    if (!basicInfo || !planDetails || !contacts || !supportNeeds) {
      return null
    }
    return { basicInfo, planDetails, contacts, supportNeeds }
  },

  canNavigateToStep: (step) => {
    const { completedSteps } = get()
    if (step === 0) return true
    // All previous steps must be completed
    for (let i = 0; i < step; i++) {
      if (!completedSteps.has(i)) return false
    }
    return true
  },
}))
