import { Link } from 'react-router-dom';
import { Warehouse } from 'lucide-react';
import type { ColdStorageSummary } from '@/hooks/useBillingReports';

interface ColdStorageSummaryTableProps {
  data: ColdStorageSummary[];
  grandTotal: number;
}

export function ColdStorageSummaryTable({ data, grandTotal }: ColdStorageSummaryTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Warehouse className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No billing data found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map(cs => (
        <div key={cs.coldStorageId} className="stat-card">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
            <div className="p-2 rounded-lg bg-primary/10">
              <Warehouse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{cs.coldStorageName}</h3>
              <p className="text-sm text-muted-foreground">{cs.items.length} item(s)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Lot</th>
                  <th className="text-right">Total Cycles</th>
                  <th className="text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {cs.items.map(item => (
                  <tr key={item.inventoryId}>
                    <td>
                      <Link 
                        to={`/inventory/${item.inventoryId}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {item.itemName}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{item.lotNumber || '—'}</td>
                    <td className="text-right tabular-nums">{item.totalCycles}</td>
                    <td className="text-right tabular-nums font-medium">
                      {item.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50">
                  <td colSpan={3} className="text-right font-semibold">
                    Cold Storage Total Payable:
                  </td>
                  <td className="text-right tabular-nums font-bold text-lg text-primary">
                    ₹{cs.totalPayable.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}

      {/* Grand Total */}
      <div className="stat-card bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground text-lg">
            Grand Total (All Cold Storages):
          </span>
          <span className="text-2xl font-bold text-primary tabular-nums">
            ₹{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
