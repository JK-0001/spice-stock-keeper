import { format } from 'date-fns';
import { Warehouse } from 'lucide-react';
import { useColdStorages } from '@/hooks/useInventory';
import { AddColdStorageDialog } from '@/components/cold-storage/AddColdStorageDialog';

export default function ColdStorages() {
  const { data: coldStorages, isLoading } = useColdStorages();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cold Storages</h1>
          <p className="text-muted-foreground mt-1">Manage your storage facilities</p>
        </div>
        <AddColdStorageDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-6 bg-muted rounded w-32 mb-2" />
              <div className="h-4 bg-muted rounded w-48" />
            </div>
          ))}
        </div>
      ) : coldStorages && coldStorages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coldStorages.map((cs) => (
            <div key={cs.id} className="stat-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Warehouse className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {cs.cold_storage_name}
                  </h3>
                  {cs.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {cs.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Added {format(new Date(cs.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          <Warehouse className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No cold storages added yet.</p>
          <p className="text-sm mt-1">Add your first cold storage to get started.</p>
        </div>
      )}
    </div>
  );
}
