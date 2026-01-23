import { createClient } from '@/lib/supabase/server'

export default async function InvoicesPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, participants(first_name, last_name)')
    .order('invoice_date', { ascending: false }) as { data: Array<{
      id: string
      invoice_number: string
      invoice_date: string
      due_date: string | null
      subtotal: number
      gst: number
      total: number
      status: string
      participants: { first_name: string; last_name: string } | null
    }> | null }

  function getStatusColor(status: string) {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {invoices?.length ?? 0} invoices
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          + Create Invoice
        </button>
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Invoice #</th>
              <th className="px-4 py-3 text-left font-medium">Participant</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Subtotal</th>
              <th className="px-4 py-3 text-right font-medium">GST</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  {inv.invoice_number}
                </td>
                <td className="px-4 py-3">
                  {inv.participants?.first_name} {inv.participants?.last_name}
                </td>
                <td className="px-4 py-3">
                  {new Date(inv.invoice_date).toLocaleDateString('en-AU')}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${inv.subtotal.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${inv.gst.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium">
                  ${inv.total.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!invoices || invoices.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
