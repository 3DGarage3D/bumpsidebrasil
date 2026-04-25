import { useMemo } from "react";
import { useOrders, useProducts } from "@/hooks/useStorage";
import { formatBRL } from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export default function Relatorios() {
  const orders = useOrders();
  const products = useProducts();

  const monthly = useMemo(() => {
    const map: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toLocaleDateString("pt-BR", { month: "short" });
      map[k] = 0;
    }
    orders
      .filter((o) => o.status !== "cancelado")
      .forEach((o) => {
        const d = new Date(o.createdAt);
        const k = d.toLocaleDateString("pt-BR", { month: "short" });
        if (k in map) map[k] += o.total;
      });
    return Object.entries(map).map(([mes, total]) => ({ mes, total }));
  }, [orders]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const totals = useMemo(() => {
    const valid = orders.filter((o) => o.status !== "cancelado");
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const cost = valid.reduce(
      (s, o) =>
        s +
        o.items.reduce((ss, it) => {
          const p = products.find((x) => x.id === it.productId);
          return ss + (p?.costPrice ?? 0) * it.quantity;
        }, 0),
      0,
    );
    return { revenue, cost, profit: revenue - cost };
  }, [orders, products]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Relatórios" description="Análise de vendas e desempenho." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4 shadow-elegant-sm">
          <p className="text-xs text-muted-foreground">Receita</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatBRL(totals.revenue)}</p>
        </Card>
        <Card className="p-4 shadow-elegant-sm">
          <p className="text-xs text-muted-foreground">Custo dos produtos vendidos</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatBRL(totals.cost)}</p>
        </Card>
        <Card className="p-4 shadow-elegant-sm bg-gradient-primary text-primary-foreground">
          <p className="text-xs opacity-90">Lucro bruto estimado</p>
          <p className="text-xl font-bold mt-1">{formatBRL(totals.profit)}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 shadow-elegant-sm">
          <h3 className="font-semibold mb-4">Faturamento mensal (últimos 6 meses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(v: number) => formatBRL(v)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-elegant-sm">
          <h3 className="font-semibold mb-4">Pedidos por status</h3>
          <div className="h-64">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Sem pedidos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}