# Hybrid Backup System

## Overview
The app now uses a comprehensive hybrid backup system that ensures your data is backed up regularly, regardless of usage patterns.

## Backup Strategies

### 1. **Startup Backup** ✓
- **When**: Every time the app starts
- **Condition**: Only creates a backup if the last backup is older than 24 hours
- **Why**: Ensures you always have a recent backup, even if the laptop was off for days
- **Location**: Logs show "Checking for startup backup..."

### 2. **Periodic Backup (Every 6 Hours)** ✓
- **When**: Continuously while the app is running
- **Frequency**: Every 6 hours
- **Why**: Protects data during long work sessions without waiting for app close
- **Location**: Logs show "Running periodic backup (6-hour interval)..."

### 3. **Close/Quit Backup** ✓
- **When**: When you close the app or shut down
- **Why**: Captures all changes made during the session
- **Events**: Triggers on both window close and app quit
- **Location**: Logs show "Creating backup on app close..."

### 4. **Manual Backup** ✓
- **When**: Click "Manual Backup" button in Reports page
- **Why**: User-initiated backups to a custom location
- **Feature**: Opens file dialog to choose save location

## Backup Storage

### Location
- **Auto Backups**: `%APPDATA%/spice-stock-keeper/backups/`
- **Manual Backups**: User-selected location

### File Naming
- Format: `spice-stock-backup_YYYY-MM-DD_HHMMSS.db`
- Example: `spice-stock-backup_2026-01-28_143022.db`

### Retention Policy
- **Maximum**: 7 backups are kept
- **Cleanup**: Automatic - oldest backups are deleted when limit is exceeded
- **Why**: Prevents disk space issues while maintaining a week's worth of recovery points

## How It Works

### Normal Day Usage
1. **Morning**: Start app → Checks last backup
   - If > 24 hours old → Creates backup
   - If recent → Skips
2. **Throughout day**: Automatic backup every 6 hours
3. **Evening**: Close app → Creates final backup

### Laptop Shutdown Scenario
1. User closes laptop without closing app
2. On next startup (even days later):
   - App detects last backup is old (> 24 hours)
   - Creates fresh backup immediately
3. Periodic backups resume

### Long Work Session
- User works for 12 hours straight
- Automatic backups at: 6 hours, 12 hours
- Final backup when closing app
- **Result**: 3 backups created during the session

## Benefits

✅ **No Data Loss**: Multiple backup triggers ensure data is always protected
✅ **Laptop Shutdown Safe**: Works even when laptop is off for extended periods
✅ **Low Maintenance**: Fully automatic with no user action needed
✅ **Space Efficient**: Only keeps last 7 backups
✅ **User Control**: Manual backup option available anytime

## Recovery

To restore from a backup:
1. Close the app
2. Navigate to `%APPDATA%/spice-stock-keeper/`
3. Rename current `spice-stock.db` to `spice-stock.db.old` (as a precaution)
4. Copy desired backup from `backups/` folder
5. Rename the backup copy to `spice-stock.db`
6. Start the app

## Logs

Check console logs for backup activity:
- Startup check: "Checking for startup backup..."
- Periodic: "Running periodic backup (6-hour interval)..."
- Close: "Creating backup on app close..."
- Result: Shows success/failure message

## Technical Details

- **Backup Method**: File copy (fs.copyFileSync)
- **Database**: SQLite (.db file)
- **Timer**: Node.js setInterval (6 hours)
- **Events**: Electron app lifecycle hooks
- **Cleanup**: Automatic on every backup creation
