export interface ColdStorage {
  id: string;
  cold_storage_name: string;
  notes: string | null;
  created_at: string;
}

export interface Inventory {
  id: string;
  item_name: string;
  party_name: string;
  purchase_date: string;
  cold_storage_date: string;
  brand: string | null;
  purchase_rate: number;
  cold_storage_id: string | null;
  lot_number: string | null;
  quantity_total: number;
  weight_total: number;
  cold_rate: number;
  current_balance_qty: number;
  status: 'Active' | 'Completed';
  completed_at: string | null;
  cold_storage_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryWithStorage extends Inventory {
  cold_storages: ColdStorage | null;
}

export interface Outgoing {
  id: string;
  inventory_id: string;
  outgoing_date: string;
  quantity_out: number;
  weight_out: number;
  remarks: string | null;
  created_at: string;
}

export interface InventoryFilters {
  item_name?: string;
  cold_storage_id?: string;
  party_name?: string;
  status?: 'Active' | 'Completed';
}

export interface DashboardStats {
  activeItemsCount: number;
  totalBalanceQty: number;
  totalBalanceWeight: number;
  lowStockItems: Inventory[];
}

export type NewColdStorage = Omit<ColdStorage, 'id' | 'created_at'>;
export type NewInventory = Omit<Inventory, 'id' | 'created_at' | 'updated_at' | 'current_balance_qty' | 'status' | 'completed_at' | 'cold_storage_cost'>;
export type NewOutgoing = Omit<Outgoing, 'id' | 'created_at'>;
export type UpdateInventory = Partial<Omit<Inventory, 'id' | 'created_at'>>;
export type UpdateOutgoing = Partial<Omit<Outgoing, 'id' | 'inventory_id' | 'created_at'>>;

// Sale Orders
export interface SaleOrder {
  id: string;
  serial_no: string;
  order_date: string;
  party_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleOrderItem {
  id: string;
  sale_order_id: string;
  item_name: string;
  marka: string | null;
  quantity: number;
  unit: string | null;
  rate: number;
  discount_percent: number | null;
  sort_order: number;
  created_at: string;
}

export interface SaleOrderWithItems extends SaleOrder {
  items: SaleOrderItem[];
}

export type NewSaleOrderItem = Omit<SaleOrderItem, 'id' | 'sale_order_id' | 'created_at'>;
export interface NewSaleOrder {
  order_date: string;
  party_name: string;
  notes: string | null;
  items: NewSaleOrderItem[];
}
export interface UpdateSaleOrder {
  order_date?: string;
  party_name?: string;
  notes?: string | null;
  items?: NewSaleOrderItem[];
}

// Builty / Dispatch
export interface Builty {
  id: string;
  serial_no: string;
  builty_date: string;
  party_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuiltyItem {
  id: string;
  builty_id: string;
  item_name: string;
  marka: string | null;
  quantity: number;
  unit: string | null;
  sort_order: number;
  created_at: string;
}

// Master data (editable records that also feed autocomplete dropdowns)
export interface ItemMaster {
  id: string;
  name: string;
  unit: string | null;
  brand: string | null;
  hsn_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export type NewItemMaster = Omit<ItemMaster, 'id' | 'created_at' | 'updated_at'>;
export type UpdateItemMaster = Partial<NewItemMaster>;

export interface PartyMaster {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  gstin: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export type NewPartyMaster = Omit<PartyMaster, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePartyMaster = Partial<NewPartyMaster>;

export interface BuiltyWithItems extends Builty {
  items: BuiltyItem[];
}

export type NewBuiltyItem = Omit<BuiltyItem, 'id' | 'builty_id' | 'created_at'>;
export interface NewBuilty {
  builty_date: string;
  party_name: string;
  notes: string | null;
  items: NewBuiltyItem[];
}
export interface UpdateBuilty {
  builty_date?: string;
  party_name?: string;
  notes?: string | null;
  items?: NewBuiltyItem[];
}
