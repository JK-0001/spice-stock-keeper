import { useQuery } from '@tanstack/react-query';
import { calculateBillingCycles } from '@/lib/billing-cycles';

// Electron API wrapper
const db = window.electronAPI;

export interface AggregatedCycleData {
  inventoryId: string;
  itemName: string;
  coldStorageName: string;
  coldStorageId: string | null;
  lotNumber: string | null;
  partyName: string;
  status: string;
  cycleNumber: number;
  startDate: Date;
  endDate: Date;
  openingQuantity: number;
  rate: number;
  storageCharge: number;
  isFinal: boolean;
}

export interface ColdStorageSummary {
  coldStorageId: string;
  coldStorageName: string;
  items: {
    itemName: string;
    inventoryId: string;
    lotNumber: string | null;
    totalCycles: number;
    totalAmount: number;
  }[];
  totalPayable: number;
}

export interface ItemSummary {
  itemName: string;
  inventoryId: string;
  lotNumber: string | null;
  coldStorageName: string;
  coldStorageId: string | null;
  totalCycles: number;
  totalAmount: number;
}

export interface ColdStorageDrilldown {
  coldStorageId: string;
  coldStorageName: string;
  items: {
    itemName: string;
    inventoryId: string;
    lotNumber: string | null;
    cycles: AggregatedCycleData[];
    itemTotal: number;
  }[];
  grandTotal: number;
}

export function useBillingReports(filters?: {
  coldStorageId?: string;
  itemName?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ['billing-reports', filters],
    queryFn: async () => {
      // Fetch inventory with filters
      const inventory = await db.getInventoryList({
        cold_storage_id: filters?.coldStorageId,
        item_name: filters?.itemName,
        status: filters?.status as 'Active' | 'Completed' | undefined,
      });

      // Get all outgoing records for all inventory items
      const outgoingPromises = inventory.map(item =>
        db.getOutgoingForInventory(item.id)
      );
      const allOutgoingArrays = await Promise.all(outgoingPromises);
      const allOutgoing = allOutgoingArrays.flat();

      // Generate all billing cycles for all items
      const allCycles: AggregatedCycleData[] = [];

      inventory.forEach(item => {
        const itemOutgoing = allOutgoing.filter(o => o.inventory_id === item.id) || [];
        const cycles = calculateBillingCycles(
          item.cold_storage_date,
          Number(item.quantity_total),
          Number(item.cold_rate),
          itemOutgoing
        );

        cycles.forEach(cycle => {
          // Apply date filter if provided
          if (filters?.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            if (cycle.startDate < fromDate) return;
          }
          if (filters?.dateTo) {
            const toDate = new Date(filters.dateTo);
            if (cycle.startDate > toDate) return;
          }

          allCycles.push({
            inventoryId: item.id,
            itemName: item.item_name,
            coldStorageName: item.cold_storages?.cold_storage_name || 'Unassigned',
            coldStorageId: item.cold_storage_id,
            lotNumber: item.lot_number,
            partyName: item.party_name,
            status: item.status,
            cycleNumber: cycle.cycleNumber,
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            openingQuantity: cycle.openingQuantity,
            rate: cycle.rate,
            storageCharge: cycle.storageCharge,
            isFinal: cycle.isFinal,
          });
        });
      });

      // View 1: Cold Storage-Wise Summary
      const coldStorageSummaryMap = new Map<string, ColdStorageSummary>();
      
      allCycles.forEach(cycle => {
        const key = cycle.coldStorageId || 'unassigned';
        if (!coldStorageSummaryMap.has(key)) {
          coldStorageSummaryMap.set(key, {
            coldStorageId: key,
            coldStorageName: cycle.coldStorageName,
            items: [],
            totalPayable: 0,
          });
        }
        
        const summary = coldStorageSummaryMap.get(key)!;
        let itemEntry = summary.items.find(i => i.inventoryId === cycle.inventoryId);
        
        if (!itemEntry) {
          itemEntry = {
            itemName: cycle.itemName,
            inventoryId: cycle.inventoryId,
            lotNumber: cycle.lotNumber,
            totalCycles: 0,
            totalAmount: 0,
          };
          summary.items.push(itemEntry);
        }
        
        itemEntry.totalCycles += 1;
        itemEntry.totalAmount += cycle.storageCharge;
        summary.totalPayable += cycle.storageCharge;
      });

      const coldStorageSummary = Array.from(coldStorageSummaryMap.values())
        .sort((a, b) => a.coldStorageName.localeCompare(b.coldStorageName));

      // View 2: Item-Wise Summary
      const itemSummaryMap = new Map<string, ItemSummary>();
      
      allCycles.forEach(cycle => {
        const key = cycle.inventoryId;
        if (!itemSummaryMap.has(key)) {
          itemSummaryMap.set(key, {
            itemName: cycle.itemName,
            inventoryId: cycle.inventoryId,
            lotNumber: cycle.lotNumber,
            coldStorageName: cycle.coldStorageName,
            coldStorageId: cycle.coldStorageId,
            totalCycles: 0,
            totalAmount: 0,
          });
        }
        
        const summary = itemSummaryMap.get(key)!;
        summary.totalCycles += 1;
        summary.totalAmount += cycle.storageCharge;
      });

      const itemSummary = Array.from(itemSummaryMap.values())
        .sort((a, b) => a.itemName.localeCompare(b.itemName));

      // View 3: Cold Storage → Item Breakdown (Drilldown)
      const drilldownMap = new Map<string, ColdStorageDrilldown>();
      
      allCycles.forEach(cycle => {
        const csKey = cycle.coldStorageId || 'unassigned';
        if (!drilldownMap.has(csKey)) {
          drilldownMap.set(csKey, {
            coldStorageId: csKey,
            coldStorageName: cycle.coldStorageName,
            items: [],
            grandTotal: 0,
          });
        }
        
        const drilldown = drilldownMap.get(csKey)!;
        let itemEntry = drilldown.items.find(i => i.inventoryId === cycle.inventoryId);
        
        if (!itemEntry) {
          itemEntry = {
            itemName: cycle.itemName,
            inventoryId: cycle.inventoryId,
            lotNumber: cycle.lotNumber,
            cycles: [],
            itemTotal: 0,
          };
          drilldown.items.push(itemEntry);
        }
        
        itemEntry.cycles.push(cycle);
        itemEntry.itemTotal += cycle.storageCharge;
        drilldown.grandTotal += cycle.storageCharge;
      });

      // Sort cycles within each item
      drilldownMap.forEach(drilldown => {
        drilldown.items.forEach(item => {
          item.cycles.sort((a, b) => a.cycleNumber - b.cycleNumber);
        });
        drilldown.items.sort((a, b) => a.itemName.localeCompare(b.itemName));
      });

      const drilldown = Array.from(drilldownMap.values())
        .sort((a, b) => a.coldStorageName.localeCompare(b.coldStorageName));

      // Calculate totals
      const grandTotal = allCycles.reduce((sum, c) => sum + c.storageCharge, 0);

      return {
        allCycles,
        coldStorageSummary,
        itemSummary,
        drilldown,
        grandTotal,
      };
    },
  });
}
