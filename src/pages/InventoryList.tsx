import { useMemo, useState } from 'react';
import { InventoryTable, type SortColumn, type SortDirection } from '@/components/inventory/InventoryTable';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { AddInventoryDialog } from '@/components/inventory/AddInventoryDialog';
import { useInventoryList } from '@/hooks/useInventory';
import type { InventoryWithStorage } from '@/lib/supabase-types';

export default function InventoryList() {
  const [filters, setFilters] = useState({
    item: '',
    cold_storage_id: '',
    party: '',
    status: '',
  });

  const [sortColumn, setSortColumn] = useState<SortColumn>('item_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSortChange = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const { data: inventory, isLoading } = useInventoryList(
    Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    )
  );

  const sortedInventory = useMemo(() => {
    if (!inventory) return [];
    const getValue = (item: InventoryWithStorage): string | number => {
      switch (sortColumn) {
        case 'item_name':
          return item.item_name ?? '';
        case 'party_name':
          return item.party_name ?? '';
        case 'cold_storage':
          return item.cold_storages?.cold_storage_name ?? '';
        case 'purchase_date':
          return new Date(item.purchase_date).getTime() || 0;
      }
    };
    return [...inventory].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [inventory, sortColumn, sortDirection]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your spice inventory</p>
        </div>
        <AddInventoryDialog />
      </div>

      <InventoryFilters filters={filters} onFilterChange={setFilters} inventoryData={sortedInventory} />

      <InventoryTable
        data={sortedInventory}
        isLoading={isLoading}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
