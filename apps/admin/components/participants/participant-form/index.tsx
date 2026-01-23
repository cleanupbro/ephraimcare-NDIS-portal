'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { cn } from '@ephraimcare/ui'
import { useParticipantFormStore } from '@/lib/participants/form-store'
import { useCreateParticipant } from '@/hooks/use-create-participant'
import { toast } from '@/lib/toast'
import { createClient } from '@/lib/supabase/client'
import { StepBasicInfo } from './step-basic-info'
import { StepPlanDetails } from './step-plan-details'
import { StepContacts } from './step-contacts'
import { StepSupportNeeds } from './step-support-needs'

const STEPS = [
  { label: 'Basic Info', description: 'Personal details' },
  { label: 'Plan Details', description: 'NDIS plan info' },
  { label: 'Contacts', description: 'Address & contacts' },
  { label: 'Support Needs', description: 'Notes & goals' },
] as const

export function ParticipantForm() {
  const router = useRouter()
  const { currentStep, setStep, completedSteps, canNavigateToStep, getFullFormData, reset } =
    useParticipantFormStore()
  const createParticipant = useCreateParticipant()

  // Reset form state on mount to prevent ghost data
  useEffect(() => {
    reset()
  }, [reset])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    if (canNavigateToStep(stepIndex)) {
      setStep(stepIndex)
    }
  }

  const handleSubmitAll = async () => {
    const formData = getFullFormData()
    if (!formData) {
      toast({
        title: 'Form incomplete',
        description: 'Please complete all steps before submitting.',
        variant: 'error',
      })
      return
    }

    try {
      // Get organization_id from current user session
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: 'Authentication error', description: 'Please log in again.', variant: 'error' })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        toast({ title: 'Profile error', description: 'Could not load your profile.', variant: 'error' })
        return
      }

      await createParticipant.mutateAsync({
        ...formData,
        organization_id: (profile as any).organization_id,
      })

      toast({
        title: 'Participant created',
        description: `${formData.basicInfo.first_name} ${formData.basicInfo.last_name} has been added successfully.`,
        variant: 'success',
      })

      reset()
      router.push('/participants')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast({
        title: 'Failed to create participant',
        description: message,
        variant: 'error',
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Stepper UI */}
      <nav aria-label="Form progress">
        <ol className="flex items-center">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(index)
            const isActive = currentStep === index
            const isClickable = canNavigateToStep(index)

            return (
              <li key={step.label} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-2 group',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-60'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {/* Step circle */}
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      isCompleted && 'bg-green-600 text-white',
                      isActive && !isCompleted && 'bg-primary text-primary-foreground',
                      !isActive && !isCompleted && 'border-2 border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  {/* Step label */}
                  <span className="hidden sm:block">
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        isActive && 'text-foreground',
                        !isActive && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                </button>

                {/* Connecting line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-3 h-0.5 flex-1 hidden sm:block',
                      isCompleted ? 'bg-green-600' : 'bg-muted-foreground/20'
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && <StepBasicInfo onNext={handleNext} />}
        {currentStep === 1 && <StepPlanDetails onNext={handleNext} onBack={handleBack} />}
        {currentStep === 2 && <StepContacts onNext={handleNext} onBack={handleBack} />}
        {currentStep === 3 && (
          <StepSupportNeeds
            onSubmitAll={handleSubmitAll}
            onBack={handleBack}
            isSubmitting={createParticipant.isPending}
          />
        )}
      </div>
    </div>
  )
}
