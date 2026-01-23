'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Label, Button } from '@ephraimcare/ui'
import { planDetailsSchema, type PlanDetailsData } from '@/lib/participants/schemas'
import { useParticipantFormStore } from '@/lib/participants/form-store'
import { Plus, Trash2 } from 'lucide-react'

interface StepPlanDetailsProps {
  onNext: () => void
  onBack: () => void
}

export function StepPlanDetails({ onNext, onBack }: StepPlanDetailsProps) {
  const { planDetails, setPlanDetails, markStepComplete } = useParticipantFormStore()

  const form = useForm<PlanDetailsData>({
    resolver: zodResolver(planDetailsSchema),
    defaultValues: planDetails ?? {
      plan_number: '',
      plan_start_date: '',
      plan_end_date: '',
      total_budget: 0,
      budget_categories: [{ category: '', allocated_amount: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'budget_categories',
  })

  const onSubmit = (data: PlanDetailsData) => {
    // Filter out empty budget categories
    const cleanedData = {
      ...data,
      budget_categories: data.budget_categories?.filter(
        (cat) => cat.category.trim() !== ''
      ),
    }
    setPlanDetails(cleanedData)
    markStepComplete(1)
    onNext()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Plan Number */}
      <div className="space-y-2">
        <Label htmlFor="plan_number">Plan Number</Label>
        <Input
          id="plan_number"
          placeholder="Optional plan reference number"
          {...form.register('plan_number')}
        />
        {form.formState.errors.plan_number && (
          <p className="text-sm text-destructive">
            {form.formState.errors.plan_number.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Plan Start Date */}
        <div className="space-y-2">
          <Label htmlFor="plan_start_date">
            Plan Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="plan_start_date"
            type="date"
            {...form.register('plan_start_date')}
          />
          {form.formState.errors.plan_start_date && (
            <p className="text-sm text-destructive">
              {form.formState.errors.plan_start_date.message}
            </p>
          )}
        </div>

        {/* Plan End Date */}
        <div className="space-y-2">
          <Label htmlFor="plan_end_date">
            Plan End Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="plan_end_date"
            type="date"
            {...form.register('plan_end_date')}
          />
          {form.formState.errors.plan_end_date && (
            <p className="text-sm text-destructive">
              {form.formState.errors.plan_end_date.message}
            </p>
          )}
        </div>
      </div>

      {/* Total Budget */}
      <div className="space-y-2">
        <Label htmlFor="total_budget">
          Total Budget ($) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="total_budget"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...form.register('total_budget', { valueAsNumber: true })}
        />
        {form.formState.errors.total_budget && (
          <p className="text-sm text-destructive">
            {form.formState.errors.total_budget.message}
          </p>
        )}
      </div>

      {/* Budget Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Budget Categories (Optional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ category: '', allocated_amount: 0 })}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Category
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Category name"
                {...form.register(`budget_categories.${index}.category`)}
              />
              {form.formState.errors.budget_categories?.[index]?.category && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.budget_categories[index]?.category?.message}
                </p>
              )}
            </div>
            <div className="w-32 space-y-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="$0.00"
                {...form.register(`budget_categories.${index}.allocated_amount`, {
                  valueAsNumber: true,
                })}
              />
              {form.formState.errors.budget_categories?.[index]?.allocated_amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.budget_categories[index]?.allocated_amount?.message}
                </p>
              )}
            </div>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => remove(index)}
                className="shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Next
        </Button>
      </div>
    </form>
  )
}
