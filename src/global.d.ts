import type {
  ColdStorage,
  Inventory,
  Outgoing,
  InventoryWithStorage,
  NewColdStorage,
  NewInventory,
  NewOutgoing,
  UpdateInventory,
  UpdateOutgoing,
  InventoryFilters,
  DashboardStats,
  SaleOrderWithItems,
  NewSaleOrder,
  UpdateSaleOrder,
  BuiltyWithItems,
  NewBuilty,
  UpdateBuilty,
} from './lib/types';

declare global {
  interface Window {
    electronAPI: {
      printPDF(dataUrl: string): Promise<{ success: boolean; message: string }>;
      getColdStorages: () => Promise<ColdStorage[]>;
      addColdStorage: (data: NewColdStorage) => Promise<ColdStorage>;
      getInventoryList: (filters?: InventoryFilters) => Promise<InventoryWithStorage[]>;
      getInventoryItem: (id: string) => Promise<InventoryWithStorage | null>;
      addInventory: (data: NewInventory) => Promise<InventoryWithStorage>;
      updateInventory: (id: string, data: UpdateInventory) => Promise<InventoryWithStorage>;
      deleteInventory: (id: string) => Promise<void>;
      getOutgoingForInventory: (inventoryId: string) => Promise<Outgoing[]>;
      addOutgoing: (data: NewOutgoing) => Promise<Outgoing>;
      updateOutgoing: (id: string, data: UpdateOutgoing) => Promise<Outgoing>;
      deleteOutgoing: (id: string) => Promise<void>;
      getDashboardStats: () => Promise<DashboardStats>;
      createBackup: () => Promise<{ success: boolean; message: string; filePath?: string }>;
      createManualBackup: () => Promise<{ success: boolean; message: string }>;
      getSaleOrders: () => Promise<SaleOrderWithItems[]>;
      getSaleOrder: (id: string) => Promise<SaleOrderWithItems | null>;
      addSaleOrder: (data: NewSaleOrder) => Promise<SaleOrderWithItems>;
      updateSaleOrder: (id: string, data: UpdateSaleOrder) => Promise<SaleOrderWithItems>;
      deleteSaleOrder: (id: string) => Promise<void>;
      getBuiltyList: () => Promise<BuiltyWithItems[]>;
      getBuilty: (id: string) => Promise<BuiltyWithItems | null>;
      addBuilty: (data: NewBuilty) => Promise<BuiltyWithItems>;
      updateBuilty: (id: string, data: UpdateBuilty) => Promise<BuiltyWithItems>;
      deleteBuilty: (id: string) => Promise<void>;
      getPartySuggestions: () => Promise<string[]>;
      getItemNameSuggestions: () => Promise<string[]>;
      getMarkaSuggestions: () => Promise<string[]>;
    };
  }
}

export {};
