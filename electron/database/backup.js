import fs from 'fs';
import path from 'path';
import { app, dialog } from 'electron';
import Database from 'better-sqlite3';
import { closeDatabase } from './db';
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups');
const DB_PATH = path.join(app.getPath('userData'), 'spice-stock.db');
const MAX_BACKUPS = 7; // Keep last 7 backups
const BACKUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const BACKUP_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours - trigger backup if last backup is older
let periodicBackupTimer = null;
// Ensure backup directory exists
export function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}
// Create a backup of the database
export function createBackup() {
    try {
        ensureBackupDir();
        if (!fs.existsSync(DB_PATH)) {
            return { success: false, message: 'Database file not found' };
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
        const backupFileName = `spice-stock-backup_${timestamp}_${timeStr}.db`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);
        // Copy the database file
        fs.copyFileSync(DB_PATH, backupPath);
        console.log('Backup created:', backupPath);
        // Clean up old backups
        cleanupOldBackups();
        return {
            success: true,
            message: 'Backup created successfully',
            filePath: backupPath,
        };
    }
    catch (error) {
        console.error('Backup failed:', error);
        return {
            success: false,
            message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
// Manual backup with user-selected location
export async function createManualBackup() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { success: false, message: 'Database file not found' };
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
        const defaultFileName = `spice-stock-backup_${timestamp}_${timeStr}.db`;
        // Show save dialog
        const result = await dialog.showSaveDialog({
            title: 'Save Backup',
            defaultPath: defaultFileName,
            filters: [
                { name: 'Database Files', extensions: ['db'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        if (result.canceled || !result.filePath) {
            return { success: false, message: 'Backup cancelled' };
        }
        // Copy the database file to selected location
        fs.copyFileSync(DB_PATH, result.filePath);
        console.log('Manual backup created:', result.filePath);
        return {
            success: true,
            message: `Backup saved to ${result.filePath}`,
        };
    }
    catch (error) {
        console.error('Manual backup failed:', error);
        return {
            success: false,
            message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
// Clean up old backups (keep only last MAX_BACKUPS)
function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('spice-stock-backup_') && file.endsWith('.db'))
            .map(file => ({
            name: file,
            path: path.join(BACKUP_DIR, file),
            time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
        }))
            .sort((a, b) => b.time - a.time); // Sort by time, newest first
        // Delete old backups
        if (files.length > MAX_BACKUPS) {
            const filesToDelete = files.slice(MAX_BACKUPS);
            filesToDelete.forEach(file => {
                fs.unlinkSync(file.path);
                console.log('Deleted old backup:', file.name);
            });
        }
    }
    catch (error) {
        console.error('Cleanup failed:', error);
    }
}
// Get the most recent backup file
function getLastBackupTime() {
    try {
        ensureBackupDir();
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('spice-stock-backup_') && file.endsWith('.db'))
            .map(file => ({
            path: path.join(BACKUP_DIR, file),
            time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
        }))
            .sort((a, b) => b.time - a.time);
        return files.length > 0 ? files[0].time : null;
    }
    catch (error) {
        console.error('Error getting last backup time:', error);
        return null;
    }
}
// Check if backup is needed and create one if necessary
export function checkAndCreateBackupOnStartup() {
    const lastBackupTime = getLastBackupTime();
    if (!lastBackupTime) {
        console.log('No previous backups found, creating initial backup...');
        return createBackup();
    }
    const timeSinceLastBackup = Date.now() - lastBackupTime;
    if (timeSinceLastBackup > BACKUP_THRESHOLD) {
        console.log(`Last backup was ${Math.floor(timeSinceLastBackup / 1000 / 60 / 60)} hours ago, creating new backup...`);
        return createBackup();
    }
    console.log(`Last backup was ${Math.floor(timeSinceLastBackup / 1000 / 60)} minutes ago, skipping startup backup`);
    return { success: true, message: 'Recent backup exists, skipping' };
}
// Start periodic backups every 6 hours
export function startPeriodicBackup() {
    // Clear any existing timer
    if (periodicBackupTimer) {
        clearInterval(periodicBackupTimer);
    }
    // Create backup every 6 hours
    periodicBackupTimer = setInterval(() => {
        console.log('Running periodic backup (6-hour interval)...');
        const result = createBackup();
        console.log('Periodic backup result:', result.message);
    }, BACKUP_INTERVAL);
    console.log('Periodic backup started (every 6 hours)');
}
// Stop periodic backups
export function stopPeriodicBackup() {
    if (periodicBackupTimer) {
        clearInterval(periodicBackupTimer);
        periodicBackupTimer = null;
        console.log('Periodic backup stopped');
    }
}
// Create backup on app close
export function createBackupOnClose() {
    console.log('Creating backup on app close...');
    const result = createBackup();
    console.log('Close backup result:', result.message);
    return result;
}
// Import database from a user-chosen file. Validates the file, backs up the
// current DB (so the operation is reversible), overwrites the DB file, then
// relaunches the app so the fresh DB loads cleanly.
export async function importDatabase() {
    try {
        // 1) Ask the user to pick a .db file
        const picked = await dialog.showOpenDialog({
            title: 'Import SpiceIn Data',
            properties: ['openFile'],
            filters: [
                { name: 'SpiceIn Database', extensions: ['db'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        if (picked.canceled || picked.filePaths.length === 0) {
            return { success: false, cancelled: true, message: 'Import cancelled' };
        }
        const srcPath = picked.filePaths[0];
        // 2) Validate that the picked file is a real SpiceIn database
        let testDb = null;
        try {
            testDb = new Database(srcPath, { readonly: true, fileMustExist: true });
            const tables = testDb
                .prepare("SELECT name FROM sqlite_master WHERE type='table'")
                .all();
            const names = tables.map((t) => t.name);
            const required = ['inventory', 'sale_orders', 'builty', 'cold_storages'];
            const missing = required.filter((t) => !names.includes(t));
            if (missing.length > 0) {
                return {
                    success: false,
                    message: `Selected file is not a SpiceIn database. Missing tables: ${missing.join(', ')}`,
                };
            }
        }
        catch (err) {
            return {
                success: false,
                message: `Could not open the selected file as a database: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
        finally {
            if (testDb)
                testDb.close();
        }
        // 3) Ask the user to confirm — this replaces all current data
        const confirm = await dialog.showMessageBox({
            type: 'warning',
            title: 'Replace all data on this laptop?',
            message: 'This will replace ALL current SpiceIn data on this laptop with data from the imported file.',
            detail: `Source file:\n${srcPath}\n\n` +
                'A backup of your current data will be saved first so you can restore it later if needed.\n\n' +
                'The app will restart automatically after import.',
            buttons: ['Cancel', 'Yes, replace and restart'],
            defaultId: 0,
            cancelId: 0,
        });
        if (confirm.response !== 1) {
            return { success: false, cancelled: true, message: 'Import cancelled' };
        }
        // 4) Back up the current DB before overwriting (so import is reversible)
        if (fs.existsSync(DB_PATH)) {
            const preBackup = createBackup();
            if (!preBackup.success) {
                return {
                    success: false,
                    message: `Aborted: could not back up current data first. ${preBackup.message}`,
                };
            }
        }
        // 5) Close the current DB connection so the file is not locked on Windows
        closeDatabase();
        // 6) Copy the imported file over the current DB file
        fs.copyFileSync(srcPath, DB_PATH);
        console.log('Imported database from:', srcPath);
        // 7) Relaunch so the new DB is opened fresh, then quit this instance
        app.relaunch();
        app.exit(0);
        return {
            success: true,
            needsRestart: true,
            message: 'Data imported. App is restarting…',
        };
    }
    catch (error) {
        console.error('Import failed:', error);
        return {
            success: false,
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
