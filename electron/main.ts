import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateElectronApp } from 'update-electron-app';

// Handle Squirrel install/update/uninstall lifecycle events. When the Squirrel
// installer runs the app with --squirrel-install / --squirrel-updated /
// --squirrel-uninstall / --squirrel-obsolete, this call creates or removes
// the Start Menu and Desktop shortcuts and then quits the app so Squirrel
// can finish. Without this, no shortcuts get created on install.
// MUST run before any other app logic.
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

import { initDatabase } from './database/migrations';
import { closeDatabase } from './database/db';
import * as handlers from './database/handlers';
import {
  createBackup,
  createManualBackup,
  checkAndCreateBackupOnStartup,
  startPeriodicBackup,
  stopPeriodicBackup,
  createBackupOnClose,
  importDatabase,
} from './database/backup';

// Auto-update from GitHub Releases via update.electronjs.org (free service).
// Only runs in packaged builds; a no-op in `npm run start` dev mode.
// Requires the app to be installed via the Squirrel Setup.exe (not portable zip).
if (app.isPackaged) {
  try {
    updateElectronApp({ updateInterval: '1 hour' });
  } catch (err) {
    console.error('Auto-updater failed to start:', err);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On some Windows machines the Electron sandbox kills the child (renderer/GPU)
// processes on launch — they exit with code -1073741515 (STATUS_DLL_NOT_FOUND)
// and the window never appears. Disabling the sandbox makes the packaged app
// launch reliably across client machines. This is a local, offline, single-user
// desktop app, so the reduced sandbox isolation is an acceptable trade-off.
app.commandLine.appendSwitch('no-sandbox');

// Force software rendering so the app does not depend on the client machine's
// GPU drivers (avoids GPU-process crashes on varied hardware).
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'SpiceIn',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow?.show();
    mainWindow?.focus();
  });

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading from dev server:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    // When packaged, __dirname is inside app.asar/dist-electron
    const indexPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html')
      : path.join(__dirname, '../dist/index.html');

    console.log('Loading index from:', indexPath);

    // For HashRouter to work in Electron, we need to use loadURL with file:// protocol
    // and append #/ to trigger the hash routing
    const url = require('url').format({
      protocol: 'file',
      pathname: indexPath,
      slashes: true,
      hash: '/'
    });

    console.log('Loading URL:', url);
    mainWindow.loadURL(url);
  }

  // Log any errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize database and register IPC handlers
app.on('ready', () => {
  console.log('Electron app ready');

  // Initialize database
  initDatabase();

  // Create the main window
  createWindow();

  // Register all IPC handlers for database operations

  // Cold Storage handlers
  ipcMain.handle('db:getColdStorages', () => {
    return handlers.getColdStorages();
  });

  ipcMain.handle('db:addColdStorage', (_, data) => {
    return handlers.addColdStorage(data);
  });

  // Inventory handlers
  ipcMain.handle('db:getInventoryList', (_, filters) => {
    return handlers.getInventoryList(filters);
  });

  ipcMain.handle('db:getInventoryItem', (_, id) => {
    return handlers.getInventoryItem(id);
  });

  ipcMain.handle('db:addInventory', (_, data) => {
    return handlers.addInventory(data);
  });

  ipcMain.handle('db:updateInventory', (_, id, data) => {
    return handlers.updateInventory(id, data);
  });

  ipcMain.handle('db:deleteInventory', (_, id) => {
    return handlers.deleteInventory(id);
  });

  // Outgoing handlers
  ipcMain.handle('db:getOutgoingForInventory', (_, inventoryId) => {
    return handlers.getOutgoingForInventory(inventoryId);
  });

  ipcMain.handle('db:addOutgoing', (_, data) => {
    return handlers.addOutgoing(data);
  });

  ipcMain.handle('db:updateOutgoing', (_, id, data) => {
    return handlers.updateOutgoing(id, data);
  });

  ipcMain.handle('db:deleteOutgoing', (_, id) => {
    return handlers.deleteOutgoing(id);
  });

  // Dashboard handlers
  ipcMain.handle('db:getDashboardStats', () => {
    return handlers.getDashboardStats();
  });

  // Sale Order handlers
  ipcMain.handle('db:getSaleOrders', () => handlers.getSaleOrders());
  ipcMain.handle('db:getSaleOrder', (_, id) => handlers.getSaleOrder(id));
  ipcMain.handle('db:addSaleOrder', (_, data) => handlers.addSaleOrder(data));
  ipcMain.handle('db:updateSaleOrder', (_, id, data) => handlers.updateSaleOrder(id, data));
  ipcMain.handle('db:deleteSaleOrder', (_, id) => handlers.deleteSaleOrder(id));

  // Builty handlers
  ipcMain.handle('db:getBuiltyList', () => handlers.getBuiltyList());
  ipcMain.handle('db:getBuilty', (_, id) => handlers.getBuilty(id));
  ipcMain.handle('db:addBuilty', (_, data) => handlers.addBuilty(data));
  ipcMain.handle('db:updateBuilty', (_, id, data) => handlers.updateBuilty(id, data));
  ipcMain.handle('db:deleteBuilty', (_, id) => handlers.deleteBuilty(id));

  // Autocomplete suggestion handlers
  ipcMain.handle('db:getPartySuggestions', () => handlers.getPartySuggestions());
  ipcMain.handle('db:getItemNameSuggestions', () => handlers.getItemNameSuggestions());
  ipcMain.handle('db:getMarkaSuggestions', () => handlers.getMarkaSuggestions());

  // Backup handlers
  ipcMain.handle('backup:create', () => {
    return createBackup();
  });

  ipcMain.handle('backup:createManual', async () => {
    return await createManualBackup();
  });

  ipcMain.handle('backup:importDatabase', async () => {
    return await importDatabase();
  });

  // Print PDF handler - opens PDF in a preview window with built-in Print/Save buttons
  ipcMain.handle('print:pdf', (_, dataUrl: string) => {
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      const printWindow = new BrowserWindow({
        show: true,
        width: 900,
        height: 700,
        title: 'SpiceIn - Print Preview',
        modal: true,
        parent: mainWindow ?? undefined,
        resizable: true,
      });

      printWindow.loadURL(dataUrl);

      printWindow.on('closed', () => {
        resolve({ success: true, message: 'Preview closed' });
      });
    });
  });

  // Hybrid backup system:
  // 1. Check and create backup on startup if last backup is > 24 hours old
  console.log('Checking for startup backup...');
  checkAndCreateBackupOnStartup();

  // 2. Start periodic backups every 6 hours while app is running
  startPeriodicBackup();
});

app.on('window-all-closed', () => {
  // 3. Create backup on app close
  createBackupOnClose();

  // Stop periodic backups
  stopPeriodicBackup();

  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Clean up on app quit
app.on('before-quit', () => {
  console.log('App quitting, creating final backup...');
  // Create final backup before quit
  createBackupOnClose();

  // Stop periodic backups
  stopPeriodicBackup();

  closeDatabase();
});
