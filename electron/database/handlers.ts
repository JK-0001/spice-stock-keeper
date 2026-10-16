import { getDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';
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
  SaleOrder,
  SaleOrderItem,
  SaleOrderWithItems,
  NewSaleOrder,
  UpdateSaleOrder,
  Builty,
  BuiltyItem,
  BuiltyWithItems,
  NewBuilty,
  UpdateBuilty,
} from '../types';

// Cold Storage Operations
export function getColdStorages(): ColdStorage[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM cold_storages
    ORDER BY cold_storage_name ASC
  `);
  return stmt.all() as ColdStorage[];
}

export function addColdStorage(data: NewColdStorage): ColdStorage {
  const db = getDatabase();
  const id = uuidv4();
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO cold_storages (id, cold_storage_name, notes, created_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, data.cold_storage_name, data.notes || null, created_at);

  return {
    id,
    cold_storage_name: data.cold_storage_name,
    notes: data.notes || null,
    created_at,
  };
}

// Inventory Operations
export function getInventoryList(filters?: InventoryFilters): InventoryWithStorage[] {
  const db = getDatabase();

  let query = `
    SELECT
      i.*,
      c.id as cold_storage_id,
      c.cold_storage_name,
      c.notes as cold_storage_notes,
      c.created_at as cold_storage_created_at
    FROM inventory i
    LEFT JOIN cold_storages c ON i.cold_storage_id = c.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filters?.item_name) {
    query += ` AND i.item_name LIKE ?`;
    params.push(`%${filters.item_name}%`);
  }

  if (filters?.cold_storage_id) {
    query += ` AND i.cold_storage_id = ?`;
    params.push(filters.cold_storage_id);
  }

  if (filters?.party_name) {
    query += ` AND i.party_name LIKE ?`;
    params.push(`%${filters.party_name}%`);
  }

  if (filters?.status) {
    query += ` AND i.status = ?`;
    params.push(filters.status);
  }

  query += ` ORDER BY i.created_at DESC`;

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map((row) => ({
    id: row.id,
    item_name: row.item_name,
    party_name: row.party_name,
    purchase_date: row.purchase_date,
    cold_storage_date: row.cold_storage_date,
    brand: row.brand,
    purchase_rate: row.purchase_rate,
    cold_storage_id: row.cold_storage_id,
    lot_number: row.lot_number,
    quantity_total: row.quantity_total,
    weight_total: row.weight_total,
    cold_rate: row.cold_rate,
    current_balance_qty: row.current_balance_qty,
    status: row.status,
    completed_at: row.completed_at,
    cold_storage_cost: row.cold_storage_cost,
    created_at: row.created_at,
    updated_at: row.updated_at,
    cold_storages: row.cold_storage_id
      ? {
          id: row.cold_storage_id,
          cold_storage_name: row.cold_storage_name,
          notes: row.cold_storage_notes,
          created_at: row.cold_storage_created_at,
        }
      : null,
  }));
}

export function getInventoryItem(id: string): InventoryWithStorage | null {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT
      i.*,
      c.id as cold_storage_id,
      c.cold_storage_name,
      c.notes as cold_storage_notes,
      c.created_at as cold_storage_created_at
    FROM inventory i
    LEFT JOIN cold_storages c ON i.cold_storage_id = c.id
    WHERE i.id = ?
  `);

  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    item_name: row.item_name,
    party_name: row.party_name,
    purchase_date: row.purchase_date,
    cold_storage_date: row.cold_storage_date,
    brand: row.brand,
    purchase_rate: row.purchase_rate,
    cold_storage_id: row.cold_storage_id,
    lot_number: row.lot_number,
    quantity_total: row.quantity_total,
    weight_total: row.weight_total,
    cold_rate: row.cold_rate,
    current_balance_qty: row.current_balance_qty,
    status: row.status,
    completed_at: row.completed_at,
    cold_storage_cost: row.cold_storage_cost,
    created_at: row.created_at,
    updated_at: row.updated_at,
    cold_storages: row.cold_storage_id
      ? {
          id: row.cold_storage_id,
          cold_storage_name: row.cold_storage_name,
          notes: row.cold_storage_notes,
          created_at: row.cold_storage_created_at,
        }
      : null,
  };
}

export function addInventory(data: NewInventory): InventoryWithStorage {
  const db = getDatabase();
  const id = uuidv4();
  const created_at = new Date().toISOString();
  const updated_at = created_at;

  const stmt = db.prepare(`
    INSERT INTO inventory (
      id, item_name, party_name, purchase_date, cold_storage_date, brand, purchase_rate,
      cold_storage_id, lot_number, quantity_total, weight_total, cold_rate,
      current_balance_qty, status, completed_at, cold_storage_cost,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.item_name,
    data.party_name,
    data.purchase_date,
    data.cold_storage_date,
    data.brand || null,
    data.purchase_rate,
    data.cold_storage_id || null,
    data.lot_number || null,
    data.quantity_total,
    data.weight_total,
    data.cold_rate,
    data.quantity_total, // initial balance equals total
    'Active',
    null,
    null,
    created_at,
    updated_at
  );

  return getInventoryItem(id)!;
}

