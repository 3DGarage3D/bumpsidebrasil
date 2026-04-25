import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Printer, Package } from "lucide-react";
import { useProducts, useCategories, useSuppliers } from "@/hooks/useStorage";
import { storage, generateEAN13, generateSKU, uid, formatBRL } from "@/lib/storage";
import type { Product } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { BarcodeLabel } from "@/components/BarcodeLabel";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const empty = (): Omit<Product, "id" | "createdAt" | "updatedAt"> => ({
  sku: generateSKU(),
  barcode: generateEAN13(),
  name: "",
  description: "",
  categoryId: null,
  supplierId: null,
  costPrice: 0,
  salePrice: 0,
  stock: 0,
  minStock: 5,
});

export default function Produtos() {
  const products = useProducts();
  const categories = useCategories();
  const suppliers = useSuppliers();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty());
  const [printing, setPrinting] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q),
    );
  }, [products, search]);

  const openNew = () => {
    setEditing(null);
    setForm(empty());
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      description: p.description,
      categoryId: p.categoryId,
      supplierId: p.supplierId,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      stock: p.stock,
      minStock: p.minStock,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    const list = storage.getProducts();
    if (editing) {
      const updated = list.map((p) =>
        p.id === editing.id ? { ...p, ...form, updatedAt: new Date().toISOString() } : p,
      );
      storage.setProducts(updated);
      toast.success("Produto atualizado");
    } else {
      const now = new Date().toISOString();
      list.unshift({ ...form, id: uid(), createdAt: now, updatedAt: now });
      storage.setProducts(list);
      toast.success("Produto cadastrado");
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    storage.setProducts(storage.getProducts().filter((p) => p.id !== id));
    toast.success("Produto excluído");
  };

  const printLabel = (p: Product) => {
    setPrinting(p);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(null), 500);
    }, 200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Produtos"
        description="Cadastre produtos com SKU, código de barras EAN-13 e QR Code automáticos."
        actions={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, SKU ou código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-elegant-sm">
          <EmptyState
            icon={Package}
            title={products.length === 0 ? "Nenhum produto cadastrado" : "Nada encontrado"}
            description={
              products.length === 0
                ? "Comece cadastrando o primeiro produto da sua loja."
                : "Tente outra busca."
            }
            action={
              products.length === 0 && (
                <Button onClick={openNew} className="gap-2">
                  <Plus className="h-4 w-4" /> Cadastrar produto
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            const low = p.stock <= p.minStock;
            return (
              <Card key={p.id} className="p-4 shadow-elegant-sm hover:shadow-elegant-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">SKU {p.sku}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{p.barcode}</p>
                  </div>
                  {cat && <Badge variant="secondary" className="shrink-0">{cat.name}</Badge>}
                </div>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Preço</p>
                    <p className="text-lg font-bold text-primary">{formatBRL(p.salePrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Estoque</p>
                    <Badge variant={low ? "destructive" : "secondary"}>
                      {p.stock} un
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                  <Button size="sm" variant="ghost" className="flex-1 gap-1" onClick={() => printLabel(p)}>
                    <Printer className="h-3.5 w-3.5" /> Etiqueta
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <Label>Cód. Barras (EAN-13)</Label>
                <div className="flex gap-1">
                  <Input
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({ ...form, barcode: generateEAN13() })}
                  >
                    Gerar
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={form.categoryId ?? "none"}
                  onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? null : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Select
                  value={form.supplierId ?? "none"}
                  onValueChange={(v) => setForm({ ...form, supplierId: v === "none" ? null : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem fornecedor</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço de custo</Label>
                <Input
                  type="number" step="0.01" min={0}
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Preço de venda</Label>
                <Input
                  type="number" step="0.01" min={0}
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estoque atual</Label>
                <Input
                  type="number" min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Estoque mínimo</Label>
                <Input
                  type="number" min={0}
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {printing && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-50">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <BarcodeLabel key={i} product={printing} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}