import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Reseller = {
  id: string;
  name: string;
  city: string;
  state: string;
  instagram: string;
  whatsapp: string;
};

const empty = () => ({ name: "", city: "", state: "", instagram: "", whatsapp: "" });

export default function Revendedores() {
  const [list, setList] = useState<Reseller[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reseller | null>(null);
  const [form, setForm] = useState(empty());

  const load = async () => {
    const { data } = await supabase.from("resellers").select("*").order("state").order("name");
    setList((data ?? []) as any);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q),
    );
  }, [list, search]);

  const openNew = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (r: Reseller) => {
    setEditing(r);
    setForm({ name: r.name, city: r.city, state: r.state, instagram: r.instagram || "", whatsapp: r.whatsapp || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error("Nome, cidade e UF são obrigatórios");
      return;
    }
    const payload = { ...form, state: form.state.toUpperCase() };
    if (editing) {
      await supabase.from("resellers").update(payload).eq("id", editing.id);
      toast.success("Revendedor atualizado");
    } else {
      await supabase.from("resellers").insert(payload);
      toast.success("Revendedor cadastrado");
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este revendedor?")) return;
    await supabase.from("resellers").delete().eq("id", id);
    toast.success("Revendedor excluído");
    load();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Revendedores"
        description="Pontos de venda exibidos publicamente no mapa (apenas cidade/estado)."
        actions={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo revendedor
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={MapPin} title="Nenhum revendedor cadastrado" /></Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4 hover:bg-accent/40">
              <div className="h-12 w-12 shrink-0 border border-foreground/20 flex items-center justify-center font-mono text-sm">
                {r.state}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{r.name}</h3>
                <p className="text-xs text-muted-foreground">{r.city} / {r.state}{r.instagram ? ` • @${r.instagram.replace("@","")}` : ""}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} revendedor</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div><Label>Cidade *</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>UF *</Label><Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
            </div>
            <div><Label>Instagram</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" /></div>
            <div><Label>WhatsApp (interno)</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
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