export function updateInventory(id: string, data: UpdateInventory): InventoryWithStorage {
  const db = getDatabase();
  const updated_at = new Date().toISOString();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.item_name !== undefined) {
    fields.push('item_name = ?');
    values.push(data.item_name);
  }
  if (data.party_name !== undefined) {
    fields.push('party_name = ?');
    values.push(data.party_name);
  }
  if (data.purchase_date !== undefined) {
    fields.push('purchase_date = ?');
    values.push(data.purchase_date);
  }
  if (data.cold_storage_date !== undefined) {
    fields.push('cold_storage_date = ?');
    values.push(data.cold_storage_date);
  }
  if (data.brand !== undefined) {
    fields.push('brand = ?');
    values.push(data.brand);
  }
  if (data.purchase_rate !== undefined) {
    fields.push('purchase_rate = ?');
    values.push(data.purchase_rate);
  }
  if (data.cold_storage_id !== undefined) {
    fields.push('cold_storage_id = ?');
    values.push(data.cold_storage_id);
  }
  if (data.lot_number !== undefined) {
    fields.push('lot_number = ?');
    values.push(data.lot_number);
  }
  if (data.quantity_total !== undefined) {
    fields.push('quantity_total = ?');
    values.push(data.quantity_total);
  }
  if (data.weight_total !== undefined) {
    fields.push('weight_total = ?');
    values.push(data.weight_total);
  }
  if (data.cold_rate !== undefined) {
    fields.push('cold_rate = ?');
    values.push(data.cold_rate);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.completed_at !== undefined) {
    fields.push('completed_at = ?');
    values.push(data.completed_at);
  }

  fields.push('updated_at = ?');
  values.push(updated_at);
  values.push(id);

  const stmt = db.prepare(`
    UPDATE inventory
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);

  return getInventoryItem(id)!;
}

export function deleteInventory(id: string): void {
  const db = getDatabase();

  // CASCADE delete will handle outgoing records automatically
  const stmt = db.prepare('DELETE FROM inventory WHERE id = ?');
  stmt.run(id);
}

// Outgoing Operations
export function getOutgoingForInventory(inventoryId: string): Outgoing[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM outgoing
    WHERE inventory_id = ?
    ORDER BY outgoing_date ASC, created_at ASC
  `);

  return stmt.all(inventoryId) as Outgoing[];
}

export function addOutgoing(data: NewOutgoing): Outgoing {
  const db = getDatabase();
  const id = uuidv4();
  const created_at = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO outgoing (id, inventory_id, outgoing_date, quantity_out, weight_out, remarks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.inventory_id,
    data.outgoing_date,
    data.quantity_out,
    data.weight_out,
    data.remarks || null,
    created_at
  );

  return {
    id,
    inventory_id: data.inventory_id,
    outgoing_date: data.outgoing_date,
    quantity_out: data.quantity_out,
    weight_out: data.weight_out,
    remarks: data.remarks || null,
    created_at,
  };
}

