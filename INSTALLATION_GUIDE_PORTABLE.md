# Spice Stock Keeper - Portable Version Installation Guide

## Overview
Spice Stock Keeper is a desktop application for managing spice inventory with cold storage tracking, automated billing cycles, and comprehensive reporting.

**This is the PORTABLE version** - No installation required, just extract and run!

---

## For Windows Users

### System Requirements
- Windows 10 or later (64-bit)
- 300 MB free disk space
- No additional software required

### Installation Steps

1. **Download the ZIP file**
   - Download `Spice-Stock-Keeper-1.0.0-Windows-Portable.zip`

2. **Extract the ZIP file**
   - Right-click the downloaded file
   - Select "Extract All..."
   - Choose a location (e.g., `C:\Programs\SpiceStockKeeper\`)
   - Click "Extract"

3. **Run the application**
   - Open the extracted folder
   - Double-click `Spice Stock Keeper.exe`
   - Windows may show a security warning - click "More info" then "Run anyway"

4. **Optional: Create a shortcut**
   - Right-click `Spice Stock Keeper.exe`
   - Select "Create shortcut"
   - Drag the shortcut to your Desktop

### First Time Setup
- The app will create a database automatically on first launch
- No configuration needed - start adding inventory immediately!

---

## For Linux Users

### System Requirements
- Ubuntu 18.04 or later / Any modern Linux distribution
- 300 MB free disk space

### Installation Steps

1. **Download the tar.gz file**
   - Download `Spice-Stock-Keeper-1.0.0-Linux.tar.gz`

2. **Extract the archive**
   ```bash
   tar -xzf Spice-Stock-Keeper-1.0.0-Linux.tar.gz
   cd linux-unpacked
   ```

3. **Make the executable runnable**
   ```bash
   chmod +x "spice-stock-keeper-electron"
   ```

4. **Run the application**
   ```bash
   ./"spice-stock-keeper-electron"
   ```

5. **Optional: Create a desktop launcher**

   Create a file named `spice-stock-keeper.desktop`:
   ```bash
   nano ~/.local/share/applications/spice-stock-keeper.desktop
   ```

   Add this content (update the path to match your location):
   ```ini
   [Desktop Entry]
   Name=Spice Stock Keeper
   Exec=/path/to/linux-unpacked/spice-stock-keeper-electron
   Icon=/path/to/linux-unpacked/resources/app/icon.png
   Type=Application
   Categories=Office;
   ```

   Save and close. The app will now appear in your application menu.

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

Your data is stored locally:

### Windows
```
C:\Users\YourUsername\AppData\Roaming\spice-stock-keeper-electron\
├── spice-stock.db          (Main database)
└── backups\                (Automatic backups)
```

### Linux
```
~/.config/spice-stock-keeper-electron/
├── spice-stock.db          (Main database)
└── backups\                (Automatic backups)
```

**Note:** The app folder itself only contains program files. Your data is stored separately in the locations above, so you can safely move or delete the app folder without losing data.

---

## Moving to Another Computer

### Windows
1. Close the app on both computers
2. Copy these from old computer:
   - `%APPDATA%\spice-stock-keeper-electron\spice-stock.db`
   - `%APPDATA%\spice-stock-keeper-electron\backups\` (optional)
3. Paste to same location on new computer
4. Extract and run the app on new computer

### Linux
1. Close the app on both computers
2. Copy these from old computer:
   - `~/.config/spice-stock-keeper-electron/spice-stock.db`
   - `~/.config/spice-stock-keeper-electron/backups/` (optional)
3. Paste to same location on new computer
4. Extract and run the app on new computer

---

## Updating to New Version

1. Close the current version
2. Download and extract the new version
3. Run the new version - **your data will be preserved automatically**
4. You can delete the old app folder

---

## Uninstallation

### Windows
1. Simply delete the extracted folder
2. Your data remains in `%APPDATA%\spice-stock-keeper-electron\`
3. To completely remove: Also delete the AppData folder above

### Linux
1. Delete the extracted folder
2. Your data remains in `~/.config/spice-stock-keeper-electron/`
3. To completely remove: Also delete the config folder above

---

## Troubleshooting

### Windows: "Windows protected your PC" message
- Click "More info"
- Click "Run anyway"
- This is normal for unsigned applications

### Linux: Permission denied
```bash
chmod +x spice-stock-keeper-electron
```

### App won't start
- Check if you have enough disk space
- Try running from terminal/command prompt to see error messages
- Windows: Right-click → Run as Administrator
- Linux: Check you have required libraries:
  ```bash
  sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libasound2
  ```

### Data not showing
- Check if database file exists in data location
- Try restoring from automatic backup in backups folder

---

## Version Information

**Version:** 1.0.0
**Release Date:** January 2026
**Platform:** Windows 10+ (64-bit), Linux (64-bit)
**Package Type:** Portable (No installation required)

---

## Contact & Support

For questions, issues, or feature requests, please contact your software provider.

---

**Thank you for using Spice Stock Keeper!** 🌶️
