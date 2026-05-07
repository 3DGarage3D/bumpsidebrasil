import { useMemo } from "react";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react";
import { useProducts, useOrders, useCustomers } from "@/hooks/useStorage";
import { formatBRL } from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const products = useProducts();
  const orders = useOrders();
  const customers = useCustomers();

  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelado");
    const revenue = validOrders.reduce((s, o) => s + o.total, 0);
    const stockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
    const lowStock = products.filter((p) => p.stock <= p.minStock);
    return { revenue, stockValue, lowStock, totalProducts: products.length };
  }, [products, orders]);

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const k = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      days[k] = 0;
    }
    orders
      .filter((o) => o.status !== "cancelado")
      .forEach((o) => {
        const k = new Date(o.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        if (k in days) days[k] += o.total;
      });
    return Object.entries(days).map(([dia, total]) => ({ dia, total }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders
      .filter((o) => o.status !== "cancelado")
      .forEach((o) =>
        o.items.forEach((i) => {
          if (!counts[i.productId])
            counts[i.productId] = { name: i.productName, qty: 0, revenue: 0 };
          counts[i.productId].qty += i.quantity;
          counts[i.productId].revenue += i.subtotal;
        }),
      );
    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua loja em tempo real."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={DollarSign}
          label="Faturamento total"
          value={formatBRL(stats.revenue)}
          tone="primary"
        />
        <StatCard
          icon={Package}
          label="Valor em estoque"
          value={formatBRL(stats.stockValue)}
          tone="success"
        />
        <StatCard
          icon={ShoppingCart}
          label="Pedidos"
          value={orders.length.toString()}
          tone="primary"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={customers.length.toString()}
          tone="success"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 p-5 shadow-elegant-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Vendas dos últimos 7 dias</h3>
              <p className="text-xs text-muted-foreground">Faturamento por dia</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(v: number) => formatBRL(v)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-elegant-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Mais vendidos</h3>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda ainda.</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} unid.</p>
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    {formatBRL(p.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 shadow-elegant-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-foreground">Alertas de estoque baixo</h3>
          </div>
          <Badge variant="secondary">{stats.lowStock.length}</Badge>
        </div>
        {stats.lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tudo certo! Nenhum produto abaixo do mínimo.</p>
        ) : (
          <div className="space-y-2">
            {stats.lowStock.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                to="/admin/produtos"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                </div>
                <Badge variant="destructive">
                  {p.stock} / mín {p.minStock}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: "primary" | "success";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-accent text-accent-foreground"
      : "bg-success/10 text-success";
  return (
    <Card className="p-4 shadow-elegant-sm hover:shadow-elegant-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-foreground mt-1 truncate">{value}</p>
    </Card>
  );
}