export function updateOutgoing(id: string, data: UpdateOutgoing): Outgoing {
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.outgoing_date !== undefined) {
    fields.push('outgoing_date = ?');
    values.push(data.outgoing_date);
  }
  if (data.quantity_out !== undefined) {
    fields.push('quantity_out = ?');
    values.push(data.quantity_out);
  }
  if (data.weight_out !== undefined) {
    fields.push('weight_out = ?');
    values.push(data.weight_out);
  }
  if (data.remarks !== undefined) {
    fields.push('remarks = ?');
    values.push(data.remarks);
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE outgoing
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);

  const getStmt = db.prepare('SELECT * FROM outgoing WHERE id = ?');
  return getStmt.get(id) as Outgoing;
}

export function deleteOutgoing(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM outgoing WHERE id = ?');
  stmt.run(id);
}

// ─── Shared autocomplete suggestions ──────────────────────────────
// Party name pool = union of parties from inventory + sale_orders + builty + parties_master
export function getPartySuggestions(): string[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT DISTINCT party_name FROM (
         SELECT party_name FROM inventory WHERE party_name IS NOT NULL AND party_name != ''
         UNION SELECT party_name FROM sale_orders WHERE party_name IS NOT NULL AND party_name != ''
         UNION SELECT party_name FROM builty WHERE party_name IS NOT NULL AND party_name != ''
         UNION SELECT name AS party_name FROM parties_master WHERE name IS NOT NULL AND name != ''
       ) ORDER BY party_name ASC`
    )
    .all() as Array<{ party_name: string }>;
  return rows.map((r) => r.party_name);
}

// Marka (brand) pool = union of distinct marka values from sale_order_items + builty_items
export function getMarkaSuggestions(): string[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT DISTINCT marka FROM (
         SELECT marka FROM sale_order_items WHERE marka IS NOT NULL AND marka != ''
         UNION SELECT marka FROM builty_items WHERE marka IS NOT NULL AND marka != ''
       ) ORDER BY marka ASC`
    )
    .all() as Array<{ marka: string }>;
  return rows.map((r) => r.marka);
}

// Item name pool = union of item names from inventory + sale_order_items + builty_items + items_master
export function getItemNameSuggestions(): string[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT DISTINCT item_name FROM (
         SELECT item_name FROM inventory WHERE item_name IS NOT NULL AND item_name != ''
         UNION SELECT item_name FROM sale_order_items WHERE item_name IS NOT NULL AND item_name != ''
         UNION SELECT item_name FROM builty_items WHERE item_name IS NOT NULL AND item_name != ''
         UNION SELECT name AS item_name FROM items_master WHERE name IS NOT NULL AND name != ''
       ) ORDER BY item_name ASC`
    )
    .all() as Array<{ item_name: string }>;
  return rows.map((r) => r.item_name);
}

// ─── Master-list bulk import (from Excel) ─────────────────────────
// Each returns { inserted, skipped } where skipped are names already present
// (case-insensitive) or empty strings. Uses INSERT OR IGNORE against the
// UNIQUE COLLATE NOCASE constraint, so re-importing the same list is safe.
export function importItemsMaster(names: string[]): { inserted: number; skipped: number } {
  const db = getDatabase();
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO items_master (id, name, created_at) VALUES (?, ?, ?)`
  );
  let inserted = 0;
  let skipped = 0;
  const now = new Date().toISOString();
  const tx = db.transaction((rows: string[]) => {
    for (const raw of rows) {
      const name = (raw ?? '').toString().trim();
      if (!name) {
        skipped++;
        continue;
      }
      const res = stmt.run(uuidv4(), name, now);
      if (res.changes > 0) inserted++;
      else skipped++;
    }
  });
  tx(names);
  return { inserted, skipped };
}

