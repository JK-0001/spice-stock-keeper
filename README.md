# Spice Stock Keeper - Electron Desktop App

A desktop inventory management application for spice stock tracking with local SQLite database storage.

## Features

- **Local SQLite Database**: All data stored locally on your computer
- **No Authentication Required**: Single-user desktop application
- **Inventory Management**: Track spice items with purchase details, quantities, and weights
- **Cold Storage Tracking**: Manage multiple cold storage facilities
- **Outgoing Stock Records**: Record and track stock dispatch/outgoing
- **30-Day Billing Cycles**: Automatic calculation of storage charges
- **Comprehensive Reports**: Multiple report views (Cold Storage-wise, Item-wise, Detailed Breakdown)
- **Dashboard**: Overview of active items, balances, and billing summaries

## Technology Stack

- **Electron**: Desktop application framework
- **React**: UI library
- **TypeScript**: Type-safe development
- **SQLite**: Local relational database (better-sqlite3)
- **TanStack Query**: Data synchronization and caching
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components
- **Vite**: Build tool

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Steps

1. Clone or extract the project
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Start the development server:

```bash
npm run dev
```

This will:
- Start the Vite dev server for React
- Launch the Electron window
- Enable hot module replacement
- Create the SQLite database at: `%AppData%/spice-stock-keeper-electron/spice-stock.db` (Windows)

## Building for Production

Build the application for your platform:

```bash
npm run build
```

This will create distributable packages in the `dist` directory.

## Project Structure

```
spice-stock-keeper-electron/
├── electron/                    # Electron main process
│   ├── main.ts                 # Main window + app lifecycle
│   ├── preload.ts              # Secure IPC bridge
│   ├── types.ts                # Type definitions
│   └── database/
│       ├── db.ts              # SQLite connection
│       ├── migrations.ts      # Database schema
│       └── handlers.ts        # IPC request handlers
├── src/                        # React renderer process
│   ├── components/            # UI components
│   ├── pages/                 # Application pages
│   ├── hooks/                 # React hooks for data fetching
│   ├── lib/                   # Utilities and types
│   │   ├── billing-cycles.ts # Billing calculation logic
│   │   └── types.ts          # TypeScript types
│   ├── App.tsx               # Main app component
│   └── main.tsx              # React entry point
├── package.json
├── vite.config.ts            # Vite configuration
└── tsconfig.json             # TypeScript configuration
```

## Database Schema

### Tables

**cold_storages**
- id (TEXT PRIMARY KEY)
- cold_storage_name (TEXT)
- notes (TEXT)
- created_at (TEXT)

**inventory**
- id (TEXT PRIMARY KEY)
- item_name (TEXT)
- party_name (TEXT)
- purchase_date (TEXT)
- brand (TEXT)
- purchase_rate (REAL)
- cold_storage_id (TEXT FK)
- lot_number (TEXT)
- quantity_total (REAL)
- weight_total (REAL)
- cold_rate (REAL)
- current_balance_qty (REAL) - auto-calculated
- status (TEXT: 'Active' | 'Completed')
- completed_at (TEXT)
- cold_storage_cost (REAL)
- created_at (TEXT)
- updated_at (TEXT)

**outgoing**
- id (TEXT PRIMARY KEY)
- inventory_id (TEXT FK)
- outgoing_date (TEXT)
- quantity_out (REAL)
- weight_out (REAL)
- remarks (TEXT)
- created_at (TEXT)

### Automatic Features

- **Foreign Key Constraints**: Ensures data integrity
- **Cascade Deletes**: Deleting inventory items automatically removes related outgoing records
- **Triggers**: Automatically updates `current_balance_qty` when outgoing records change
- **Indexes**: Optimized for common query patterns

## Billing Calculation Logic

The application uses a 30-day billing cycle system:

1. Cycles start from the `purchase_date` of each inventory item
2. Storage charge for each cycle = `opening_quantity` × `cold_rate`
3. Outgoing during a cycle only affects the NEXT cycle's opening balance
4. Final cycle is fully charged even if balance becomes zero mid-cycle
5. Billing stops at today's date (no future cycles)

This logic is preserved from the original web application and remains unchanged.

## Usage Guide

### Dashboard
- View active item count, total balance, and low stock alerts
- See billing summaries (active vs completed items)

### Inventory Management
1. Navigate to "Inventory" page
2. Click "Add Inventory" to create new items
3. Filter by item name, cold storage, party, or status
4. Click on an item to view details and billing cycles

### Cold Storage Management
1. Navigate to "Cold Storages"
2. Add new storage facilities with name and notes
3. Assign inventory items to specific storages

### Outgoing Stock
1. Open an inventory item detail page
2. Click "Add Outgoing" to record stock dispatch
3. Enter quantity, weight, date, and optional remarks
4. Balance automatically updates

### Reports
Access three report views:
- **Cold Storage Summary**: Total payable per storage facility
- **Item Summary**: Total payable per inventory item
- **Drilldown**: Hierarchical view with expandable billing cycles

## Data Location

The SQLite database file is stored at:

- **Windows**: `%AppData%\spice-stock-keeper-electron\spice-stock.db`
- **macOS**: `~/Library/Application Support/spice-stock-keeper-electron/spice-stock.db`
- **Linux**: `~/.config/spice-stock-keeper-electron/spice-stock.db`

## Differences from Web Version

- **No Authentication**: Removed login/signup (local single-user app)
- **Local Storage**: SQLite database instead of Supabase PostgreSQL
- **Offline First**: All data stored locally, no internet required
- **Desktop UI**: Native window controls and menus

## Troubleshooting

### Database Issues
If you encounter database errors:
1. Close the application
2. Locate the database file (see Data Location above)
3. Backup or delete the file
4. Restart the application (a new database will be created)

### Build Errors
If TypeScript compilation fails:
```bash
npm run type-check
```

### Missing Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## License

MIT

## Credits

Converted from the original web-based Spice Stock Keeper application to a standalone Electron desktop app with local SQLite storage.
