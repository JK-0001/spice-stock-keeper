import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Printer, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BuiltyFormDialog } from '@/components/builty/BuiltyFormDialog';
import { DeleteBuiltyDialog } from '@/components/builty/DeleteBuiltyDialog';
import { useBuiltyList } from '@/hooks/useBuilty';
import { exportBuiltyToPDF } from '@/utils/builtyPdfExport';
import type { BuiltyWithItems } from '@/lib/types';

export default function Builty() {
  const { data: rows = [], isLoading } = useBuiltyList();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<BuiltyWithItems | undefined>(undefined);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (b) =>
        b.serial_no.toLowerCase().includes(q) ||
        b.party_name.toLowerCase().includes(q) ||
        b.items.some((i) => i.item_name.toLowerCase().includes(q))
    );
  }, [rows, search]);

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
          <h1 className="text-2xl font-bold text-foreground">Builty / Dispatch</h1>
          <p className="text-muted-foreground mt-1">Create and print dispatch copies</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Builty
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
          Loading builtys...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          No builtys yet. Click "New Builty" to create one.
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
                  <th className="text-right">Total Qty</th>
                  <th className="text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const isOpen = expanded.has(b.id);
                  const total = b.items.reduce((s, it) => s + Number(it.quantity || 0), 0);
                  return (
                    <>
                      <tr key={b.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleExpand(b.id)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={isOpen ? 'Collapse' : 'Expand'}
                          >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="font-medium">{b.serial_no}</td>
                        <td className="text-muted-foreground">
                          {format(new Date(b.builty_date), 'dd MMM yyyy')}
                        </td>
                        <td>{b.party_name}</td>
                        <td className="text-right tabular-nums">{b.items.length}</td>
                        <td className="text-right tabular-nums font-medium">{total}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Print"
                              onClick={() => exportBuiltyToPDF(b)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() => setEditing(b)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <DeleteBuiltyDialog builtyId={b.id} serialNo={b.serial_no} />
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${b.id}-detail`} className="bg-muted/30">
                          <td></td>
                          <td colSpan={6} className="py-3">
                            <div className="border border-border rounded-md overflow-hidden bg-card">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left px-3 py-2">Item</th>
                                    <th className="text-left px-3 py-2">Marka</th>
                                    <th className="text-right px-3 py-2">Quantity (Katta)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.items.map((it) => (
                                    <tr key={it.id} className="border-t border-border">
                                      <td className="px-3 py-2">{it.item_name}</td>
                                      <td className="px-3 py-2 text-muted-foreground">{it.marka || '—'}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="border-t-2 border-border bg-muted/30">
                                  <tr>
                                    <td className="px-3 py-2 text-right font-medium" colSpan={2}>Total</td>
                                    <td className="px-3 py-2 text-right font-bold tabular-nums">{total}</td>
                                  </tr>
                                </tfoot>
                              </table>
                              {b.notes && (
                                <div className="p-3 text-xs text-muted-foreground border-t border-border">
                                  <span className="font-medium text-foreground">Notes: </span>
                                  {b.notes}
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
      <BuiltyFormDialog open={addOpen} onOpenChange={setAddOpen} />
      {/* Edit dialog */}
      <BuiltyFormDialog
        builty={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(undefined)}
      />
    </div>
  );
}
