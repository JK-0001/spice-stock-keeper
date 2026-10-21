import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Cold Storage API
    getColdStorages: () => ipcRenderer.invoke('db:getColdStorages'),
    addColdStorage: (data) => ipcRenderer.invoke('db:addColdStorage', data),
    // Inventory API
    getInventoryList: (filters) => ipcRenderer.invoke('db:getInventoryList', filters),
    getInventoryItem: (id) => ipcRenderer.invoke('db:getInventoryItem', id),
    addInventory: (data) => ipcRenderer.invoke('db:addInventory', data),
    updateInventory: (id, data) => ipcRenderer.invoke('db:updateInventory', id, data),
    deleteInventory: (id) => ipcRenderer.invoke('db:deleteInventory', id),
    // Outgoing API
    getOutgoingForInventory: (inventoryId) => ipcRenderer.invoke('db:getOutgoingForInventory', inventoryId),
    addOutgoing: (data) => ipcRenderer.invoke('db:addOutgoing', data),
    updateOutgoing: (id, data) => ipcRenderer.invoke('db:updateOutgoing', id, data),
    deleteOutgoing: (id) => ipcRenderer.invoke('db:deleteOutgoing', id),
    // Dashboard API
    getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
    // Backup API
    createBackup: () => ipcRenderer.invoke('backup:create'),
    createManualBackup: () => ipcRenderer.invoke('backup:createManual'),
    importDatabase: () => ipcRenderer.invoke('backup:importDatabase'),
    // Print API
    printPDF: (dataUrl, options) => ipcRenderer.invoke('print:pdf', dataUrl, options),
    // Sale Order API
    getSaleOrders: () => ipcRenderer.invoke('db:getSaleOrders'),
    getSaleOrder: (id) => ipcRenderer.invoke('db:getSaleOrder', id),
    addSaleOrder: (data) => ipcRenderer.invoke('db:addSaleOrder', data),
    updateSaleOrder: (id, data) => ipcRenderer.invoke('db:updateSaleOrder', id, data),
    deleteSaleOrder: (id) => ipcRenderer.invoke('db:deleteSaleOrder', id),
    // Builty API
    getBuiltyList: () => ipcRenderer.invoke('db:getBuiltyList'),
    getBuilty: (id) => ipcRenderer.invoke('db:getBuilty', id),
    addBuilty: (data) => ipcRenderer.invoke('db:addBuilty', data),
    updateBuilty: (id, data) => ipcRenderer.invoke('db:updateBuilty', id, data),
    deleteBuilty: (id) => ipcRenderer.invoke('db:deleteBuilty', id),
    // Autocomplete suggestions
    getPartySuggestions: () => ipcRenderer.invoke('db:getPartySuggestions'),
    getItemNameSuggestions: () => ipcRenderer.invoke('db:getItemNameSuggestions'),
    getMarkaSuggestions: () => ipcRenderer.invoke('db:getMarkaSuggestions'),
    // Excel master-list import
    importItemsMaster: (names) => ipcRenderer.invoke('db:importItemsMaster', names),
    importPartiesMaster: (names) => ipcRenderer.invoke('db:importPartiesMaster', names),
    // Items Master CRUD
    getItemsMaster: () => ipcRenderer.invoke('db:getItemsMaster'),
    getItemByName: (name) => ipcRenderer.invoke('db:getItemByName', name),
    addItemMaster: (data) => ipcRenderer.invoke('db:addItemMaster', data),
    updateItemMaster: (id, data) => ipcRenderer.invoke('db:updateItemMaster', id, data),
    deleteItemMaster: (id) => ipcRenderer.invoke('db:deleteItemMaster', id),
    // Parties Master CRUD
    getPartiesMaster: () => ipcRenderer.invoke('db:getPartiesMaster'),
    addPartyMaster: (data) => ipcRenderer.invoke('db:addPartyMaster', data),
    updatePartyMaster: (id, data) => ipcRenderer.invoke('db:updatePartyMaster', id, data),
    deletePartyMaster: (id) => ipcRenderer.invoke('db:deletePartyMaster', id),
    // App info + updates
    getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
    getUpdateState: () => ipcRenderer.invoke('update:getState'),
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    restartAndInstall: () => ipcRenderer.invoke('update:restartAndInstall'),
});
