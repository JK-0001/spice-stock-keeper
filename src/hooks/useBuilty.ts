import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewBuilty, UpdateBuilty } from '@/lib/types';

const db = window.electronAPI;

export function useBuiltyList() {
  return useQuery({
    queryKey: ['builty'],
    queryFn: () => db.getBuiltyList(),
  });
}

export function useBuilty(id: string | undefined) {
  return useQuery({
    queryKey: ['builty', id],
    queryFn: () => (id ? db.getBuilty(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useAddBuilty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewBuilty) => db.addBuilty(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['builty'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useUpdateBuilty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBuilty }) => db.updateBuilty(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['builty'] });
      qc.invalidateQueries({ queryKey: ['builty', vars.id] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useDeleteBuilty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteBuilty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['builty'] });
    },
  });
}
