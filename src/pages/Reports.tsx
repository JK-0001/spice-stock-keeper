import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBillingReports } from '@/hooks/useBillingReports';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ColdStorageSummaryTable } from '@/components/reports/ColdStorageSummaryTable';
import { ItemSummaryTable } from '@/components/reports/ItemSummaryTable';
import { DrilldownTable } from '@/components/reports/DrilldownTable';

export default function Reports() {
  const [filters, setFilters] = useState<{
    coldStorageId?: string;
    itemName?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  const { data, isLoading } = useBillingReports(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing Reports</h1>
        <p className="text-muted-foreground mt-1">
          View payable amounts by cold storage and item
        </p>
      </div>

      <ReportFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-6 bg-muted rounded w-48 mb-4" />
              <div className="h-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="cold-storage" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cold-storage" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Cold Storage-Wise
            </TabsTrigger>
            <TabsTrigger value="item-wise" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Item-Wise
            </TabsTrigger>
            <TabsTrigger value="drilldown" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Detailed Breakdown
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cold-storage">
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                <strong>View 1: Cold Storage-Wise Summary</strong> — See how much is payable to each cold storage, 
                grouped by items stored.
              </div>
              <ColdStorageSummaryTable 
                data={data?.coldStorageSummary || []} 
                grandTotal={data?.grandTotal || 0}
              />
            </div>
          </TabsContent>

          <TabsContent value="item-wise">
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                <strong>View 2: Item-Wise Payable</strong> — See total payable per item (lot-wise), 
                regardless of time period.
              </div>
              <ItemSummaryTable 
                data={data?.itemSummary || []} 
                grandTotal={data?.grandTotal || 0}
              />
            </div>
          </TabsContent>

          <TabsContent value="drilldown">
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                <strong>View 3: Detailed Breakdown</strong> — Audit-friendly hierarchical view: 
                Cold Storage → Item → Cycle rows. Click to expand.
              </div>
              <DrilldownTable 
                data={data?.drilldown || []} 
                grandTotal={data?.grandTotal || 0}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
