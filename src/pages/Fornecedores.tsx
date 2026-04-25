import { useState } from "react";
import { Plus, Truck, Trash2, Pencil } from "lucide-react";
import { useSuppliers } from "@/hooks/useStorage";
import { storage, uid } from "@/lib/storage";
import type { Supplier } from "@/lib/types";
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
import { toast } from "sonner";

const empty = () => ({ name: "", contact: "", phone: "", email: "" });

export default function Fornecedores() {
  const suppliers = useSuppliers();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty());

  const openNew = () => {
    setEditing(null);
    setForm(empty());
    setOpen(true);
  };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email });
    setOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return toast.error("Informe o nome");
    const list = storage.getSuppliers();
    if (editing) {
      storage.setSuppliers(list.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
    } else {
      list.unshift({ ...form, id: uid(), createdAt: new Date().toISOString() });
      storage.setSuppliers(list);
    }
    toast.success("Salvo");
    setOpen(false);
  };
  const remove = (id: string) => {
    if (!confirm("Excluir?")) return;
    storage.setSuppliers(storage.getSuppliers().filter((s) => s.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Fornecedores"
        actions={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo fornecedor
          </Button>
        }
      />

      {suppliers.length === 0 ? (
        <Card className="shadow-elegant-sm">
          <EmptyState icon={Truck} title="Nenhum fornecedor" />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {suppliers.map((s) => (
            <Card key={s.id} className="p-4 shadow-elegant-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{s.name}</h3>
                  {s.contact && <p className="text-xs text-muted-foreground">{s.contact}</p>}
                  {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                  {s.email && <p className="text-xs text-muted-foreground truncate">{s.email}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Contato</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}