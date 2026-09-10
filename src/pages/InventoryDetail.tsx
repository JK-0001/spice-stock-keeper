import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Package, Calendar, Warehouse, Hash, Scale, IndianRupee, Receipt, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInventoryItem, useOutgoingForInventory } from '@/hooks/useInventory';
import { AddOutgoingDialog } from '@/components/inventory/AddOutgoingDialog';
import { EditInventoryDialog } from '@/components/inventory/EditInventoryDialog';
import { DeleteInventoryDialog } from '@/components/inventory/DeleteInventoryDialog';
import { BillingCyclesTable } from '@/components/inventory/BillingCyclesTable';
import { OutgoingTable } from '@/components/inventory/OutgoingTable';
import { calculateBillingCycles, calculateTotalStorageCost } from '@/lib/billing-cycles';
import { printItemDetail } from '@/utils/pdfExport';

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading } = useInventoryItem(id || '');
  const { data: outgoing } = useOutgoingForInventory(id || '');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground">Item not found</h2>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  const balancePercent = (Number(item.current_balance_qty) / Number(item.quantity_total)) * 100;
  
  // Calculate billing cycles
  const billingCycles = calculateBillingCycles(
    item.cold_storage_date,
    Number(item.quantity_total),
    Number(item.cold_rate),
    outgoing || []
  );
  const totalStorageCost = calculateTotalStorageCost(billingCycles);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{item.item_name}</h1>
            <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>
              {item.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {item.party_name} • Lot: {item.lot_number || 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => printItemDetail(item, outgoing || [], billingCycles, totalStorageCost)}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <EditInventoryDialog item={item} />
          <DeleteInventoryDialog inventoryId={item.id} itemName={item.item_name} />
          {item.status === 'Active' && (
            <AddOutgoingDialog
              inventoryId={item.id}
              currentBalance={Number(item.current_balance_qty)}
              totalWeight={Number(item.weight_total)}
              totalQty={Number(item.quantity_total)}
              coldStorageDate={item.cold_storage_date}
            />
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Purchase Date</span>
          </div>
          <p className="font-semibold text-foreground">
            {format(new Date(item.purchase_date), 'dd MMM yyyy')}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Warehouse className="w-4 h-4" />
            <span className="text-sm">Cold Storage</span>
          </div>
          <p className="font-semibold text-foreground">
            {item.cold_storages?.cold_storage_name || 'Not assigned'}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Hash className="w-4 h-4" />
            <span className="text-sm">Brand</span>
          </div>
          <p className="font-semibold text-foreground">{item.brand || 'N/A'}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Package className="w-4 h-4" />
            <span className="text-sm">Quantity</span>
          </div>
          <p className="font-semibold text-foreground">
            {item.current_balance_qty} / {item.quantity_total} units
          </p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${balancePercent}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Scale className="w-4 h-4" />
            <span className="text-sm">Weight</span>
          </div>
          <p className="font-semibold text-foreground">{item.weight_total} kg total</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <IndianRupee className="w-4 h-4" />
            <span className="text-sm">Rates</span>
          </div>
          <p className="font-semibold text-foreground">
            Purchase: ₹{item.purchase_rate} • Cold: ₹{item.cold_rate}/day
          </p>
        </div>
      </div>

      {/* Outgoing Timeline */}
      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Outgoing Timeline</h3>
        <OutgoingTable outgoing={outgoing || []} inventoryId={item.id} coldStorageDate={item.cold_storage_date} currentBalance={Number(item.current_balance_qty)} />
      </div>

      {/* Cold Storage Billing Cycles */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4">
          <Receipt className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Cold Storage Billing Cycles</h3>
          {item.status === 'Completed' && (
            <Badge variant="secondary">Completed</Badge>
          )}
        </div>
        <BillingCyclesTable 
          cycles={billingCycles} 
          itemName={item.item_name}
          totalCost={totalStorageCost}
        />
      </div>

    </div>
  );
}
