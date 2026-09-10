import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isWithinInterval, startOfDay } from 'date-fns';
import { ChevronDown, ChevronRight, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ColdStorageDrilldown, AggregatedCycleData } from '@/hooks/useBillingReports';

interface DrilldownTableProps {
  data: ColdStorageDrilldown[];
  grandTotal: number;
}

function isCurrentCycle(cycle: AggregatedCycleData): boolean {
  const today = startOfDay(new Date());
  return isWithinInterval(today, { start: cycle.startDate, end: cycle.endDate });
}

export function DrilldownTable({ data, grandTotal }: DrilldownTableProps) {
  const [expandedStorages, setExpandedStorages] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleStorage = (id: string) => {
    const next = new Set(expandedStorages);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedStorages(next);
  };

  const toggleItem = (id: string) => {
    const next = new Set(expandedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedItems(next);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Warehouse className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No billing data found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(cs => {
        const isStorageExpanded = expandedStorages.has(cs.coldStorageId);
        
        return (
          <div key={cs.coldStorageId} className="stat-card">
            {/* Cold Storage Header */}
            <button
              onClick={() => toggleStorage(cs.coldStorageId)}
              className="w-full flex items-center gap-3 text-left hover:bg-muted/50 -m-4 p-4 rounded-lg transition-colors"
            >
              {isStorageExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="p-2 rounded-lg bg-primary/10">
                <Warehouse className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{cs.coldStorageName}</h3>
                <p className="text-sm text-muted-foreground">
                  {cs.items.length} item(s) • ₹{cs.grandTotal.toLocaleString()} total
                </p>
              </div>
              <span className="text-lg font-bold text-primary tabular-nums">
                ₹{cs.grandTotal.toLocaleString()}
              </span>
            </button>

            {/* Expanded Items */}
            {isStorageExpanded && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {cs.items.map(item => {
                  const itemKey = `${cs.coldStorageId}-${item.inventoryId}`;
                  const isItemExpanded = expandedItems.has(itemKey);

                  return (
                    <div key={item.inventoryId} className="border border-border rounded-lg">
                      {/* Item Header */}
                      <button
                        onClick={() => toggleItem(itemKey)}
                        className="w-full flex items-center gap-3 text-left hover:bg-muted/30 p-3 transition-colors"
                      >
                        {isItemExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/inventory/${item.inventoryId}`}
                            className="font-medium text-primary hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            {item.itemName}
                          </Link>
                          {item.lotNumber && (
                            <span className="text-sm text-muted-foreground ml-2">
                              (Lot: {item.lotNumber})
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.cycles.length} cycles
                        </span>
                        <span className="font-semibold text-foreground tabular-nums">
                          ₹{item.itemTotal.toLocaleString()}
                        </span>
                      </button>

                      {/* Cycle Rows */}
                      {isItemExpanded && (
                        <div className="border-t border-border">
                          <table className="data-table text-sm">
                            <thead>
                              <tr>
                                <th>Cycle</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th className="text-right">Opening Qty</th>
                                <th className="text-right">Rate (₹)</th>
                                <th className="text-right">Charge (₹)</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.cycles.map(cycle => {
                                const isCurrent = isCurrentCycle(cycle);
                                return (
                                  <tr 
                                    key={cycle.cycleNumber}
                                    className={cn(
                                      isCurrent && "bg-primary/10"
                                    )}
                                  >
                                    <td className="font-medium">
                                      {cycle.cycleNumber}
                                      {isCurrent && (
                                        <span className="ml-1 text-xs text-primary">← NOW</span>
                                      )}
                                    </td>
                                    <td>{format(cycle.startDate, 'dd MMM yyyy')}</td>
                                    <td>{format(cycle.endDate, 'dd MMM yyyy')}</td>
                                    <td className="text-right tabular-nums">{cycle.openingQuantity}</td>
                                    <td className="text-right tabular-nums">{cycle.rate}</td>
                                    <td className="text-right tabular-nums font-medium">
                                      {cycle.storageCharge.toLocaleString()}
                                    </td>
                                    <td>
                                      {cycle.isFinal ? (
                                        <Badge variant="secondary" className="text-xs">Final</Badge>
                                      ) : isCurrent ? (
                                        <Badge className="bg-primary text-primary-foreground text-xs">Current</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">Done</Badge>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-muted/50">
                                <td colSpan={5} className="text-right font-semibold">
                                  Item Total:
                                </td>
                                <td className="text-right tabular-nums font-bold text-primary">
                                  ₹{item.itemTotal.toLocaleString()}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Cold Storage Total */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-foreground">
                    {cs.coldStorageName} Total:
                  </span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    ₹{cs.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Grand Total */}
      <div className="stat-card bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground text-lg">
            Grand Total (All Cold Storages):
          </span>
          <span className="text-2xl font-bold text-primary tabular-nums">
            ₹{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
