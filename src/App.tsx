import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Pedidos from "./pages/Pedidos";
import Clientes from "./pages/Clientes";
import Categorias from "./pages/Categorias";
import Fornecedores from "./pages/Fornecedores";
import Movimentacao from "./pages/Movimentacao";
import Relatorios from "./pages/Relatorios";
import Revendedores from "./pages/Revendedores";
import { StoreLayout } from "./components/StoreLayout";
import Loja from "./pages/store/Loja";
import Mapa from "./pages/store/Mapa";
import Cadastro from "./pages/store/Cadastro";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Public store */}
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Loja />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/cadastro" element={<Cadastro />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/produtos" element={<Produtos />} />
              <Route path="/admin/pedidos" element={<Pedidos />} />
              <Route path="/admin/clientes" element={<Clientes />} />
              <Route path="/admin/revendedores" element={<Revendedores />} />
              <Route path="/admin/categorias" element={<Categorias />} />
              <Route path="/admin/fornecedores" element={<Fornecedores />} />
              <Route path="/admin/movimentacao" element={<Movimentacao />} />
              <Route path="/admin/relatorios" element={<Relatorios />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
