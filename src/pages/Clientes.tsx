import { useMemo, useState } from "react";
import { Plus, Users, Search, Pencil, Trash2, Loader2 } from "lucide-react";
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

const empty = () => ({
  name: "",
  document: "",
  email: "",
  phone: "",
  birthDate: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  address: "",
  notes: "",
});

const onlyDigits = (s: string) => s.replace(/\D/g, "");

const maskCPFCNPJ = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

const maskCEP = (v: string) =>
  onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export default function Clientes() {
  const customers = useCustomers();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(empty());
  const [cepLoading, setCepLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.document || "").includes(q),
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
      birthDate: c.birthDate || "",
      cep: c.cep || "",
      street: c.street || "",
      number: c.number || "",
      complement: c.complement || "",
      neighborhood: c.neighborhood || "",
      city: c.city || "",
      state: c.state || "",
      address: c.address || "",
      notes: c.notes || "",
    });
    setOpen(true);
  };

  const lookupCEP = async (cep: string) => {
    const d = onlyDigits(cep);
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
        complement: data.complemento || f.complement,
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome");
      return;
    }
    const composedAddress =
      [form.street, form.number, form.neighborhood, form.city, form.state]
        .filter(Boolean)
        .join(", ") || form.address;

    const payload = { ...form, address: composedAddress };

    const list = storage.getCustomers();
    if (editing) {
      await storage.setCustomers(
        list.map((c) => (c.id === editing.id ? { ...c, ...payload } : c)),
      );
      toast.success("Cliente atualizado");
    } else {
      list.unshift({
        ...payload,
        id: uid(),
        createdAt: new Date().toISOString(),
      } as Customer);
      await storage.setCustomers(list);
      toast.success("Cliente cadastrado");
    }
    setOpen(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    await storage.setCustomers(storage.getCustomers().filter((c) => c.id !== id));
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
          placeholder="Buscar por nome, email, telefone ou CPF..."
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                  {c.document && (
                    <p className="text-xs text-muted-foreground">{c.document}</p>
                  )}
                  {c.email && (
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  )}
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                  {(c.city || c.state) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[c.city, c.state].filter(Boolean).join(" / ")}
                      {c.cep ? ` • ${c.cep}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => remove(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Dados pessoais */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Dados pessoais
              </h4>
              <div className="grid gap-3">
                <div>
                  <Label>Nome completo *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CPF / CNPJ</Label>
                    <Input
                      value={form.document}
                      onChange={(e) =>
                        setForm({ ...form, document: maskCPFCNPJ(e.target.value) })
                      }
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>Data de nascimento</Label>
                    <Input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: maskPhone(e.target.value) })
                      }
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Endereço
              </h4>
              <div className="grid gap-3">
                <div className="grid grid-cols-[180px_1fr] gap-3">
                  <div>
                    <Label>CEP</Label>
                    <div className="relative">
                      <Input
                        value={form.cep}
                        onChange={(e) => {
                          const v = maskCEP(e.target.value);
                          setForm({ ...form, cep: v });
                          if (onlyDigits(v).length === 8) lookupCEP(v);
                        }}
                        placeholder="00000-000"
                      />
                      {cepLoading && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Logradouro</Label>
                    <Input
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <div>
                    <Label>Número</Label>
                    <Input
                      value={form.number}
                      onChange={(e) => setForm({ ...form, number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input
                      value={form.complement}
                      onChange={(e) =>
                        setForm({ ...form, complement: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={form.neighborhood}
                    onChange={(e) =>
                      setForm({ ...form, neighborhood: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-[1fr_100px] gap-3">
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input
                      maxLength={2}
                      value={form.state}
                      onChange={(e) =>
                        setForm({ ...form, state: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
