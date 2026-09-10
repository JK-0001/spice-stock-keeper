import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useDeleteInventory } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';

interface DeleteInventoryDialogProps {
  inventoryId: string;
  itemName: string;
}

export function DeleteInventoryDialog({ inventoryId, itemName }: DeleteInventoryDialogProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const deleteInventory = useDeleteInventory();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteInventory.mutateAsync(inventoryId);
      toast({ title: 'Inventory deleted successfully' });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Failed to delete inventory',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Inventory Item?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{itemName}</strong> and all its outgoing records.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteInventory.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteInventory.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
