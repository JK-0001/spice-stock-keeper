// Custom types for our inventory app
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
  cold_storages?: ColdStorage | null;
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

export interface InventoryWithStorage extends Inventory {
  cold_storages: ColdStorage | null;
}
