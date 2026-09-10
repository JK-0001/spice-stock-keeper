# Quick Start Guide

## Installation (30 seconds)

### Windows
1. Download `Spice-Stock-Keeper-1.0.0-Windows-Setup.exe`
2. Double-click to install
3. Launch from desktop shortcut

### Linux
1. Download `Spice-Stock-Keeper-1.0.0-Linux.AppImage`
2. Make executable: `chmod +x Spice-Stock-Keeper-1.0.0-Linux.AppImage`
3. Run: `./Spice-Stock-Keeper-1.0.0-Linux.AppImage`

---

## First Steps

### 1. Add a Cold Storage Location (Optional)
- Navigate to "Cold Storages" page
- Click "Add Cold Storage"
- Enter name (e.g., "Warehouse A")
- Save

### 2. Add Your First Inventory Item
- Go to "Inventory" page
- Click "Add Inventory"
- Fill in the form:
  - **Item Name:** e.g., "DHANIYA"
  - **Party Name:** Supplier name
  - **Purchase Date:** When you bought it
  - **Cold Storage Date:** When you stored it ⭐ (Used for billing)
  - **Quantity:** Number of units
  - **Cold Rate:** Daily storage cost per unit
- Click "Add Inventory"

### 3. Record Outgoing Stock
- Click "View" on any inventory item
- Click "Record Outgoing"
- Enter quantity going out
- Add date and remarks
- Save

### 4. View Reports
- Go to "Reports" page
- Select date range
- See billing cycles and cold storage costs
- Export to PDF if needed

---

## Key Features

### 🔄 Automatic Billing Cycles
- **30-day cycles** start from cold storage date
- Automatically calculated
- No manual tracking needed

### 💾 Automatic Backups
- **On startup** (if last backup > 24 hours)
- **Every 6 hours** while running
- **On app close**
- Last 7 backups kept automatically

### 📊 Reports & Export
- Billing reports by date range
- Export inventory to PDF
- Dashboard with key metrics

### 🔒 Local & Secure
- All data stored on your computer
- No internet required
- Complete privacy

---

## Common Tasks

### Create a Manual Backup
1. Go to Reports page
2. Click "Manual Backup"
3. Choose save location

### Filter Inventory
- Use search box to find items by name
- Filter by cold storage location
- Filter by status (Active/Completed)

### Edit Inventory Item
1. Click "View" on item
2. Click "Edit" button
3. Make changes
4. Save

### Export to PDF
1. Go to Inventory page
2. Apply filters if needed
3. Click "Export PDF"

---

## Understanding Billing Cycles

**Example:**
- Item stored on: Jan 1, 2026
- Quantity: 100 units
- Cold rate: ₹2 per day per unit

**Billing:**
- Cycle 1: Jan 1 - Jan 30 (100 units × ₹2 × 30 days) = ₹6,000
- Cycle 2: Jan 31 - Mar 1 (100 units × ₹2 × 30 days) = ₹6,000
- And so on...

**If 50 units go out on Jan 15:**
- Cycle 1: Still charged for 100 units (opening qty)
- Cycle 2: Charged for 50 units (remaining qty)

---

## Need Help?

### App Won't Start?
- Windows: Run as Administrator
- Linux: Check executable permissions

### Can't Find Data?
- Windows: `%APPDATA%\spice-stock-keeper-electron\`
- Linux: `~/.config/spice-stock-keeper-electron/`

### Want to Restore Backup?
- Close app
- Copy backup file to data location
- Rename to `spice-stock.db`
- Restart app

---

## Tips & Tricks

✅ **Use Cold Storage Date correctly** - This date determines billing start, not purchase date

✅ **Check Dashboard regularly** - Shows overview of active items and balances

✅ **Export reports before deleting items** - Completed items can be archived via PDF

✅ **Manual backup before major changes** - Extra safety when making bulk updates

✅ **Filter before export** - PDF exports respect active filters

---

## Support

For questions or issues, contact your software provider with:
- OS and version
- Error message (if any)
- Screenshot (if possible)

---

**Happy tracking!** 🌶️📦
