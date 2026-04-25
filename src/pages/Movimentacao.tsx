import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, History, Plus } from "lucide-react";
import { useMovements, useProducts } from "@/hooks/useStorage";
import { storage, uid, formatDate } from "@/lib/storage";
import type { MovementType } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function Movimentacao() {
  const movements = useMovements();
  const products = useProducts();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<MovementType>("entrada");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");

  const sorted = useMemo(
    () => [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [movements],
  );

  const save = () => {
    const p = products.find((x) => x.id === productId);
    if (!p) return toast.error("Selecione um produto");
    if (qty <= 0) return toast.error("Quantidade inválida");

    const all = storage.getProducts();
    const idx = all.findIndex((x) => x.id === p.id);
    let newStock = all[idx].stock;
    if (type === "entrada") newStock += qty;
    else if (type === "saida") newStock = Math.max(0, newStock - qty);
    else newStock = qty; // ajuste = define valor absoluto

    all[idx].stock = newStock;
    storage.setProducts(all);

    storage.setMovements([
      {
        id: uid(),
        productId: p.id,
        productName: p.name,
        type,
        quantity: qty,
        reason: reason || (type === "entrada" ? "Entrada manual" : type === "saida" ? "Saída manual" : "Ajuste"),
        createdAt: new Date().toISOString(),
      },
      ...storage.getMovements(),
    ]);

    toast.success("Movimentação registrada");
    setOpen(false);
    setProductId("");
    setQty(1);
    setReason("");
    setType("entrada");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Movimentação de estoque"
        description="Histórico de entradas, saídas e ajustes."
        actions={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova movimentação
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <Card className="shadow-elegant-sm">
          <EmptyState icon={History} title="Nenhuma movimentação ainda" />
        </Card>
      ) : (
        <Card className="divide-y divide-border shadow-elegant-sm">
          {sorted.map((m) => {
            const isIn = m.type === "entrada";
            const isAdj = m.type === "ajuste";
            return (
              <div key={m.id} className="flex items-center gap-3 p-3">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isIn
                      ? "bg-success/10 text-success"
                      : isAdj
                      ? "bg-accent text-accent-foreground"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {isIn ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.productName}</p>
                  <p className="text-xs text-muted-foreground">{m.reason}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(m.createdAt)}</p>
                </div>
                <div className={`text-sm font-bold ${isIn ? "text-success" : isAdj ? "text-foreground" : "text-destructive"}`}>
                  {isAdj ? "=" : isIn ? "+" : "-"}
                  {m.quantity}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova movimentação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Produto *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (estoque: {p.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste (define valor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number" min={1}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div>
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: compra, perda, conferência..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}