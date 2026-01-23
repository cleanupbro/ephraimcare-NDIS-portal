import { createClient } from '@/lib/supabase/server'

export default async function PlansPage() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('ndis_plans')
    .select('*, participants(first_name, last_name), plan_budgets(*)')
    .order('start_date', { ascending: false }) as { data: Array<{
      id: string
      plan_number: string
      start_date: string
      end_date: string
      total_budget: number
      is_current: boolean
      participants: { first_name: string; last_name: string } | null
      plan_budgets: Array<{ category: string; subcategory: string; allocated_amount: number }>
    }> | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">NDIS Plans</h1>
          <p className="text-sm text-muted-foreground">
            {plans?.length ?? 0} plans
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + New Plan
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans?.map((plan) => {
          const budgetTotal = plan.plan_budgets?.reduce((sum, b) => sum + Number(b.allocated_amount), 0) ?? 0

          return (
            <div key={plan.id} className="rounded-lg border border-border p-5 hover:bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">
                    {plan.participants?.first_name} {plan.participants?.last_name}
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground">{plan.plan_number}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  plan.is_current
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.is_current ? 'Current' : 'Expired'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Period</span>
                  <p className="font-medium">
                    {new Date(plan.start_date).toLocaleDateString('en-AU')} —{' '}
                    {new Date(plan.end_date).toLocaleDateString('en-AU')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Budget</span>
                  <p className="font-medium text-lg">${Number(plan.total_budget).toLocaleString()}</p>
                </div>
              </div>

              {plan.plan_budgets && plan.plan_budgets.length > 0 && (
                <div className="mt-3 space-y-1">
                  {plan.plan_budgets.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{b.category} — {b.subcategory}</span>
                      <span className="font-mono">${Number(b.allocated_amount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-medium border-t border-border pt-1 mt-1">
                    <span>Allocated</span>
                    <span className="font-mono">${budgetTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {(!plans || plans.length === 0) && (
          <div className="col-span-2 rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground">No NDIS plans found</p>
          </div>
        )}
      </div>
    </div>
  )
}
