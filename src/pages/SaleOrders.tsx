import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Printer, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SaleOrderFormDialog } from '@/components/sale-orders/SaleOrderFormDialog';
import { DeleteSaleOrderDialog } from '@/components/sale-orders/DeleteSaleOrderDialog';
import { useSaleOrders } from '@/hooks/useSaleOrders';
import { exportSaleOrderToPDF } from '@/utils/saleOrderPdfExport';
import type { SaleOrderWithItems } from '@/lib/types';

export default function SaleOrders() {
  const { data: orders = [], isLoading } = useSaleOrders();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<SaleOrderWithItems | undefined>(undefined);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.serial_no.toLowerCase().includes(q) ||
        o.party_name.toLowerCase().includes(q) ||
        o.items.some((i) => i.item_name.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const toggleExpand = (id: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sale Orders</h1>
          <p className="text-muted-foreground mt-1">Create and print sale order copies</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Sale Order
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search by serial, party or item…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          Loading sale orders...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          No sale orders yet. Click "New Sale Order" to create one.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Serial No</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th className="text-right">Items</th>
                  <th className="text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const isOpen = expanded.has(o.id);
                  return (
                    <>
                      <tr key={o.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleExpand(o.id)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={isOpen ? 'Collapse' : 'Expand'}
                          >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="font-medium">{o.serial_no}</td>
                        <td className="text-muted-foreground">
                          {format(new Date(o.order_date), 'dd MMM yyyy')}
                        </td>
                        <td>{o.party_name}</td>
                        <td className="text-right tabular-nums">{o.items.length}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Print"
                              onClick={() => exportSaleOrderToPDF(o)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() => setEditing(o)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <DeleteSaleOrderDialog orderId={o.id} serialNo={o.serial_no} />
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${o.id}-detail`} className="bg-muted/30">
                          <td></td>
                          <td colSpan={5} className="py-3">
                            <div className="border border-border rounded-md overflow-hidden bg-card">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left px-3 py-2">Item</th>
                                    <th className="text-left px-3 py-2">Marka</th>
                                    <th className="text-right px-3 py-2">Qty</th>
                                    <th className="text-right px-3 py-2">Rate</th>
                                    <th className="text-right px-3 py-2">(-)%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {o.items.map((it) => (
                                    <tr key={it.id} className="border-t border-border">
                                      <td className="px-3 py-2">{it.item_name}</td>
                                      <td className="px-3 py-2 text-muted-foreground">
                                        {it.marka || '—'}
                                      </td>
                                      <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">{it.rate}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">
                                        {it.discount_percent != null ? `${it.discount_percent}%` : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {o.notes && (
                                <div className="p-3 text-xs text-muted-foreground border-t border-border">
                                  <span className="font-medium text-foreground">Notes: </span>
                                  {o.notes}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add dialog */}
      <SaleOrderFormDialog open={addOpen} onOpenChange={setAddOpen} />
      {/* Edit dialog */}
      <SaleOrderFormDialog
        order={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(undefined)}
      />
    </div>
  );
}
