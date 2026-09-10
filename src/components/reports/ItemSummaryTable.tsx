import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import type { ItemSummary } from '@/hooks/useBillingReports';

interface ItemSummaryTableProps {
  data: ItemSummary[];
  grandTotal: number;
}

export function ItemSummaryTable({ data, grandTotal }: ItemSummaryTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No billing data found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="stat-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Lot</th>
                <th>Cold Storage</th>
                <th className="text-right">Total Cycles</th>
                <th className="text-right">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
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
                  <td className="text-muted-foreground">{item.coldStorageName}</td>
                  <td className="text-right tabular-nums">{item.totalCycles}</td>
                  <td className="text-right tabular-nums font-medium">
                    {item.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/50">
                <td colSpan={4} className="text-right font-semibold">
                  Total Payable:
                </td>
                <td className="text-right tabular-nums font-bold text-lg text-primary">
                  ₹{grandTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
