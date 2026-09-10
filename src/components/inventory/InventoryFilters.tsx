import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';
import { useColdStorages } from '@/hooks/useInventory';
import { exportInventoryToPDF, type InventoryItem } from '@/utils/pdfExport';

interface FiltersState {
  item: string;
  cold_storage_id: string;
  party: string;
  status: string;
}

interface InventoryFiltersProps {
  filters: FiltersState;
  onFilterChange: (filters: FiltersState) => void;
  inventoryData?: InventoryItem[];
}

export function InventoryFilters({ filters, onFilterChange, inventoryData = [] }: InventoryFiltersProps) {
  const { data: coldStorages } = useColdStorages();

  const hasFilters = filters.item || filters.cold_storage_id || filters.party || filters.status;

  const clearFilters = () => {
    onFilterChange({ item: '', cold_storage_id: '', party: '', status: '' });
  };

  const handleExportPDF = () => {
    if (inventoryData.length === 0) {
      return;
    }
    exportInventoryToPDF(inventoryData);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Input
        placeholder="Filter by item..."
        value={filters.item}
        onChange={(e) => onFilterChange({ ...filters, item: e.target.value })}
        className="w-40"
      />
      <Input
        placeholder="Filter by party..."
        value={filters.party}
        onChange={(e) => onFilterChange({ ...filters, party: e.target.value })}
        className="w-40"
      />
      <Select
        value={filters.cold_storage_id}
        onValueChange={(value) => onFilterChange({ ...filters, cold_storage_id: value === 'all' ? '' : value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Cold Storage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Storages</SelectItem>
          {coldStorages?.map((cs) => (
            <SelectItem key={cs.id} value={cs.id}>
              {cs.cold_storage_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange({ ...filters, status: value === 'all' ? '' : value })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="default"
        size="sm"
        onClick={handleExportPDF}
        disabled={inventoryData.length === 0}
      >
        <Printer className="w-4 h-4 mr-1" />
        Print
      </Button>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
