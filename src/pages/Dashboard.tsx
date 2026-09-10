import { Package, Scale, AlertTriangle, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDashboardStats } from '@/hooks/useInventory';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your spice inventory</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-8 bg-muted rounded w-20 mb-2" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Items"
            value={stats?.totalActiveItems || 0}
            icon={Package}
            variant="primary"
          />
          <StatCard
            label="Total Balance (Units)"
            value={stats?.totalBalanceQty?.toLocaleString() || 0}
            icon={Package}
          />
          <StatCard
            label="Total Balance (kg)"
            value={stats?.totalBalanceWeight?.toFixed(1) || 0}
            icon={Scale}
          />
          <StatCard
            label="Low Balance Items"
            value={stats?.lowBalanceItems || 0}
            icon={AlertTriangle}
            variant={stats?.lowBalanceItems ? 'warning' : 'default'}
          />
        </div>
      )}

      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Cold Storage Billing Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <IndianRupee className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">
                ₹{stats?.activeColdStorageCost?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Active items
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <IndianRupee className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold">
                ₹{stats?.completedColdStorageCost?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Completed items
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-accent">
              <IndianRupee className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                ₹{stats?.totalColdStorageCost?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Total payable
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Add new inventory from the <strong>Inventory</strong> page</p>
          <p>• Manage cold storages from the <strong>Cold Storages</strong> page</p>
          <p>• Click any inventory item to view details & billing cycles</p>
        </div>
      </div>
    </div>
  );
}
