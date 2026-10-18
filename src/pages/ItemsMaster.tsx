import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
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
import { ItemFormDialog } from '@/components/masters/ItemFormDialog';
import { useItemsMaster, useDeleteItemMaster } from '@/hooks/useMasters';
import { useToast } from '@/hooks/use-toast';
import type { ItemMaster } from '@/lib/types';

export default function ItemsMasterPage() {
  const { data: items = [], isLoading } = useItemsMaster();
  const deleteMut = useDeleteItemMaster();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ItemMaster | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<ItemMaster | undefined>();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.brand ?? '').toLowerCase().includes(q) ||
        (i.unit ?? '').toLowerCase().includes(q) ||
        (i.hsn_code ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

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
          <h1 className="text-2xl font-bold text-foreground">Items Master</h1>
          <p className="text-muted-foreground mt-1">
            All items with their default unit, brand and HSN code. The unit here is pulled into Sale
            Orders and Builtys when you type the item name.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search by name, brand, unit or HSN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {items.length} items
        </span>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          Loading items...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          {items.length === 0
            ? 'No items yet. Add your first item, or import a list from Settings → Import from Excel.'
            : 'No items match this search.'}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Unit</th>
                  <th>Brand</th>
                  <th>HSN</th>
                  <th>Notes</th>
                  <th className="text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id}>
                    <td className="font-medium">{it.name}</td>
                    <td>{it.unit || <span className="text-muted-foreground">—</span>}</td>
                    <td>{it.brand || <span className="text-muted-foreground">—</span>}</td>
                    <td>{it.hsn_code || <span className="text-muted-foreground">—</span>}</td>
                    <td className="max-w-xs truncate" title={it.notes ?? ''}>
                      {it.notes || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(it)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDelete(it)}
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

      <ItemFormDialog open={addOpen} onOpenChange={setAddOpen} />
      {editing && (
        <ItemFormDialog
          item={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(undefined)}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" will be removed from the items master. Any sale orders or
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