export function importPartiesMaster(names: string[]): { inserted: number; skipped: number } {
  const db = getDatabase();
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO parties_master (id, name, created_at) VALUES (?, ?, ?)`
  );
  let inserted = 0;
  let skipped = 0;
  const now = new Date().toISOString();
  const tx = db.transaction((rows: string[]) => {
    for (const raw of rows) {
      const name = (raw ?? '').toString().trim();
      if (!name) {
        skipped++;
        continue;
      }
      const res = stmt.run(uuidv4(), name, now);
      if (res.changes > 0) inserted++;
      else skipped++;
    }
  });
  tx(names);
  return { inserted, skipped };
}

// ─── FY serial helper ─────────────────────────────────────────────
// Indian financial year: April 1 → March 31.
// A date on/after Apr 1 of year Y belongs to FY Y-(Y+1); before Apr 1 belongs to (Y-1)-Y.
function financialYearLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth(); // 0 = Jan
  const startYear = m >= 3 ? y : y - 1; // April = month index 3
  const endYY = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}-${endYY}`;
}

function nextSerial(prefix: string, dateStr: string, table: 'sale_orders' | 'builty'): string {
  const db = getDatabase();
  const fy = financialYearLabel(dateStr);
  const searchPrefix = `${prefix}-${fy}-`;
  const row = db
    .prepare(
      `SELECT serial_no FROM ${table} WHERE serial_no LIKE ? ORDER BY serial_no DESC LIMIT 1`
    )
    .get(`${searchPrefix}%`) as { serial_no: string } | undefined;
  let next = 1;
  if (row) {
    const tail = row.serial_no.slice(searchPrefix.length);
    const n = parseInt(tail, 10);
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${searchPrefix}${String(next).padStart(3, '0')}`;
}

// ─── Sale Orders ──────────────────────────────────────────────────
function loadSaleOrderItems(saleOrderId: string): SaleOrderItem[] {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT * FROM sale_order_items WHERE sale_order_id = ? ORDER BY sort_order ASC, created_at ASC`
    )
    .all(saleOrderId) as SaleOrderItem[];
}

export function getSaleOrders(): SaleOrderWithItems[] {
  const db = getDatabase();
  const orders = db
    .prepare(`SELECT * FROM sale_orders ORDER BY order_date DESC, serial_no DESC`)
    .all() as SaleOrder[];
  return orders.map((o) => ({ ...o, items: loadSaleOrderItems(o.id) }));
}

export function getSaleOrder(id: string): SaleOrderWithItems | null {
  const db = getDatabase();
  const order = db.prepare(`SELECT * FROM sale_orders WHERE id = ?`).get(id) as SaleOrder | undefined;
  if (!order) return null;
  return { ...order, items: loadSaleOrderItems(order.id) };
}

