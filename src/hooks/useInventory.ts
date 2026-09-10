import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewColdStorage, NewInventory, NewOutgoing, UpdateInventory, UpdateOutgoing, InventoryFilters } from '@/lib/types';
import { calculateBillingCycles, calculateTotalStorageCost } from '@/lib/billing-cycles';

// Electron API wrapper
const db = window.electronAPI;

export function useColdStorages() {
  return useQuery({
    queryKey: ['cold-storages'],
    queryFn: () => db.getColdStorages(),
  });
}

export function useInventoryList(filters?: InventoryFilters) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => db.getInventoryList(filters),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => db.getInventoryItem(id),
    enabled: !!id,
  });
}

export function useOutgoingForInventory(inventoryId: string) {
  return useQuery({
    queryKey: ['outgoing', inventoryId],
    queryFn: () => db.getOutgoingForInventory(inventoryId),
    enabled: !!inventoryId,
  });
}

export function useAddColdStorage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewColdStorage) => db.addColdStorage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cold-storages'] });
    },
  });
}

export function useAddInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewInventory) => db.addInventory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventory }) =>
      db.updateInventory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteInventory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useAddOutgoing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewOutgoing) => db.addOutgoing(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outgoing', variables.inventory_id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.inventory_id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateOutgoing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; inventoryId: string; data: UpdateOutgoing }) =>
      db.updateOutgoing(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outgoing', variables.inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteOutgoing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; inventoryId: string }) =>
      db.deleteOutgoing(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outgoing', variables.inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get basic stats from backend
      const stats = await db.getDashboardStats();

      // Get all inventory to calculate billing
      const inventory = await db.getInventoryList();

      // Get all outgoing records for billing calculations
      const outgoingPromises = inventory.map(item =>
        db.getOutgoingForInventory(item.id)
      );
      const allOutgoingArrays = await Promise.all(outgoingPromises);

      // Calculate billing cycles for all items
      let activeColdStorageCost = 0;
      let completedColdStorageCost = 0;

      inventory.forEach((item, index) => {
        const itemOutgoing = allOutgoingArrays[index] || [];
        const cycles = calculateBillingCycles(
          item.cold_storage_date,
          Number(item.quantity_total),
          Number(item.cold_rate),
          itemOutgoing
        );
        const cost = calculateTotalStorageCost(cycles);

        if (item.status === 'Active') {
          activeColdStorageCost += cost;
        } else {
          completedColdStorageCost += cost;
        }
      });

      return {
        totalActiveItems: stats.activeItemsCount,
        totalBalanceQty: stats.totalBalanceQty,
        totalBalanceWeight: stats.totalBalanceWeight,
        lowBalanceItems: stats.lowStockItems.length,
        activeColdStorageCost,
        completedColdStorageCost,
        totalColdStorageCost: activeColdStorageCost + completedColdStorageCost,
      };
    },
  });
}
