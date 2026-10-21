import { contextBridge, ipcRenderer } from 'electron';
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
  ItemMaster,
  NewItemMaster,
  UpdateItemMaster,
  PartyMaster,
  NewPartyMaster,
  UpdatePartyMaster,
} from './types';

type PrintOptions = { copies?: number; autoPrint?: boolean };

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloaded'
  | 'not-available'
  | 'error'
  | 'dev';
type UpdateState = { status: UpdateStatus; version: string | null; error: string | null };

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Cold Storage API
  getColdStorages: (): Promise<ColdStorage[]> => ipcRenderer.invoke('db:getColdStorages'),

  addColdStorage: (data: NewColdStorage): Promise<ColdStorage> =>
    ipcRenderer.invoke('db:addColdStorage', data),

  // Inventory API
  getInventoryList: (filters?: InventoryFilters): Promise<InventoryWithStorage[]> =>
    ipcRenderer.invoke('db:getInventoryList', filters),

  getInventoryItem: (id: string): Promise<InventoryWithStorage | null> =>
    ipcRenderer.invoke('db:getInventoryItem', id),

  addInventory: (data: NewInventory): Promise<InventoryWithStorage> =>
    ipcRenderer.invoke('db:addInventory', data),

  updateInventory: (id: string, data: UpdateInventory): Promise<InventoryWithStorage> =>
    ipcRenderer.invoke('db:updateInventory', id, data),

  deleteInventory: (id: string): Promise<void> => ipcRenderer.invoke('db:deleteInventory', id),

  // Outgoing API
  getOutgoingForInventory: (inventoryId: string): Promise<Outgoing[]> =>
    ipcRenderer.invoke('db:getOutgoingForInventory', inventoryId),

  addOutgoing: (data: NewOutgoing): Promise<Outgoing> => ipcRenderer.invoke('db:addOutgoing', data),

  updateOutgoing: (id: string, data: UpdateOutgoing): Promise<Outgoing> =>
    ipcRenderer.invoke('db:updateOutgoing', id, data),

  deleteOutgoing: (id: string): Promise<void> => ipcRenderer.invoke('db:deleteOutgoing', id),

  // Dashboard API
  getDashboardStats: (): Promise<DashboardStats> => ipcRenderer.invoke('db:getDashboardStats'),

  // Backup API
  createBackup: (): Promise<{ success: boolean; message: string; filePath?: string }> =>
    ipcRenderer.invoke('backup:create'),

  createManualBackup: (): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('backup:createManual'),

  importDatabase: (): Promise<{ success: boolean; message: string; cancelled?: boolean; needsRestart?: boolean }> =>
    ipcRenderer.invoke('backup:importDatabase'),

  // Print API
  printPDF: (
    dataUrl: string,
    options?: PrintOptions
  ): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('print:pdf', dataUrl, options),

  // Sale Order API
  getSaleOrders: (): Promise<SaleOrderWithItems[]> => ipcRenderer.invoke('db:getSaleOrders'),
  getSaleOrder: (id: string): Promise<SaleOrderWithItems | null> =>
    ipcRenderer.invoke('db:getSaleOrder', id),
  addSaleOrder: (data: NewSaleOrder): Promise<SaleOrderWithItems> =>
    ipcRenderer.invoke('db:addSaleOrder', data),
  updateSaleOrder: (id: string, data: UpdateSaleOrder): Promise<SaleOrderWithItems> =>
    ipcRenderer.invoke('db:updateSaleOrder', id, data),
  deleteSaleOrder: (id: string): Promise<void> => ipcRenderer.invoke('db:deleteSaleOrder', id),

  // Builty API
  getBuiltyList: (): Promise<BuiltyWithItems[]> => ipcRenderer.invoke('db:getBuiltyList'),
  getBuilty: (id: string): Promise<BuiltyWithItems | null> =>
    ipcRenderer.invoke('db:getBuilty', id),
  addBuilty: (data: NewBuilty): Promise<BuiltyWithItems> =>
    ipcRenderer.invoke('db:addBuilty', data),
  updateBuilty: (id: string, data: UpdateBuilty): Promise<BuiltyWithItems> =>
    ipcRenderer.invoke('db:updateBuilty', id, data),
  deleteBuilty: (id: string): Promise<void> => ipcRenderer.invoke('db:deleteBuilty', id),

  // Autocomplete suggestions
  getPartySuggestions: (): Promise<string[]> => ipcRenderer.invoke('db:getPartySuggestions'),
  getItemNameSuggestions: (): Promise<string[]> => ipcRenderer.invoke('db:getItemNameSuggestions'),
  getMarkaSuggestions: (): Promise<string[]> => ipcRenderer.invoke('db:getMarkaSuggestions'),

  // Excel master-list import
  importItemsMaster: (names: string[]): Promise<{ inserted: number; skipped: number }> =>
    ipcRenderer.invoke('db:importItemsMaster', names),
  importPartiesMaster: (names: string[]): Promise<{ inserted: number; skipped: number }> =>
    ipcRenderer.invoke('db:importPartiesMaster', names),

  // Items Master CRUD
  getItemsMaster: (): Promise<ItemMaster[]> => ipcRenderer.invoke('db:getItemsMaster'),
  getItemByName: (name: string): Promise<ItemMaster | null> =>
    ipcRenderer.invoke('db:getItemByName', name),
  addItemMaster: (data: NewItemMaster): Promise<ItemMaster> =>
    ipcRenderer.invoke('db:addItemMaster', data),
  updateItemMaster: (id: string, data: UpdateItemMaster): Promise<ItemMaster> =>
    ipcRenderer.invoke('db:updateItemMaster', id, data),
  deleteItemMaster: (id: string): Promise<void> => ipcRenderer.invoke('db:deleteItemMaster', id),

  // Parties Master CRUD
  getPartiesMaster: (): Promise<PartyMaster[]> => ipcRenderer.invoke('db:getPartiesMaster'),
  addPartyMaster: (data: NewPartyMaster): Promise<PartyMaster> =>
    ipcRenderer.invoke('db:addPartyMaster', data),
  updatePartyMaster: (id: string, data: UpdatePartyMaster): Promise<PartyMaster> =>
    ipcRenderer.invoke('db:updatePartyMaster', id, data),
  deletePartyMaster: (id: string): Promise<void> => ipcRenderer.invoke('db:deletePartyMaster', id),

  // App info + updates
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  getUpdateState: (): Promise<UpdateState> => ipcRenderer.invoke('update:getState'),
  checkForUpdates: (): Promise<UpdateState> => ipcRenderer.invoke('update:check'),
  restartAndInstall: (): Promise<{ ok: boolean; message: string }> =>
    ipcRenderer.invoke('update:restartAndInstall'),
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
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
      importDatabase: () => Promise<{ success: boolean; message: string; cancelled?: boolean; needsRestart?: boolean }>;
      printPDF: (
        dataUrl: string,
        options?: PrintOptions
      ) => Promise<{ success: boolean; message: string }>;
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
      importItemsMaster: (names: string[]) => Promise<{ inserted: number; skipped: number }>;
      importPartiesMaster: (names: string[]) => Promise<{ inserted: number; skipped: number }>;
      getItemsMaster: () => Promise<ItemMaster[]>;
      getItemByName: (name: string) => Promise<ItemMaster | null>;
      addItemMaster: (data: NewItemMaster) => Promise<ItemMaster>;
      updateItemMaster: (id: string, data: UpdateItemMaster) => Promise<ItemMaster>;
      deleteItemMaster: (id: string) => Promise<void>;
      getPartiesMaster: () => Promise<PartyMaster[]>;
      addPartyMaster: (data: NewPartyMaster) => Promise<PartyMaster>;
      updatePartyMaster: (id: string, data: UpdatePartyMaster) => Promise<PartyMaster>;
      deletePartyMaster: (id: string) => Promise<void>;
      getAppVersion: () => Promise<string>;
      getUpdateState: () => Promise<UpdateState>;
      checkForUpdates: () => Promise<UpdateState>;
      restartAndInstall: () => Promise<{ ok: boolean; message: string }>;
    };
  }
}
