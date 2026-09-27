import { useQuery } from '@tanstack/react-query';

const db = window.electronAPI;

export function usePartySuggestions() {
  return useQuery({
    queryKey: ['suggestions', 'parties'],
    queryFn: () => db.getPartySuggestions(),
  });
}

export function useItemNameSuggestions() {
  return useQuery({
    queryKey: ['suggestions', 'item-names'],
    queryFn: () => db.getItemNameSuggestions(),
  });
}

export function useMarkaSuggestions() {
  return useQuery({
    queryKey: ['suggestions', 'marka'],
    queryFn: () => db.getMarkaSuggestions(),
  });
}
