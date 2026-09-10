import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, X, Check } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useUpdateOutgoing, useDeleteOutgoing } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';
import type { Outgoing } from '@/lib/supabase-types';

interface OutgoingTableProps {
  outgoing: Outgoing[];
  inventoryId: string;
  coldStorageDate: string;
  currentBalance: number;
}

export function OutgoingTable({ outgoing, inventoryId, coldStorageDate, currentBalance }: OutgoingTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    outgoing_date: string;
    quantity_out: number;
    weight_out: number;
    remarks: string;
  } | null>(null);

  const updateOutgoing = useUpdateOutgoing();
  const deleteOutgoing = useDeleteOutgoing();
  const { toast } = useToast();

  const handleEdit = (out: Outgoing) => {
    setEditingId(out.id);
    setEditData({
      outgoing_date: out.outgoing_date,
      quantity_out: Number(out.quantity_out),
      weight_out: Number(out.weight_out),
      remarks: out.remarks || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editData) return;

    // Validate date
    const today = new Date().toISOString().split('T')[0];
    if (editData.outgoing_date < coldStorageDate) {
      toast({
        title: 'Invalid date',
        description: `Cannot be before cold storage date (${new Date(coldStorageDate).toLocaleDateString()})`,
        variant: 'destructive',
      });
      return;
    }
    if (editData.outgoing_date > today) {
      toast({
        title: 'Invalid date',
        description: 'Cannot be a future date',
        variant: 'destructive',
      });
      return;
    }

    // Validate quantity: check if the new quantity would cause negative balance
    // Calculate what the balance would be if we change this outgoing entry
    const currentOutgoing = outgoing.find(o => o.id === id);
    if (currentOutgoing) {
      const oldQuantity = Number(currentOutgoing.quantity_out);
      const newQuantity = editData.quantity_out;
      const newBalance = currentBalance + oldQuantity - newQuantity;

      if (newBalance < 0) {
        toast({
          title: 'Invalid quantity',
          description: `This would result in a negative balance. Maximum allowed: ${currentBalance + oldQuantity}`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await updateOutgoing.mutateAsync({
        id,
        inventoryId,
        data: {
          outgoing_date: editData.outgoing_date,
          quantity_out: editData.quantity_out,
          weight_out: editData.weight_out,
          remarks: editData.remarks || null,
        },
      });
      toast({ title: 'Outgoing updated successfully' });
      setEditingId(null);
      setEditData(null);
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOutgoing.mutateAsync({ id, inventoryId });
      toast({ title: 'Outgoing deleted successfully' });
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (outgoing.length === 0) {
    return <p className="text-muted-foreground text-sm">No outgoing records yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Qty Out</th>
            <th>Weight Out</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {outgoing.map((out) => (
            <tr key={out.id}>
              {editingId === out.id ? (
                <>
                  <td>
                    <Input
                      type="date"
                      value={editData?.outgoing_date || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, outgoing_date: e.target.value } : null)}
                      min={coldStorageDate}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-32"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={editData?.quantity_out || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, quantity_out: Number(e.target.value) } : null)}
                      className="w-20 text-center"
                      min={1}
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={editData?.weight_out || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, weight_out: Number(e.target.value) } : null)}
                      className="w-24"
                      min={0}
                      step={0.01}
                    />
                  </td>
                  <td>
                    <Input
                      value={editData?.remarks || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, remarks: e.target.value } : null)}
                      placeholder="Remarks..."
                      className="w-32"
                    />
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveEdit(out.id)}
                        disabled={updateOutgoing.isPending}
                        className="h-8 w-8 text-success hover:text-success"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td>{format(new Date(out.outgoing_date), 'dd MMM yyyy')}</td>
                  <td className="text-right tabular-nums font-medium">{out.quantity_out}</td>
                  <td className="text-right tabular-nums">{out.weight_out} kg</td>
                  <td className="text-muted-foreground">{out.remarks || '—'}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(out)}
                        className="h-8 w-8"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Outgoing Record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this outgoing entry and recalculate the inventory balance.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(out.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
