import { useState } from 'react';
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
import { useDeleteSaleOrder } from '@/hooks/useSaleOrders';
import { useToast } from '@/hooks/use-toast';

interface Props {
  orderId: string;
  serialNo: string;
}

export function DeleteSaleOrderDialog({ orderId, serialNo }: Props) {
  const [open, setOpen] = useState(false);
  const del = useDeleteSaleOrder();
  const { toast } = useToast();

  const onConfirm = async () => {
    try {
      await del.mutateAsync(orderId);
      toast({ title: `Deleted ${serialNo}` });
      setOpen(false);
    } catch (err) {
      toast({
        title: 'Failed to delete',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Delete order">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete sale order {serialNo}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the order and all its line items. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={del.isPending}>
            {del.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
