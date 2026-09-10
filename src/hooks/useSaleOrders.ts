import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewSaleOrder, UpdateSaleOrder } from '@/lib/types';

const db = window.electronAPI;

export function useSaleOrders() {
  return useQuery({
    queryKey: ['sale-orders'],
    queryFn: () => db.getSaleOrders(),
  });
}

export function useSaleOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['sale-orders', id],
    queryFn: () => (id ? db.getSaleOrder(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useAddSaleOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewSaleOrder) => db.addSaleOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sale-orders'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useUpdateSaleOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSaleOrder }) => db.updateSaleOrder(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sale-orders'] });
      qc.invalidateQueries({ queryKey: ['sale-orders', vars.id] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useDeleteSaleOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteSaleOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sale-orders'] });
    },
  });
}
