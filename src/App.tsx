import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
// import Index from "./pages/Index";
import InventoryList from "./pages/InventoryList";
import InventoryDetail from "./pages/InventoryDetail";
import ColdStorages from "./pages/ColdStorages";
import Reports from "./pages/Reports";
import SaleOrders from "./pages/SaleOrders";
import Builty from "./pages/Builty";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          {/* <Route path="/" element={<AppLayout><Index /></AppLayout>} /> */}
          <Route path="/" element={<AppLayout><InventoryList /></AppLayout>} />
          <Route path="/inventory/:id" element={<AppLayout><InventoryDetail /></AppLayout>} />
          <Route path="/cold-storages" element={<AppLayout><ColdStorages /></AppLayout>} />
          <Route path="/sale-orders" element={<AppLayout><SaleOrders /></AppLayout>} />
          <Route path="/builty" element={<AppLayout><Builty /></AppLayout>} />
          <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
          <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