export function addSaleOrder(data: NewSaleOrder): SaleOrderWithItems {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  const serial = nextSerial('ORD', data.order_date, 'sale_orders');

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO sale_orders (id, serial_no, order_date, party_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, serial, data.order_date, data.party_name, data.notes ?? null, now, now);

    const insItem = db.prepare(
      `INSERT INTO sale_order_items (id, sale_order_id, item_name, marka, quantity, rate, discount_percent, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    data.items.forEach((item, idx) => {
      insItem.run(
        uuidv4(),
        id,
        item.item_name,
        item.marka ?? null,
        item.quantity,
        item.rate,
        item.discount_percent ?? null,
        item.sort_order ?? idx,
        now
      );
    });
  });
  tx();

  return getSaleOrder(id)!;
}

export function updateSaleOrder(id: string, data: UpdateSaleOrder): SaleOrderWithItems {
  const db = getDatabase();
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.order_date !== undefined) {
      fields.push('order_date = ?');
      values.push(data.order_date);
    }
    if (data.party_name !== undefined) {
      fields.push('party_name = ?');
      values.push(data.party_name);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }
    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);
      db.prepare(`UPDATE sale_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    if (data.items !== undefined) {
      db.prepare(`DELETE FROM sale_order_items WHERE sale_order_id = ?`).run(id);
      const insItem = db.prepare(
        `INSERT INTO sale_order_items (id, sale_order_id, item_name, marka, quantity, rate, discount_percent, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      data.items.forEach((item, idx) => {
        insItem.run(
          uuidv4(),
          id,
          item.item_name,
          item.marka ?? null,
          item.quantity,
          item.rate,
          item.discount_percent ?? null,
          item.sort_order ?? idx,
          now
        );
      });
    }
  });
  tx();

  return getSaleOrder(id)!;
}

export function deleteSaleOrder(id: string): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM sale_orders WHERE id = ?`).run(id);
}

// ─── Builty / Dispatch ────────────────────────────────────────────
function loadBuiltyItems(builtyId: string): BuiltyItem[] {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT * FROM builty_items WHERE builty_id = ? ORDER BY sort_order ASC, created_at ASC`
    )
    .all(builtyId) as BuiltyItem[];
}

export function getBuiltyList(): BuiltyWithItems[] {
  const db = getDatabase();
  const rows = db
    .prepare(`SELECT * FROM builty ORDER BY builty_date DESC, serial_no DESC`)
    .all() as Builty[];
  return rows.map((b) => ({ ...b, items: loadBuiltyItems(b.id) }));
}

export function getBuilty(id: string): BuiltyWithItems | null {
  const db = getDatabase();
  const row = db.prepare(`SELECT * FROM builty WHERE id = ?`).get(id) as Builty | undefined;
  if (!row) return null;
  return { ...row, items: loadBuiltyItems(row.id) };
}

export function addBuilty(data: NewBuilty): BuiltyWithItems {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  const serial = nextSerial('BLT', data.builty_date, 'builty');

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO builty (id, serial_no, builty_date, party_name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, serial, data.builty_date, data.party_name, data.notes ?? null, now, now);

    const insItem = db.prepare(
      `INSERT INTO builty_items (id, builty_id, item_name, marka, quantity, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    data.items.forEach((item, idx) => {
      insItem.run(uuidv4(), id, item.item_name, item.marka ?? null, item.quantity, item.sort_order ?? idx, now);
    });
  });
  tx();

  return getBuilty(id)!;
}

export function updateBuilty(id: string, data: UpdateBuilty): BuiltyWithItems {
  const db = getDatabase();
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.builty_date !== undefined) {
      fields.push('builty_date = ?');
      values.push(data.builty_date);
    }
    if (data.party_name !== undefined) {
      fields.push('party_name = ?');
      values.push(data.party_name);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }
    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);
      db.prepare(`UPDATE builty SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    if (data.items !== undefined) {
      db.prepare(`DELETE FROM builty_items WHERE builty_id = ?`).run(id);
      const insItem = db.prepare(
        `INSERT INTO builty_items (id, builty_id, item_name, marka, quantity, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      data.items.forEach((item, idx) => {
        insItem.run(uuidv4(), id, item.item_name, item.marka ?? null, item.quantity, item.sort_order ?? idx, now);
      });
    }
  });
  tx();

  return getBuilty(id)!;
}

export function deleteBuilty(id: string): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM builty WHERE id = ?`).run(id);
}

// Dashboard Statistics
export function getDashboardStats(): DashboardStats {
  const db = getDatabase();

  // Count active items
  const activeCountStmt = db.prepare(`
    SELECT COUNT(*) as count FROM inventory WHERE status = 'Active'
  `);
  const activeCount = (activeCountStmt.get() as any).count;

  // Total balance
  const balanceStmt = db.prepare(`
    SELECT
      COALESCE(SUM(current_balance_qty), 0) as total_qty,
      COALESCE(SUM(weight_total * (current_balance_qty / quantity_total)), 0) as total_weight
    FROM inventory
    WHERE status = 'Active'
  `);
  const balance = balanceStmt.get() as any;

  // Low stock items (< 20% of original quantity)
  const lowStockStmt = db.prepare(`
    SELECT * FROM inventory
    WHERE status = 'Active'
    AND current_balance_qty < (quantity_total * 0.2)
    ORDER BY (current_balance_qty / quantity_total) ASC
  `);
  const lowStockItems = lowStockStmt.all() as Inventory[];

  return {
    activeItemsCount: activeCount,
    totalBalanceQty: balance.total_qty,
    totalBalanceWeight: balance.total_weight,
    lowStockItems,
  };
}
