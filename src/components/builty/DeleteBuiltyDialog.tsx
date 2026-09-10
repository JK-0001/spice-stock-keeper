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
import { useDeleteBuilty } from '@/hooks/useBuilty';
import { useToast } from '@/hooks/use-toast';

interface Props {
  builtyId: string;
  serialNo: string;
}

export function DeleteBuiltyDialog({ builtyId, serialNo }: Props) {
  const [open, setOpen] = useState(false);
  const del = useDeleteBuilty();
  const { toast } = useToast();

  const onConfirm = async () => {
    try {
      await del.mutateAsync(builtyId);
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
        <Button variant="ghost" size="icon" title="Delete builty">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete builty {serialNo}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the builty and all its line items. This cannot be undone.
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
