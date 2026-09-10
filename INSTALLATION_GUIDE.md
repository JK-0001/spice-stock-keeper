# Spice Stock Keeper - Installation Guide

## Overview
Spice Stock Keeper is a desktop application for managing spice inventory with cold storage tracking, automated billing cycles, and comprehensive reporting.

---

## For Windows Users

### System Requirements
- Windows 10 or later (64-bit)
- 200 MB free disk space
- No additional software required

### Installation Steps

1. **Download the installer**
   - Download `Spice-Stock-Keeper-1.0.0-Windows-Setup.exe`

2. **Run the installer**
   - Double-click the downloaded file
   - Windows may show a security warning - click "More info" then "Run anyway"

3. **Follow installation wizard**
   - Choose installation location (default is recommended)
   - Select "Create desktop shortcut" if desired
   - Click "Install"

4. **Launch the application**
   - Use the desktop shortcut or
   - Find "Spice Stock Keeper" in Start Menu

### First Time Setup
- The app will create a database automatically on first launch
- No configuration needed - start adding inventory immediately!

---

## For Linux Users

### System Requirements
- Ubuntu 18.04 or later / Any modern Linux distribution
- 200 MB free disk space

### Installation Steps

#### Option 1: AppImage (Recommended - Works on all Linux distributions)

1. **Download the AppImage**
   - Download `Spice-Stock-Keeper-1.0.0-Linux.AppImage`

2. **Make it executable**
   ```bash
   chmod +x Spice-Stock-Keeper-1.0.0-Linux.AppImage
   ```

3. **Run the application**
   ```bash
   ./Spice-Stock-Keeper-1.0.0-Linux.AppImage
   ```

#### Option 2: .deb Package (For Debian/Ubuntu-based systems)

1. **Download the .deb file**
   - Download `Spice-Stock-Keeper-1.0.0-Linux.deb`

2. **Install using package manager**
   ```bash
   sudo dpkg -i Spice-Stock-Keeper-1.0.0-Linux.deb
   sudo apt-get install -f  # Install any missing dependencies
   ```

3. **Launch the application**
   - Find "Spice Stock Keeper" in your application menu
   - Or run from terminal: `spice-stock-keeper`

---

## Features

### Inventory Management
- ✅ Add inventory items with purchase details
- ✅ Track cold storage location
- ✅ Separate purchase date and cold storage date
- ✅ Record outgoing stock with automatic balance updates
- ✅ Filter and search inventory

### Billing & Reports
- ✅ Automatic 30-day billing cycles
- ✅ Cold storage cost calculations
- ✅ Billing reports by date range
- ✅ Export inventory to PDF
- ✅ Dashboard with key metrics

### Data Protection
- ✅ Automatic backups on startup (if > 24 hours since last backup)
- ✅ Periodic backups every 6 hours while app is running
- ✅ Automatic backup when closing the app
- ✅ Manual backup option available anytime
- ✅ Last 7 backups kept automatically

---

## Data Location

Your data is stored locally on your computer:

### Windows
```
C:\Users\YourUsername\AppData\Roaming\spice-stock-keeper-electron\
├── spice-stock.db          (Main database)
└── backups\                (Automatic backups)
    ├── spice-stock-backup_2026-01-28_100530.db
    └── ...
```

### Linux
```
~/.config/spice-stock-keeper-electron/
├── spice-stock.db          (Main database)
└── backups\                (Automatic backups)
```

---

## Backup & Restore

### Manual Backup
1. Open the app
2. Go to "Reports" page
3. Click "Manual Backup" button
4. Choose where to save the backup file

### Restore from Backup

#### Windows
1. Close the app
2. Open File Explorer
3. Navigate to `%APPDATA%\spice-stock-keeper-electron\`
4. Rename `spice-stock.db` to `spice-stock.db.old` (as precaution)
5. Copy your backup file to this location
6. Rename it to `spice-stock.db`
7. Start the app

#### Linux
1. Close the app
2. Open file manager or terminal
3. Navigate to `~/.config/spice-stock-keeper-electron/`
4. Rename `spice-stock.db` to `spice-stock.db.old`
5. Copy your backup file to this location
6. Rename it to `spice-stock.db`
7. Start the app

---

## Uninstallation

### Windows
1. Open "Settings" → "Apps" → "Installed apps"
2. Find "Spice Stock Keeper"
3. Click "Uninstall"
4. Your data will remain in AppData folder (safe to delete if desired)

### Linux (AppImage)
- Simply delete the AppImage file
- Data in `~/.config/spice-stock-keeper-electron/` remains (delete if desired)

### Linux (.deb)
```bash
sudo apt remove spice-stock-keeper
```

---

## Troubleshooting

### App won't start on Windows
- Right-click the installer → Properties → Unblock → Apply
- Run as Administrator

### App won't start on Linux
- Ensure the AppImage is executable: `chmod +x filename.AppImage`
- Check you have necessary libraries: `sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1`

### Data not showing
- Check if database file exists in data location
- Try restoring from automatic backup in backups folder

### Need help?
Contact support with:
- Operating system and version
- Error message (if any)
- Steps to reproduce the issue

---

## Version Information

**Current Version:** 1.0.0
**Release Date:** January 2026
**Platform:** Windows 10+, Linux (64-bit)

---

## Contact & Support

For questions, issues, or feature requests, please contact your software provider.

---

**Thank you for using Spice Stock Keeper!** 🌶️
