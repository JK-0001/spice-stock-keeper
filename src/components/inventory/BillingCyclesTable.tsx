import { format, isWithinInterval, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BillingCycle } from '@/lib/billing-cycles';

interface BillingCyclesTableProps {
  cycles: BillingCycle[];
  itemName: string;
  totalCost: number;
}

function isCurrentCycle(cycle: BillingCycle): boolean {
  const today = startOfDay(new Date());
  return isWithinInterval(today, { start: cycle.startDate, end: cycle.endDate });
}

export function BillingCyclesTable({ cycles, itemName, totalCost }: BillingCyclesTableProps) {
  if (cycles.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No billing cycles generated yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Item</th>
              <th className="text-right">Opening Qty</th>
              <th className="text-right">Rate (₹)</th>
              <th className="text-right">Charge (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map((cycle, index) => {
              const isCurrent = isCurrentCycle(cycle);
              return (
                <tr 
                  key={cycle.cycleNumber}
                  className={cn(
                    isCurrent && "bg-primary/10 ring-1 ring-primary/30"
                  )}
                >
                  <td className="font-medium">
                    {cycle.cycleNumber}
                    {isCurrent && (
                      <span className="ml-2 text-xs text-primary font-semibold">← NOW</span>
                    )}
                  </td>
                  <td>{format(cycle.startDate, 'dd MMM yyyy')}</td>
                  <td>{format(cycle.endDate, 'dd MMM yyyy')}</td>
                  <td className="text-muted-foreground">
                    {index === 0 ? itemName : '—'}
                  </td>
                  <td className="text-right tabular-nums font-medium">
                    {cycle.openingQuantity}
                  </td>
                  <td className="text-right tabular-nums">
                    {cycle.rate.toLocaleString()}
                  </td>
                  <td className="text-right tabular-nums font-semibold">
                    {cycle.storageCharge.toLocaleString()}
                  </td>
                  <td>
                    {cycle.isFinal ? (
                      <Badge variant="secondary">Final</Badge>
                    ) : isCurrent ? (
                      <Badge className="bg-primary text-primary-foreground">Current</Badge>
                    ) : (
                      <Badge variant="outline">Completed</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={6} className="text-right font-semibold">
                Total Cold Storage Cost:
              </td>
              <td className="text-right tabular-nums font-bold text-lg text-primary">
                ₹{totalCost.toLocaleString()}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
        <p><strong>Billing Logic:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Fixed 30-day cycles starting from incoming date</li>
          <li>Charge = Opening Quantity × Rate per cycle</li>
          <li>Outgoing affects next cycle only (no mid-cycle adjustments)</li>
          <li>Final cycle fully charged even if cleared mid-cycle</li>
        </ul>
      </div>
    </div>
  );
}
