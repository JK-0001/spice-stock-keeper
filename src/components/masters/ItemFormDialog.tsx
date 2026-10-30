import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { useAddItemMaster, useUpdateItemMaster } from '@/hooks/useMasters';
import { useToast } from '@/hooks/use-toast';
import { handleFormNavKeyDown } from '@/lib/gridNav';
import type { ItemMaster } from '@/lib/types';

// Common units in Indian spice trade. These feed the datalist suggestions
// so the operator can either pick or type a custom one.
export const COMMON_UNITS = ['kg', 'katta', 'bag', 'box', 'piece', 'dozen'];

interface Props {
  item?: ItemMaster;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ItemFormDialog({ item, trigger, open: openProp, onOpenChange }: Props) {
  const isEdit = !!item;
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [brand, setBrand] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const addMut = useAddItemMaster();
  const updateMut = useUpdateItemMaster();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setErr('');
    if (item) {
      setName(item.name);
      setUnit(item.unit ?? '');
      setBrand(item.brand ?? '');
      setHsnCode(item.hsn_code ?? '');
      setNotes(item.notes ?? '');
    } else {
      setName('');
      setUnit('');
      setBrand('');
      setHsnCode('');
      setNotes('');
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    const trimmed = name.trim();
    if (!trimmed) {
      setErr('Item name is required.');
      return;
    }
    try {
      if (isEdit && item) {
        await updateMut.mutateAsync({
          id: item.id,
          data: {
            name: trimmed,
            unit: unit.trim() || null,
            brand: brand.trim() || null,
            hsn_code: hsnCode.trim() || null,
            notes: notes.trim() || null,
          },
        });
        toast({ title: 'Item updated' });
      } else {
        await addMut.mutateAsync({
          name: trimmed,
          unit: unit.trim() || null,
          brand: brand.trim() || null,
          hsn_code: hsnCode.trim() || null,
          notes: notes.trim() || null,
        });
        toast({ title: 'Item added' });
      }
      setOpen(false);
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : 'Unknown error';
      // SQLite UNIQUE collision → tell the user plainly
      if (/UNIQUE/i.test(msg)) {
        setErr('An item with this name already exists.');
      } else {
        setErr(msg);
      }
    }
  };

  const pending = addMut.isPending || updateMut.isPending;

  const inner = (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit Item` : 'Add Item'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} onKeyDown={handleFormNavKeyDown} className="space-y-4">
        <div>
          <Label>Item Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Red Chilli" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Unit</Label>
            <AutocompleteInput
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              suggestions={COMMON_UNITS}
              placeholder="kg / katta / bag…"
            />
          </div>
          <div>
            <Label>Brand</Label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div>
          <Label>HSN Code</Label>
          <Input value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional" />
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {inner}
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {inner}
    </Dialog>
  );
}
