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
import { useAddPartyMaster, useUpdatePartyMaster } from '@/hooks/useMasters';
import { useToast } from '@/hooks/use-toast';
import type { PartyMaster } from '@/lib/types';

interface Props {
  party?: PartyMaster;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PartyFormDialog({ party, trigger, open: openProp, onOpenChange }: Props) {
  const isEdit = !!party;
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const addMut = useAddPartyMaster();
  const updateMut = useUpdatePartyMaster();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setErr('');
    if (party) {
      setName(party.name);
      setPhone(party.phone ?? '');
      setAddress(party.address ?? '');
      setCity(party.city ?? '');
      setGstin(party.gstin ?? '');
      setNotes(party.notes ?? '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setCity('');
      setGstin('');
      setNotes('');
    }
  }, [open, party]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    const trimmed = name.trim();
    if (!trimmed) {
      setErr('Party name is required.');
      return;
    }
    try {
      const payload = {
        name: trimmed,
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        gstin: gstin.trim() || null,
        notes: notes.trim() || null,
      };
      if (isEdit && party) {
        await updateMut.mutateAsync({ id: party.id, data: payload });
        toast({ title: 'Party updated' });
      } else {
        await addMut.mutateAsync(payload);
        toast({ title: 'Party added' });
      }
      setOpen(false);
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : 'Unknown error';
      if (/UNIQUE/i.test(msg)) {
        setErr('A party with this name already exists.');
      } else {
        setErr(msg);
      }
    }
  };

  const pending = addMut.isPending || updateMut.isPending;

  const inner = (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit Party` : 'Add Party'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Party Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Traders" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Optional" />
        </div>
        <div>
          <Label>GSTIN</Label>
          <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="Optional" />
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
            {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Party'}
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
