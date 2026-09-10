const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Simulate app.getPath for testing
const dbPath = path.join(process.env.APPDATA || '', 'spice-stock-keeper-electron', 'spice-stock.db');

const db = new Database(dbPath);

console.log('\n=== Checking Triggers ===\n');

const triggers = db.prepare(`
  SELECT name, sql FROM sqlite_master 
  WHERE type='trigger' 
  ORDER BY name
`).all();

triggers.forEach(trigger => {
  console.log('Trigger:', trigger.name);
  console.log(trigger.sql);
  console.log('\n---\n');
});

console.log('\n=== Checking Inventory Table ===\n');
const inventory = db.prepare('SELECT id, item_name, quantity_total, current_balance_qty, status FROM inventory LIMIT 5').all();
console.table(inventory);

console.log('\n=== Checking Outgoing Table ===\n');
const outgoing = db.prepare('SELECT inventory_id, quantity_out FROM outgoing').all();
console.table(outgoing);

db.close();
