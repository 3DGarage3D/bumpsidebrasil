import { useMemo, useState } from "react";
import { Plus, Users, Search, Pencil, Trash2 } from "lucide-react";
import { useCustomers } from "@/hooks/useStorage";
import { storage, uid } from "@/lib/storage";
import type { Customer } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const empty = () => ({ name: "", document: "", email: "", phone: "", address: "" });

export default function Clientes() {
  const customers = useCustomers();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(empty());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
  }, [customers, search]);

  const openNew = () => {
    setEditing(null);
    setForm(empty());
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      document: c.document,
      email: c.email,
      phone: c.phone,
      address: c.address,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome");
      return;
    }
    const list = storage.getCustomers();
    if (editing) {
      storage.setCustomers(list.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
      toast.success("Cliente atualizado");
    } else {
      list.unshift({ ...form, id: uid(), createdAt: new Date().toISOString() });
      storage.setCustomers(list);
      toast.success("Cliente cadastrado");
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    storage.setCustomers(storage.getCustomers().filter((c) => c.id !== id));
    toast.success("Cliente excluído");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Clientes"
        description="Cadastre seus clientes para vincular nos pedidos."
        actions={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-elegant-sm">
          <EmptyState icon={Users} title="Nenhum cliente cadastrado" />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4 shadow-elegant-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                  {c.document && <p className="text-xs text-muted-foreground">{c.document}</p>}
                  {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(c.id)}>
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
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CPF/CNPJ</Label>
                <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}