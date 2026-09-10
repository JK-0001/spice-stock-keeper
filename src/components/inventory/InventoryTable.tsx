import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { InventoryWithStorage } from '@/lib/supabase-types';

export type SortColumn = 'item_name' | 'party_name' | 'cold_storage' | 'purchase_date';
export type SortDirection = 'asc' | 'desc';

interface InventoryTableProps {
  data: InventoryWithStorage[];
  isLoading?: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSortChange: (column: SortColumn) => void;
}

export function InventoryTable({ data, isLoading, sortColumn, sortDirection, onSortChange }: InventoryTableProps) {
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (column !== sortColumn) {
      return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        Loading inventory...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        No inventory items found. Add your first item to get started.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  onClick={() => onSortChange('item_name')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Item <SortIcon column="item_name" />
                </button>
              </th>
              <th>
                <button
                  type="button"
                  onClick={() => onSortChange('party_name')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Party <SortIcon column="party_name" />
                </button>
              </th>
              <th>
                <button
                  type="button"
                  onClick={() => onSortChange('cold_storage')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Cold Storage <SortIcon column="cold_storage" />
                </button>
              </th>
              <th>Lot #</th>
              <th>
                <button
                  type="button"
                  onClick={() => onSortChange('purchase_date')}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Date <SortIcon column="purchase_date" />
                </button>
              </th>
              <th className="text-right">Total Qty</th>
              <th className="text-right">Balance</th>
              <th className="text-right">Purchase Rate</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const balancePercent = (Number(item.current_balance_qty) / Number(item.quantity_total)) * 100;
              const isLowBalance = balancePercent > 0 && balancePercent < 20;

              return (
                <tr key={item.id}>
                  <td className="font-medium">{item.item_name}</td>
                  <td>{item.party_name}</td>
                  <td>{item.cold_storages?.cold_storage_name || '—'}</td>
                  <td className="text-muted-foreground">{item.lot_number || '—'}</td>
                  <td className="text-muted-foreground">
                    {format(new Date(item.purchase_date), 'dd MMM yyyy')}
                  </td>
                  <td className="text-right tabular-nums">{item.quantity_total}</td>
                  <td className={`text-right tabular-nums font-medium ${isLowBalance ? 'text-warning' : ''}`}>
                    {item.current_balance_qty}
                  </td>
                  <td className="text-right tabular-nums">₹{item.purchase_rate}</td>
                  <td>
                    <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td>
                    <Link
                      to={`/inventory/${item.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
