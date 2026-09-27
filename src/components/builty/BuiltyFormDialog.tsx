import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { useAddBuilty, useUpdateBuilty } from '@/hooks/useBuilty';
import { usePartySuggestions, useItemNameSuggestions, useMarkaSuggestions } from '@/hooks/useSuggestions';
import { useToast } from '@/hooks/use-toast';
import type { BuiltyWithItems, NewBuiltyItem } from '@/lib/types';

interface Props {
  builty?: BuiltyWithItems;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Row = { item_name: string; marka: string; quantity: string };
const emptyRow: Row = { item_name: '', marka: '', quantity: '' };

export function BuiltyFormDialog({ builty, trigger, open: openProp, onOpenChange }: Props) {
  const isEdit = !!builty;
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [builtyDate, setBuiltyDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [submitError, setSubmitError] = useState('');

  const { data: partySuggestions = [] } = usePartySuggestions();
  const { data: itemSuggestions = [] } = useItemNameSuggestions();
  const { data: markaSuggestions = [] } = useMarkaSuggestions();
  const addMut = useAddBuilty();
  const updateMut = useUpdateBuilty();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (builty) {
      setBuiltyDate(builty.builty_date);
      setPartyName(builty.party_name);
      setNotes(builty.notes ?? '');
      setRows(
        builty.items.length > 0
          ? builty.items.map((i) => ({ item_name: i.item_name, marka: i.marka ?? '', quantity: String(i.quantity) }))
          : [{ ...emptyRow }]
      );
    } else {
      setBuiltyDate(new Date().toISOString().split('T')[0]);
      setPartyName('');
      setNotes('');
      setRows([{ ...emptyRow }]);
    }
    setSubmitError('');
  }, [open, builty]);

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addRow = () => setRows((rs) => [...rs, { ...emptyRow }]);
  const removeRow = (idx: number) => setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, i) => i !== idx)));

  const totalQty = rows.reduce((sum, r) => {
    const n = parseFloat(r.quantity);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!partyName.trim()) {
      setSubmitError('Party name is required.');
      return;
    }
    if (!builtyDate) {
      setSubmitError('Date is required.');
      return;
    }

    const items: NewBuiltyItem[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.item_name.trim() && !r.quantity && !r.marka) continue;
      if (!r.item_name.trim()) {
        setSubmitError(`Row ${i + 1}: item name required.`);
        return;
      }
      const qty = parseFloat(r.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        setSubmitError(`Row ${i + 1}: quantity must be greater than 0.`);
        return;
      }
      items.push({
        item_name: r.item_name.trim(),
        marka: r.marka.trim() || null,
        quantity: qty,
        sort_order: items.length,
      });
    }

    if (items.length === 0) {
      setSubmitError('Add at least one item.');
      return;
    }

    try {
      if (isEdit && builty) {
        await updateMut.mutateAsync({
          id: builty.id,
          data: { builty_date: builtyDate, party_name: partyName.trim(), notes: notes.trim() || null, items },
        });
        toast({ title: 'Builty updated' });
      } else {
        await addMut.mutateAsync({
          builty_date: builtyDate,
          party_name: partyName.trim(),
          notes: notes.trim() || null,
          items,
        });
        toast({ title: 'Builty created' });
      }
      setOpen(false);
    } catch (err) {
      toast({
        title: isEdit ? 'Failed to update builty' : 'Failed to create builty',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const pending = addMut.isPending || updateMut.isPending;

  const dialogInner = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit Builty ${builty?.serial_no}` : 'New Builty / Dispatch'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date *</Label>
            <Input type="date" value={builtyDate} onChange={(e) => setBuiltyDate(e.target.value)} />
          </div>
          <div>
            <Label>Party Name *</Label>
            <AutocompleteInput
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              suggestions={partySuggestions}
              placeholder="Type or pick from list"
            />
          </div>
        </div>

        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-2 py-2 font-medium">Item Name *</th>
                <th className="text-left px-2 py-2 font-medium">Marka</th>
                <th className="text-right px-2 py-2 font-medium w-32">Quantity (Katta) *</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="px-2 py-1">
                    <AutocompleteInput
                      value={r.item_name}
                      onChange={(e) => updateRow(idx, { item_name: e.target.value })}
                      suggestions={itemSuggestions}
                      placeholder="Item"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <AutocompleteInput
                      value={r.marka}
                      onChange={(e) => updateRow(idx, { marka: e.target.value })}
                      suggestions={markaSuggestions}
                      placeholder="Brand"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="text-right"
                      value={r.quantity}
                      onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-muted/30">
              <tr>
                <td className="px-2 py-2 text-right font-medium" colSpan={2}>Total</td>
                <td className="px-2 py-2 text-right font-bold tabular-nums">{totalQty}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="w-4 h-4 mr-1" /> Add Row
        </Button>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional remarks…"
            rows={2}
          />
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Builty'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogInner}
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {dialogInner}
    </Dialog>
  );
}
