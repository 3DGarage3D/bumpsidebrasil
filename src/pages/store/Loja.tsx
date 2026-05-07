import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List, Search, Package } from "lucide-react";

type StoreProduct = {
  id: string;
  name: string;
  description: string;
  sale_price: number;
  stock: number;
  category_id: string | null;
};
type Cat = { id: string; name: string };

export default function Loja() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("products").select("id,name,description,sale_price,stock,category_id").order("name").then(({ data }) => {
      setProducts((data ?? []) as any);
    });
    supabase.from("categories").select("id,name").order("name").then(({ data }) => {
      setCats((data ?? []) as any);
    });
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return products.filter((p) => {
      if (cat && p.category_id !== cat) return false;
      if (s && !p.name.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [products, q, cat]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Drop / 2026
          </p>
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tight">
            Streetwear<br />
            <span className="italic font-light">made in Brasil.</span>
          </h1>
          <div className="mt-6 max-w-xl text-sm text-muted-foreground">
            Peças autorais, tiragem limitada. Cada item carimbado, numerado e enviado direto da nossa base.
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar peças..."
              className="pl-10 rounded-none border-foreground/20 focus-visible:border-foreground"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Chip active={cat === null} onClick={() => setCat(null)}>Todas</Chip>
            {cats.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>
            ))}
          </div>
          <div className="flex border border-foreground/20">
            <button
              onClick={() => setView("grid")}
              className={`p-2 ${view === "grid" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              aria-label="Grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              aria-label="Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Nenhuma peça encontrada
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {filtered.map((p) => <GridCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {filtered.map((p) => <ListRow key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({ active, children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] whitespace-nowrap border transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/20 text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Thumb({ name }: { name: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <div className="aspect-square w-full bg-secondary border border-foreground/10 flex items-center justify-center relative overflow-hidden group">
      <span className="font-serif text-6xl text-foreground/15 select-none">{initials || <Package className="h-12 w-12" />}</span>
      <div className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
        BPS / 26
      </div>
    </div>
  );
}

function GridCard({ p }: { p: StoreProduct }) {
  const out = p.stock <= 0;
  return (
    <div className="group">
      <div className="relative">
        <Thumb name={p.name} />
        {out && (
          <Badge variant="secondary" className="absolute top-2 right-2 rounded-none text-[9px] font-mono uppercase tracking-wider">
            Esgotado
          </Badge>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-tight line-clamp-2">{p.name}</h3>
      </div>
      <p className="mt-1 font-serif text-lg">{formatBRL(p.sale_price)}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full rounded-none border-foreground text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background"
        disabled={out}
      >
        {out ? "Indisponível" : "Reservar"}
      </Button>
    </div>
  );
}

function ListRow({ p }: { p: StoreProduct }) {
  const out = p.stock <= 0;
  const initials = p.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-20 w-20 shrink-0 bg-secondary border border-foreground/10 flex items-center justify-center">
        <span className="font-serif text-2xl text-foreground/20">{initials || "—"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium">{p.name}</h3>
        {p.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
          {out ? "Esgotado" : `${p.stock} disponíveis`}
        </p>
      </div>
      <p className="font-serif text-xl shrink-0">{formatBRL(p.sale_price)}</p>
      <Button
        variant="outline"
        size="sm"
        className="rounded-none border-foreground text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background hidden sm:inline-flex"
        disabled={out}
      >
        Reservar
      </Button>
    </div>
  );
}