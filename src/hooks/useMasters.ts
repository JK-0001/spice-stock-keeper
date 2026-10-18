import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ItemMaster,
  NewItemMaster,
  UpdateItemMaster,
  PartyMaster,
  NewPartyMaster,
  UpdatePartyMaster,
} from '@/lib/types';

const api = window.electronAPI;

// Items -----------------------------------------------------------------
export function useItemsMaster() {
  return useQuery<ItemMaster[]>({
    queryKey: ['items-master'],
    queryFn: () => api.getItemsMaster(),
  });
}

export function useAddItemMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewItemMaster) => api.addItemMaster(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items-master'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useUpdateItemMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemMaster }) =>
      api.updateItemMaster(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items-master'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useDeleteItemMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteItemMaster(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items-master'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

// Parties ----------------------------------------------------------------
export function usePartiesMaster() {
  return useQuery<PartyMaster[]>({
    queryKey: ['parties-master'],
    queryFn: () => api.getPartiesMaster(),
  });
}

export function useAddPartyMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewPartyMaster) => api.addPartyMaster(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parties-master'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useUpdatePartyMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartyMaster }) =>
      api.updatePartyMaster(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parties-master'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useDeletePartyMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePartyMaster(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parties-master'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}
