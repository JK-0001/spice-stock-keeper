import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PartyFormDialog } from '@/components/masters/PartyFormDialog';
import { usePartiesMaster, useDeletePartyMaster } from '@/hooks/useMasters';
import { useToast } from '@/hooks/use-toast';
import type { PartyMaster } from '@/lib/types';

export default function PartiesMasterPage() {
  const { data: parties = [], isLoading } = usePartiesMaster();
  const deleteMut = useDeletePartyMaster();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<PartyMaster | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<PartyMaster | undefined>();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q) ||
        (p.city ?? '').toLowerCase().includes(q) ||
        (p.gstin ?? '').toLowerCase().includes(q)
    );
  }, [parties, search]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMut.mutateAsync(confirmDelete.id);
      toast({ title: `"${confirmDelete.name}" deleted` });
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setConfirmDelete(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parties Master</h1>
          <p className="text-muted-foreground mt-1">
            All parties with their contact and billing details. Appear in the Party Name dropdown
            across Inventory, Sale Orders and Builty.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Party
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search by name, phone, city or GSTIN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {parties.length} parties
        </span>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          Loading parties...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          {parties.length === 0
            ? 'No parties yet. Add your first party, or import a list from Settings → Import from Excel.'
            : 'No parties match this search.'}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>GSTIN</th>
                  <th>Address</th>
                  <th className="text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.phone || <span className="text-muted-foreground">—</span>}</td>
                    <td>{p.city || <span className="text-muted-foreground">—</span>}</td>
                    <td>{p.gstin || <span className="text-muted-foreground">—</span>}</td>
                    <td className="max-w-xs truncate" title={p.address ?? ''}>
                      {p.address || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(p)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDelete(p)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PartyFormDialog open={addOpen} onOpenChange={setAddOpen} />
      {editing && (
        <PartyFormDialog
          party={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(undefined)}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this party?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" will be removed from the parties master. Any sale orders or
              builtys that already used this name are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
