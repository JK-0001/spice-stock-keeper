import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAddColdStorage } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';
import { handleFormNavKeyDown } from '@/lib/gridNav';

const formSchema = z.object({
  cold_storage_name: z.string().min(1, 'Name is required').max(100),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AddColdStorageDialog() {
  const [open, setOpen] = useState(false);
  const addColdStorage = useAddColdStorage();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cold_storage_name: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addColdStorage.mutateAsync({
        cold_storage_name: data.cold_storage_name,
        notes: data.notes || null,
      });
      toast({ title: 'Cold storage added successfully' });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to add cold storage',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Cold Storage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cold Storage</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleFormNavKeyDown} className="space-y-4">
            <FormField
              control={form.control}
              name="cold_storage_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Warehouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional notes..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addColdStorage.isPending}>
                {addColdStorage.isPending ? 'Adding...' : 'Add Storage'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
