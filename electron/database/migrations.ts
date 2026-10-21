import { getDatabase } from './db';

export function initDatabase(): void {
  const db = getDatabase();

  // Create cold_storages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cold_storages (
      id TEXT PRIMARY KEY,
      cold_storage_name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Create inventory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      item_name TEXT NOT NULL,
      party_name TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      brand TEXT,
      purchase_rate REAL NOT NULL,
      cold_storage_id TEXT,
      lot_number TEXT,
      quantity_total REAL NOT NULL,
      weight_total REAL NOT NULL,
      cold_rate REAL NOT NULL,
      current_balance_qty REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Completed')),
      completed_at TEXT,
      cold_storage_cost REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (cold_storage_id) REFERENCES cold_storages(id)
    );
  `);

  // Create outgoing table
  db.exec(`
    CREATE TABLE IF NOT EXISTS outgoing (
      id TEXT PRIMARY KEY,
      inventory_id TEXT NOT NULL,
      outgoing_date TEXT NOT NULL,
      quantity_out REAL NOT NULL,
      weight_out REAL NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_inventory_cold_storage 
    ON inventory(cold_storage_id);
    
    CREATE INDEX IF NOT EXISTS idx_inventory_status 
    ON inventory(status);
    
    CREATE INDEX IF NOT EXISTS idx_inventory_item_name 
    ON inventory(item_name);
    
    CREATE INDEX IF NOT EXISTS idx_inventory_party_name 
    ON inventory(party_name);
    
    CREATE INDEX IF NOT EXISTS idx_outgoing_inventory 
    ON outgoing(inventory_id);
    
    CREATE INDEX IF NOT EXISTS idx_outgoing_date 
    ON outgoing(outgoing_date);
  `);

  // Trigger to update current_balance_qty after INSERT on outgoing
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_balance_after_insert
    AFTER INSERT ON outgoing
    BEGIN
      UPDATE inventory
      SET
        current_balance_qty = (
          SELECT i.quantity_total - COALESCE(SUM(o.quantity_out), 0)
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = NEW.inventory_id
          GROUP BY i.id
        ),
        status = (
          SELECT CASE
            WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0
            THEN 'Completed'
            ELSE 'Active'
          END
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = NEW.inventory_id
          GROUP BY i.id
        ),
        completed_at = (
          SELECT CASE
            WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0 AND i.completed_at IS NULL
            THEN datetime('now')
            ELSE i.completed_at
          END
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = NEW.inventory_id
          GROUP BY i.id
        ),
        updated_at = datetime('now')
      WHERE id = NEW.inventory_id;
    END;
  `);

  // Trigger to update current_balance_qty after UPDATE on outgoing
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_balance_after_update
    AFTER UPDATE ON outgoing
    BEGIN
      UPDATE inventory
      SET
        current_balance_qty = (
          SELECT i.quantity_total - COALESCE(SUM(o.quantity_out), 0)
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = NEW.inventory_id
          GROUP BY i.id
        ),
        status = (
          SELECT CASE
            WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0
            THEN 'Completed'
            ELSE 'Active'
          END
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = NEW.inventory_id
          GROUP BY i.id
        ),
        completed_at = (
          SELECT CASE
            WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0 AND i.completed_at IS NULL
            THEN datetime('now')
            ELSE i.completed_at
          END
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = NEW.inventory_id
          GROUP BY i.id
        ),
        updated_at = datetime('now')
      WHERE id = NEW.inventory_id;
    END;
  `);

  // Trigger to update current_balance_qty after DELETE on outgoing
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_balance_after_delete
    AFTER DELETE ON outgoing
    BEGIN
      UPDATE inventory
      SET
        current_balance_qty = (
          SELECT i.quantity_total - COALESCE(SUM(o.quantity_out), 0)
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = OLD.inventory_id
          GROUP BY i.id
        ),
        status = (
          SELECT CASE
            WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0
            THEN 'Completed'
            ELSE 'Active'
          END
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = OLD.inventory_id
          GROUP BY i.id
        ),
        completed_at = (
          SELECT CASE
            WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0 AND i.completed_at IS NULL
            THEN datetime('now')
            WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) > 0
            THEN NULL
            ELSE i.completed_at
          END
          FROM inventory i
          LEFT JOIN outgoing o ON o.inventory_id = i.id
          WHERE i.id = OLD.inventory_id
          GROUP BY i.id
        ),
        updated_at = datetime('now')
      WHERE id = OLD.inventory_id;
    END;
  `);

  // Trigger to recalculate balance when inventory quantity_total is updated
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_balance_on_inventory_update
    AFTER UPDATE OF quantity_total ON inventory
    WHEN OLD.quantity_total != NEW.quantity_total
    BEGIN
      UPDATE inventory
      SET
        current_balance_qty = (
          SELECT NEW.quantity_total - COALESCE(SUM(o.quantity_out), 0)
          FROM outgoing o
          WHERE o.inventory_id = NEW.id
        ),
        status = (
          SELECT CASE
            WHEN NEW.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0
            THEN 'Completed'
            ELSE 'Active'
          END
          FROM outgoing o
          WHERE o.inventory_id = NEW.id
        ),
        completed_at = (
          SELECT CASE
            WHEN NEW.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0 AND NEW.completed_at IS NULL
            THEN datetime('now')
            WHEN NEW.quantity_total - COALESCE(SUM(o.quantity_out), 0) > 0
            THEN NULL
            ELSE NEW.completed_at
          END
          FROM outgoing o
          WHERE o.inventory_id = NEW.id
        )
      WHERE id = NEW.id;
    END;
  `);

  // Migration: Add cold_storage_date column if it doesn't exist
  try {
    const tableInfo = db.prepare('PRAGMA table_info(inventory)').all() as Array<{ name: string }>;
    const hasColdStorageDate = tableInfo.some(col => col.name === 'cold_storage_date');

    if (!hasColdStorageDate) {
      console.log('Adding cold_storage_date column to inventory table...');
      // Add the column with purchase_date as default for existing records
      db.exec(`
        ALTER TABLE inventory ADD COLUMN cold_storage_date TEXT;
      `);
      console.log('cold_storage_date column added');
    }

    // Always ensure existing records have cold_storage_date populated
    // This handles cases where the column exists but has null values
    const needsUpdate = db.prepare(`
      SELECT COUNT(*) as count FROM inventory WHERE cold_storage_date IS NULL
    `).get() as { count: number };

    if (needsUpdate.count > 0) {
      console.log(`Backfilling cold_storage_date for ${needsUpdate.count} records...`);
      db.exec(`
        UPDATE inventory SET cold_storage_date = purchase_date WHERE cold_storage_date IS NULL;
      `);
      console.log('cold_storage_date backfilled successfully');
    }
  } catch (error) {
    console.error('Error adding cold_storage_date column:', error);
  }

  // Migration: Always recreate triggers to ensure latest version
  // This ensures existing databases get the updated triggers with proper JOIN logic
  try {
    console.log('Ensuring triggers are up to date...');
    db.exec(`DROP TRIGGER IF EXISTS update_balance_after_insert;`);
    db.exec(`DROP TRIGGER IF EXISTS update_balance_after_update;`);
    db.exec(`DROP TRIGGER IF EXISTS update_balance_after_delete;`);
    db.exec(`DROP TRIGGER IF EXISTS update_balance_on_inventory_update;`);

    // Recreate triggers with proper JOIN-based logic
    db.exec(`
      CREATE TRIGGER update_balance_after_insert
      AFTER INSERT ON outgoing
      BEGIN
        UPDATE inventory
        SET
          current_balance_qty = (
            SELECT i.quantity_total - COALESCE(SUM(o.quantity_out), 0)
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = NEW.inventory_id
            GROUP BY i.id
          ),
          status = (
            SELECT CASE
              WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0
              THEN 'Completed'
              ELSE 'Active'
            END
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = NEW.inventory_id
            GROUP BY i.id
          ),
          completed_at = (
            SELECT CASE
              WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0 AND i.completed_at IS NULL
              THEN datetime('now')
              ELSE i.completed_at
            END
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = NEW.inventory_id
            GROUP BY i.id
          ),
          updated_at = datetime('now')
        WHERE id = NEW.inventory_id;
      END;
    `);

    db.exec(`
      CREATE TRIGGER update_balance_after_update
      AFTER UPDATE ON outgoing
      BEGIN
        UPDATE inventory
        SET
          current_balance_qty = (
            SELECT i.quantity_total - COALESCE(SUM(o.quantity_out), 0)
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = NEW.inventory_id
            GROUP BY i.id
          ),
          status = (
            SELECT CASE
              WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0
              THEN 'Completed'
              ELSE 'Active'
            END
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = NEW.inventory_id
            GROUP BY i.id
          ),
          completed_at = (
            SELECT CASE
              WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0 AND i.completed_at IS NULL
              THEN datetime('now')
              ELSE i.completed_at
            END
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = NEW.inventory_id
            GROUP BY i.id
          ),
          updated_at = datetime('now')
        WHERE id = NEW.inventory_id;
      END;
    `);

    db.exec(`
      CREATE TRIGGER update_balance_after_delete
      AFTER DELETE ON outgoing
      BEGIN
        UPDATE inventory
        SET
          current_balance_qty = (
            SELECT i.quantity_total - COALESCE(SUM(o.quantity_out), 0)
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = OLD.inventory_id
            GROUP BY i.id
          ),
          status = (
            SELECT CASE
              WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0
              THEN 'Completed'
              ELSE 'Active'
            END
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = OLD.inventory_id
            GROUP BY i.id
          ),
          completed_at = (
            SELECT CASE
              WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0 AND i.completed_at IS NULL
              THEN datetime('now')
              WHEN i.quantity_total - COALESCE(SUM(o.quantity_out), 0) > 0
              THEN NULL
              ELSE i.completed_at
            END
            FROM inventory i
            LEFT JOIN outgoing o ON o.inventory_id = i.id
            WHERE i.id = OLD.inventory_id
            GROUP BY i.id
          ),
          updated_at = datetime('now')
        WHERE id = OLD.inventory_id;
      END;
    `);

    // Trigger to recalculate balance when inventory quantity_total is updated
    db.exec(`
      CREATE TRIGGER update_balance_on_inventory_update
      AFTER UPDATE OF quantity_total ON inventory
      WHEN OLD.quantity_total != NEW.quantity_total
      BEGIN
        UPDATE inventory
        SET
          current_balance_qty = (
            SELECT NEW.quantity_total - COALESCE(SUM(o.quantity_out), 0)
            FROM outgoing o
            WHERE o.inventory_id = NEW.id
          ),
          status = (
            SELECT CASE
              WHEN NEW.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0
              THEN 'Completed'
              ELSE 'Active'
            END
            FROM outgoing o
            WHERE o.inventory_id = NEW.id
          ),
          completed_at = (
            SELECT CASE
              WHEN NEW.quantity_total - COALESCE(SUM(o.quantity_out), 0) <= 0 AND NEW.completed_at IS NULL
              THEN datetime('now')
              WHEN NEW.quantity_total - COALESCE(SUM(o.quantity_out), 0) > 0
              THEN NULL
              ELSE NEW.completed_at
            END
            FROM outgoing o
            WHERE o.inventory_id = NEW.id
          )
        WHERE id = NEW.id;
      END;
    `);

    console.log('Triggers updated successfully with JOIN-based logic');
  } catch (error) {
    console.error('Error updating triggers:', error);
  }

  // Sale Orders — parent + line items
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_orders (
      id TEXT PRIMARY KEY,
      serial_no TEXT NOT NULL UNIQUE,
      order_date TEXT NOT NULL,
      party_name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_order_items (
      id TEXT PRIMARY KEY,
      sale_order_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      marka TEXT,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      discount_percent REAL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sale_orders_date ON sale_orders(order_date);
    CREATE INDEX IF NOT EXISTS idx_sale_orders_party ON sale_orders(party_name);
    CREATE INDEX IF NOT EXISTS idx_sale_orders_serial ON sale_orders(serial_no);
    CREATE INDEX IF NOT EXISTS idx_sale_order_items_parent ON sale_order_items(sale_order_id);
  `);

  // Builty / Dispatch — parent + line items
  db.exec(`
    CREATE TABLE IF NOT EXISTS builty (
      id TEXT PRIMARY KEY,
      serial_no TEXT NOT NULL UNIQUE,
      builty_date TEXT NOT NULL,
      party_name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS builty_items (
      id TEXT PRIMARY KEY,
      builty_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      marka TEXT,
      quantity REAL NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (builty_id) REFERENCES builty(id) ON DELETE CASCADE
    );
  `);

  // Migration: add marka column to existing builty_items tables (v1.0.2 or earlier)
  try {
    const tableInfo = db.prepare('PRAGMA table_info(builty_items)').all() as Array<{ name: string }>;
    const hasMarka = tableInfo.some((c) => c.name === 'marka');
    if (!hasMarka) {
      console.log('Adding marka column to builty_items table...');
      db.exec(`ALTER TABLE builty_items ADD COLUMN marka TEXT;`);
      console.log('marka column added');
    }
  } catch (error) {
    console.error('Error adding marka column to builty_items:', error);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_builty_date ON builty(builty_date);
    CREATE INDEX IF NOT EXISTS idx_builty_party ON builty(party_name);
    CREATE INDEX IF NOT EXISTS idx_builty_serial ON builty(serial_no);
    CREATE INDEX IF NOT EXISTS idx_builty_items_parent ON builty_items(builty_id);
  `);

  // Master lists for Items and Parties — browsable/editable records plus
  // the autocomplete feed. name is UNIQUE COLLATE NOCASE so "Chilli" and
  // "chilli" collapse. v1.0.4 shipped these with just `name`; the migration
  // block below adds the rest of the columns in-place for existing DBs.
  db.exec(`
    CREATE TABLE IF NOT EXISTS items_master (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      unit TEXT,
      brand TEXT,
      hsn_code TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS parties_master (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      phone TEXT,
      address TEXT,
      city TEXT,
      gstin TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_master_name ON items_master(name);
    CREATE INDEX IF NOT EXISTS idx_parties_master_name ON parties_master(name);
  `);

  // Migration: add new master columns on existing v1.0.4 DBs
  try {
    const im = db.prepare('PRAGMA table_info(items_master)').all() as Array<{ name: string }>;
    const existing = new Set(im.map((c) => c.name));
    const toAdd: Array<[string, string]> = [
      ['unit', 'TEXT'],
      ['brand', 'TEXT'],
      ['hsn_code', 'TEXT'],
      ['notes', 'TEXT'],
      ['updated_at', 'TEXT'],
    ];
    for (const [col, type] of toAdd) {
      if (!existing.has(col)) {
        db.exec(`ALTER TABLE items_master ADD COLUMN ${col} ${type};`);
      }
    }
  } catch (error) {
    console.error('Error extending items_master:', error);
  }

  try {
    const pm = db.prepare('PRAGMA table_info(parties_master)').all() as Array<{ name: string }>;
    const existing = new Set(pm.map((c) => c.name));
    const toAdd: Array<[string, string]> = [
      ['phone', 'TEXT'],
      ['address', 'TEXT'],
      ['city', 'TEXT'],
      ['gstin', 'TEXT'],
      ['notes', 'TEXT'],
      ['updated_at', 'TEXT'],
    ];
    for (const [col, type] of toAdd) {
      if (!existing.has(col)) {
        db.exec(`ALTER TABLE parties_master ADD COLUMN ${col} ${type};`);
      }
    }
  } catch (error) {
    console.error('Error extending parties_master:', error);
  }

  // Migration: add unit column to sale_order_items and builty_items so the
  // measurement unit (kg / katta / bag / pcs …) is snapshotted at save time,
  // keeping historical orders stable even if the item master's unit changes.
  try {
    const soCols = db.prepare('PRAGMA table_info(sale_order_items)').all() as Array<{ name: string }>;
    if (!soCols.some((c) => c.name === 'unit')) {
      db.exec(`ALTER TABLE sale_order_items ADD COLUMN unit TEXT;`);
    }
    const btCols = db.prepare('PRAGMA table_info(builty_items)').all() as Array<{ name: string }>;
    if (!btCols.some((c) => c.name === 'unit')) {
      db.exec(`ALTER TABLE builty_items ADD COLUMN unit TEXT;`);
    }
  } catch (error) {
    console.error('Error adding unit column to line-item tables:', error);
  }

  // Backfill masters from existing inventory / sale orders / builtys so names
  // typed into those tables before the masters existed are visible (and
  // editable) on the Items / Parties pages. Idempotent thanks to
  // INSERT OR IGNORE against UNIQUE COLLATE NOCASE, so this is safe to run
  // on every startup — a no-op when there's nothing new.
  try {
    const { randomUUID } = require('crypto') as typeof import('crypto');
    const now = new Date().toISOString();

    const itemNames = db
      .prepare(
        `SELECT DISTINCT trim(name) AS name FROM (
           SELECT item_name AS name FROM inventory WHERE item_name IS NOT NULL AND trim(item_name) != ''
           UNION SELECT item_name FROM sale_order_items WHERE item_name IS NOT NULL AND trim(item_name) != ''
           UNION SELECT item_name FROM builty_items WHERE item_name IS NOT NULL AND trim(item_name) != ''
         )`
      )
      .all() as Array<{ name: string }>;
    const insItem = db.prepare(
      `INSERT OR IGNORE INTO items_master (id, name, created_at) VALUES (?, ?, ?)`
    );
    const txItems = db.transaction((rows: Array<{ name: string }>) => {
      for (const r of rows) if (r.name) insItem.run(randomUUID(), r.name, now);
    });
    txItems(itemNames);

    const partyNames = db
      .prepare(
        `SELECT DISTINCT trim(name) AS name FROM (
           SELECT party_name AS name FROM inventory WHERE party_name IS NOT NULL AND trim(party_name) != ''
           UNION SELECT party_name FROM sale_orders WHERE party_name IS NOT NULL AND trim(party_name) != ''
           UNION SELECT party_name FROM builty WHERE party_name IS NOT NULL AND trim(party_name) != ''
         )`
      )
      .all() as Array<{ name: string }>;
    const insParty = db.prepare(
      `INSERT OR IGNORE INTO parties_master (id, name, created_at) VALUES (?, ?, ?)`
    );
    const txParties = db.transaction((rows: Array<{ name: string }>) => {
      for (const r of rows) if (r.name) insParty.run(randomUUID(), r.name, now);
    });
    txParties(partyNames);
  } catch (error) {
    console.error('Error backfilling masters from existing records:', error);
  }

  console.log('Database initialized successfully');
}
