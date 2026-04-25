import { useMemo, useState } from "react";
import { Plus, ShoppingCart, Search, Trash2, X } from "lucide-react";
import {
  useOrders,
  useProducts,
  useCustomers,
} from "@/hooks/useStorage";
import { storage, uid, formatBRL, formatDate } from "@/lib/storage";
import type { Order, OrderItem, OrderStatus, Product } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statusColors: Record<OrderStatus, string> = {
  pendente: "bg-warning/15 text-warning border-warning/30",
  pago: "bg-primary/10 text-primary border-primary/30",
  enviado: "bg-accent text-accent-foreground border-accent",
  entregue: "bg-success/15 text-success border-success/30",
  cancelado: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Pedidos() {
  const orders = useOrders();
  const products = useProducts();
  const customers = useCustomers();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("none");
  const [walkInName, setWalkInName] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productPick, setProductPick] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const total = useMemo(() => items.reduce((s, i) => s + i.subtotal, 0), [items]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter(
      (o) => o.customerName.toLowerCase().includes(q) || String(o.number).includes(q),
    );
  }, [orders, search]);

  const reset = () => {
    setCustomerId("none");
    setWalkInName("");
    setItems([]);
    setProductPick("");
    setQty(1);
    setNotes("");
  };

  const addItem = () => {
    const p = products.find((x) => x.id === productPick);
    if (!p) return;
    if (qty <= 0) return;
    if (qty > p.stock) {
      toast.error(`Estoque insuficiente. Disponível: ${p.stock}`);
      return;
    }
    const existing = items.find((i) => i.productId === p.id);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > p.stock) {
        toast.error(`Estoque insuficiente. Disponível: ${p.stock}`);
        return;
      }
      setItems(
        items.map((i) =>
          i.productId === p.id
            ? { ...i, quantity: newQty, subtotal: newQty * i.unitPrice }
            : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          productId: p.id,
          productName: p.name,
          quantity: qty,
          unitPrice: p.salePrice,
          subtotal: qty * p.salePrice,
        },
      ]);
    }
    setProductPick("");
    setQty(1);
  };

  const removeItem = (id: string) => setItems(items.filter((i) => i.productId !== id));

  const save = () => {
    if (items.length === 0) {
      toast.error("Adicione ao menos um produto");
      return;
    }
    const cust = customers.find((c) => c.id === customerId);
    const customerName = cust ? cust.name : walkInName.trim() || "Cliente avulso";

    // baixa de estoque
    const allProducts = storage.getProducts();
    const movements = storage.getMovements();
    const order: Order = {
      id: uid(),
      number: storage.nextOrderNumber(),
      customerId: cust?.id ?? null,
      customerName,
      items,
      total,
      status: "pendente",
      notes,
      createdAt: new Date().toISOString(),
    };

    items.forEach((it) => {
      const idx = allProducts.findIndex((p) => p.id === it.productId);
      if (idx >= 0) {
        allProducts[idx].stock = Math.max(0, allProducts[idx].stock - it.quantity);
        movements.unshift({
          id: uid(),
          productId: it.productId,
          productName: it.productName,
          type: "saida",
          quantity: it.quantity,
          reason: `Pedido #${order.number}`,
          orderId: order.id,
          createdAt: order.createdAt,
        });
      }
    });

    storage.setProducts(allProducts);
    storage.setMovements(movements);
    storage.setOrders([order, ...storage.getOrders()]);
    toast.success(`Pedido #${order.number} criado`);
    reset();
    setOpen(false);
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    const list = storage.getOrders();
    const order = list.find((o) => o.id === id);
    if (!order) return;

    // Se cancelando, devolve estoque
    if (status === "cancelado" && order.status !== "cancelado") {
      const all = storage.getProducts();
      const movs = storage.getMovements();
      order.items.forEach((it) => {
        const idx = all.findIndex((p) => p.id === it.productId);
        if (idx >= 0) {
          all[idx].stock += it.quantity;
          movs.unshift({
            id: uid(),
            productId: it.productId,
            productName: it.productName,
            type: "entrada",
            quantity: it.quantity,
            reason: `Cancelamento pedido #${order.number}`,
            orderId: order.id,
            createdAt: new Date().toISOString(),
          });
        }
      });
      storage.setProducts(all);
      storage.setMovements(movs);
    }
    storage.setOrders(list.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success("Status atualizado");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Pedidos"
        description="Lance pedidos e atualize o status. O estoque é atualizado automaticamente."
        actions={
          <Button
            onClick={() => {
              reset();
              setOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Novo pedido
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="shadow-elegant-sm">
          <EmptyState
            icon={ShoppingCart}
            title="Nenhum pedido lançado"
            description="Crie o primeiro pedido para começar a controlar suas vendas."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <Card key={o.id} className="p-4 shadow-elegant-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">Pedido #{o.number}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColors[o.status]}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-primary">{formatBRL(o.total)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
                <div className="text-xs text-muted-foreground space-y-1">
                  {o.items.map((it) => (
                    <div key={it.productId} className="flex justify-between">
                      <span>{it.quantity}× {it.productName}</span>
                      <span>{formatBRL(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                    <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo pedido</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div>
              <Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Cliente avulso</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customerId === "none" && (
                <Input
                  className="mt-2"
                  placeholder="Nome do cliente avulso (opcional)"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                />
              )}
            </div>

            <div className="border-t border-border pt-3">
              <Label>Adicionar produto</Label>
              <div className="flex gap-2 mt-1">
                <Select value={productPick} onValueChange={setProductPick}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {products.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Cadastre produtos primeiro
                      </div>
                    ) : (
                      products.map((p: Product) => (
                        <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} — {formatBRL(p.salePrice)} ({p.stock} un)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="number" min={1} className="w-20"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                />
                <Button type="button" onClick={addItem} disabled={!productPick}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="border border-border rounded-lg p-3 space-y-2">
                {items.map((it) => (
                  <div key={it.productId} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{it.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.quantity} × {formatBRL(it.unitPrice)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatBRL(it.subtotal)}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(it.productId)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatBRL(total)}</span>
                </div>
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}