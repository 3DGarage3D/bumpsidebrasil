import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

type Reseller = {
  id: string;
  name: string;
  city: string;
  state: string;
  instagram: string | null;
};

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function Mapa() {
  const [list, setList] = useState<Reseller[]>([]);
  const [uf, setUf] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("resellers").select("id,name,city,state,instagram").order("state").then(({ data }) => {
      setList((data ?? []) as any);
    });
  }, []);

  const filtered = uf ? list.filter((r) => r.state === uf) : list;
  const grouped = filtered.reduce<Record<string, Reseller[]>>((acc, r) => {
    const k = r.state || "—";
    (acc[k] = acc[k] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <header className="border-b border-foreground pb-8 mb-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Onde encontrar / BR
        </p>
        <h1 className="font-serif text-4xl sm:text-6xl tracking-tight">Revendedores oficiais</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Por privacidade dos nossos parceiros, exibimos apenas <span className="text-foreground">cidade e estado</span>.
          Para endereço completo, fale diretamente com a revenda.
        </p>
      </header>

      {/* UF map */}
      <div className="mb-10">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setUf(null)}
            className={`px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] border ${
              uf === null ? "border-foreground bg-foreground text-background" : "border-foreground/20 text-muted-foreground hover:border-foreground"
            }`}
          >
            Brasil
          </button>
          {UFS.map((u) => {
            const has = list.some((r) => r.state === u);
            return (
              <button
                key={u}
                onClick={() => has && setUf(u)}
                disabled={!has}
                className={`w-10 h-10 text-[11px] font-mono uppercase border transition-colors ${
                  uf === u
                    ? "border-foreground bg-foreground text-background"
                    : has
                    ? "border-foreground/30 text-foreground hover:bg-foreground hover:text-background"
                    : "border-border text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                {u}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="py-24 text-center text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground border border-dashed border-border">
          Nenhum revendedor cadastrado{uf ? ` em ${uf}` : ""}
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([state, items]) => (
              <section key={state}>
                <h2 className="font-serif text-3xl mb-4 flex items-baseline gap-3">
                  {state}
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    {items.length} {items.length === 1 ? "ponto" : "pontos"}
                  </span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((r) => (
                    <article key={r.id} className="border border-foreground/15 p-5 hover:border-foreground transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-serif text-xl truncate">{r.name}</h3>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {r.city} / {r.state}
                          </p>
                        </div>
                      </div>
                      {r.instagram && (
                        <a
                          href={`https://instagram.com/${r.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block text-[10px] font-mono uppercase tracking-[0.2em] underline underline-offset-4"
                        >
                          @{r.instagram.replace("@", "")}
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}