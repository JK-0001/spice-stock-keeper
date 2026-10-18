import type { ColdStorage, Outgoing, InventoryWithStorage, NewColdStorage, NewInventory, NewOutgoing, UpdateInventory, UpdateOutgoing, InventoryFilters, DashboardStats, SaleOrderWithItems, NewSaleOrder, UpdateSaleOrder, BuiltyWithItems, NewBuilty, UpdateBuilty, ItemMaster, NewItemMaster, UpdateItemMaster, PartyMaster, NewPartyMaster, UpdatePartyMaster } from './types';
type PrintOptions = {
    copies?: number;
    autoPrint?: boolean;
};
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
            createBackup: () => Promise<{
                success: boolean;
                message: string;
                filePath?: string;
            }>;
            createManualBackup: () => Promise<{
                success: boolean;
                message: string;
            }>;
            importDatabase: () => Promise<{
                success: boolean;
                message: string;
                cancelled?: boolean;
                needsRestart?: boolean;
            }>;
            printPDF: (dataUrl: string, options?: PrintOptions) => Promise<{
                success: boolean;
                message: string;
            }>;
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
            importItemsMaster: (names: string[]) => Promise<{
                inserted: number;
                skipped: number;
            }>;
            importPartiesMaster: (names: string[]) => Promise<{
                inserted: number;
                skipped: number;
            }>;
            getItemsMaster: () => Promise<ItemMaster[]>;
            getItemByName: (name: string) => Promise<ItemMaster | null>;
            addItemMaster: (data: NewItemMaster) => Promise<ItemMaster>;
            updateItemMaster: (id: string, data: UpdateItemMaster) => Promise<ItemMaster>;
            deleteItemMaster: (id: string) => Promise<void>;
            getPartiesMaster: () => Promise<PartyMaster[]>;
            addPartyMaster: (data: NewPartyMaster) => Promise<PartyMaster>;
            updatePartyMaster: (id: string, data: UpdatePartyMaster) => Promise<PartyMaster>;
            deletePartyMaster: (id: string) => Promise<void>;
        };
    }
}
export {};
