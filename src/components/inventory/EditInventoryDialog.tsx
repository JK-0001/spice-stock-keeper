import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateInventory, useColdStorages, useOutgoingForInventory } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';
import type { InventoryWithStorage } from '@/lib/supabase-types';

const formSchema = z.object({
  item_name: z.string().min(1, 'Item name is required').max(100),
  party_name: z.string().min(1, 'Party name is required').max(100),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  cold_storage_date: z.string().min(1, 'Cold storage date is required'),
  brand: z.string().max(100).optional(),
  purchase_rate: z.coerce.number().min(0, 'Must be positive'),
  cold_storage_id: z.string().optional(),
  lot_number: z.string().max(50).optional(),
  quantity_total: z.coerce.number().min(1, 'Quantity must be at least 1'),
  weight_total: z.preprocess(
    (val) => val === '' || val === undefined ? 0 : val,
    z.coerce.number().min(0, 'Must be positive')
  ),
  cold_rate: z.coerce.number().min(0, 'Must be positive'),
});

type FormData = z.infer<typeof formSchema>;

interface EditInventoryDialogProps {
  item: InventoryWithStorage;
}

export function EditInventoryDialog({ item }: EditInventoryDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: coldStorages } = useColdStorages();
  const { data: outgoing = [] } = useOutgoingForInventory(item.id);
  const updateInventory = useUpdateInventory();
  const { toast } = useToast();

  // Calculate total outgoing quantity
  const totalOutgoing = outgoing.reduce((sum, out) => sum + Number(out.quantity_out), 0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_name: item.item_name,
      party_name: item.party_name,
      purchase_date: item.purchase_date,
      cold_storage_date: item.cold_storage_date,
      brand: item.brand || '',
      purchase_rate: Number(item.purchase_rate),
      cold_storage_id: item.cold_storage_id || undefined,
      lot_number: item.lot_number || '',
      quantity_total: Number(item.quantity_total),
      weight_total: Number(item.weight_total),
      cold_rate: Number(item.cold_rate),
    },
  });

  // Reset form when item changes
  useEffect(() => {
    form.reset({
      item_name: item.item_name,
      party_name: item.party_name,
      purchase_date: item.purchase_date,
      cold_storage_date: item.cold_storage_date,
      brand: item.brand || '',
      purchase_rate: Number(item.purchase_rate),
      cold_storage_id: item.cold_storage_id || undefined,
      lot_number: item.lot_number || '',
      quantity_total: Number(item.quantity_total),
      weight_total: Number(item.weight_total),
      cold_rate: Number(item.cold_rate),
    });
  }, [item, form]);

  const onSubmit = async (data: FormData) => {
    // Validate that quantity_total is not less than total outgoing
    if (data.quantity_total < totalOutgoing) {
      toast({
        title: 'Invalid Quantity',
        description: `Total quantity cannot be less than outgoing quantity (${totalOutgoing}). This would result in negative balance.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateInventory.mutateAsync({
        id: item.id,
        data: {
          item_name: data.item_name,
          party_name: data.party_name,
          purchase_date: data.purchase_date,
          cold_storage_date: data.cold_storage_date,
          brand: data.brand || null,
          purchase_rate: data.purchase_rate,
          cold_storage_id: data.cold_storage_id || null,
          lot_number: data.lot_number || null,
          quantity_total: data.quantity_total,
          weight_total: data.weight_total,
          cold_rate: data.cold_rate,
        },
      });
      toast({ title: 'Inventory updated successfully' });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to update inventory',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inventory</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="item_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DHANIYA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="party_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cold_storage_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cold Storage Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cold_storage_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cold Storage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select storage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coldStorages?.map((cs) => (
                          <SelectItem key={cs.id} value={cs.id}>
                            {cs.cold_storage_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lot_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={totalOutgoing}
                        {...field}
                        placeholder={totalOutgoing > 0 ? `Min: ${totalOutgoing}` : undefined}
                      />
                    </FormControl>
                    <FormMessage />
                    {totalOutgoing > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Minimum: {totalOutgoing} (total outgoing)
                      </p>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchase_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Rate</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cold_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cold Rate (per cycle per unit)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateInventory.isPending}>
                {updateInventory.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
