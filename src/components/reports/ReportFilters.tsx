import { useColdStorages } from '@/hooks/useInventory';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ReportFiltersProps {
  filters: {
    coldStorageId?: string;
    itemName?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onFiltersChange: (filters: ReportFiltersProps['filters']) => void;
}

export function ReportFilters({ filters, onFiltersChange }: ReportFiltersProps) {
  const { data: coldStorages } = useColdStorages();

  const hasFilters = Object.values(filters).some(v => v && v !== '');

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cold-storage">Cold Storage</Label>
          <Select
            value={filters.coldStorageId || 'all'}
            onValueChange={v => onFiltersChange({ ...filters, coldStorageId: v === 'all' ? undefined : v })}
          >
            <SelectTrigger id="cold-storage">
              <SelectValue placeholder="All storages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All storages</SelectItem>
              {coldStorages?.map(cs => (
                <SelectItem key={cs.id} value={cs.id}>
                  {cs.cold_storage_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-name">Item Name</Label>
          <Input
            id="item-name"
            placeholder="Search items..."
            value={filters.itemName || ''}
            onChange={e => onFiltersChange({ ...filters, itemName: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={v => onFiltersChange({ ...filters, status: v === 'all' ? undefined : v })}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-from">From Date</Label>
          <Input
            id="date-from"
            type="date"
            value={filters.dateFrom || ''}
            onChange={e => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to">To Date</Label>
          <Input
            id="date-to"
            type="date"
            value={filters.dateTo || ''}
            onChange={e => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
          />
        </div>
      </div>
    </div>
  );
}
