import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Minus } from 'lucide-react';
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
import { useAddOutgoing } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';

interface AddOutgoingDialogProps {
  inventoryId: string;
  currentBalance: number;
  totalWeight: number;
  totalQty: number;
  coldStorageDate: string;
}

const createFormSchema = (coldStorageDate: string) => z.object({
  outgoing_date: z.string()
    .min(1, 'Date is required')
    .refine((date) => date >= coldStorageDate, {
      message: `Cannot be before cold storage date (${new Date(coldStorageDate).toLocaleDateString()})`,
    })
    .refine((date) => date <= new Date().toISOString().split('T')[0], {
      message: 'Cannot be a future date',
    }),
  quantity_out: z.coerce.number().min(1, 'Quantity must be at least 1'),
  weight_out: z.preprocess(
    (val) => val === '' || val === undefined ? 0 : val,
    z.coerce.number().min(0, 'Must be positive')
  ),
  remarks: z.string().max(500).optional(),
});

export function AddOutgoingDialog({
  inventoryId,
  currentBalance,
  totalWeight,
  totalQty,
  coldStorageDate
}: AddOutgoingDialogProps) {
  const [open, setOpen] = useState(false);
  const addOutgoing = useAddOutgoing();
  const { toast } = useToast();

  const formSchema = createFormSchema(coldStorageDate);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outgoing_date: new Date().toISOString().split('T')[0],
      quantity_out: undefined,
      weight_out: undefined,
      remarks: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (data.quantity_out > currentBalance) {
      toast({
        title: 'Invalid quantity',
        description: `Cannot exceed current balance of ${currentBalance}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await addOutgoing.mutateAsync({
        inventory_id: inventoryId,
        outgoing_date: data.outgoing_date,
        quantity_out: data.quantity_out,
        weight_out: data.weight_out,
        remarks: data.remarks || null,
      });
      toast({ title: 'Outgoing recorded successfully' });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to record outgoing',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Auto-calculate weight based on quantity proportion
  const watchQty = form.watch('quantity_out');
  const suggestedWeight = totalQty > 0 ? (watchQty / totalQty) * totalWeight : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={currentBalance <= 0}>
          <Minus className="w-4 h-4 mr-2" />
          Record Outgoing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Stock Outgoing</DialogTitle>
        </DialogHeader>
        <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
          <span className="text-muted-foreground">Available Balance:</span>{' '}
          <span className="font-semibold">{currentBalance} units</span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="outgoing_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outgoing Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={coldStorageDate}
                      max={new Date().toISOString().split('T')[0]}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity_out"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Out *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max={currentBalance}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight_out"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight Out (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder={`~${suggestedWeight.toFixed(2)}`}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
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
              <Button type="submit" disabled={addOutgoing.isPending}>
                {addOutgoing.isPending ? 'Recording...' : 'Record Outgoing'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
