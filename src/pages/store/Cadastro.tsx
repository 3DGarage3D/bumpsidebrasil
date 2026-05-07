import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const maskCPF = (v: string) =>
  onlyDigits(v).slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};
const maskCEP = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export default function Cadastro() {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [f, setF] = useState({
    name: "", document: "", email: "", phone: "", birthDate: "",
    cep: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
  });

  const lookup = async (cep: string) => {
    const d = onlyDigits(cep);
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await r.json();
      if (!data.erro) {
        setF((x) => ({ ...x,
          street: data.logradouro || x.street,
          neighborhood: data.bairro || x.neighborhood,
          city: data.localidade || x.city,
          state: data.uf || x.state,
        }));
      }
    } finally { setCepLoading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    setLoading(true);
    const address = [f.street, f.number, f.neighborhood, f.city, f.state].filter(Boolean).join(", ");
    const { error } = await supabase.from("customers").insert({
      name: f.name, document: f.document, email: f.email, phone: f.phone,
      birth_date: f.birthDate || null, cep: f.cep, street: f.street, number: f.number,
      complement: f.complement, neighborhood: f.neighborhood, city: f.city, state: f.state,
      address,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao cadastrar. Tente novamente.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 border border-foreground mb-6">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-4xl mb-3">Cadastro concluído</h1>
        <p className="text-sm text-muted-foreground">
          Você está na nossa lista. Em breve receberá novidades dos próximos drops.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <header className="border-b border-foreground pb-8 mb-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Membership
        </p>
        <h1 className="font-serif text-4xl sm:text-6xl tracking-tight">Cadastre-se</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-md">
          Preencha seus dados para acompanhar drops, reservas e ofertas exclusivas.
        </p>
      </header>

      <form onSubmit={submit} className="grid gap-5">
        <Section title="Dados pessoais">
          <Field label="Nome completo *">
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required className="rounded-none border-foreground/30" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="CPF">
              <Input value={f.document} onChange={(e) => setF({ ...f, document: maskCPF(e.target.value) })} placeholder="000.000.000-00" className="rounded-none border-foreground/30" />
            </Field>
            <Field label="Nascimento">
              <Input type="date" value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })} className="rounded-none border-foreground/30" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email *">
              <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required className="rounded-none border-foreground/30" />
            </Field>
            <Field label="Telefone">
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" className="rounded-none border-foreground/30" />
            </Field>
          </div>
        </Section>

        <Section title="Endereço">
          <div className="grid sm:grid-cols-[180px_1fr] gap-4">
            <Field label="CEP">
              <div className="relative">
                <Input
                  value={f.cep}
                  onChange={(e) => {
                    const v = maskCEP(e.target.value);
                    setF({ ...f, cep: v });
                    if (onlyDigits(v).length === 8) lookup(v);
                  }}
                  placeholder="00000-000"
                  className="rounded-none border-foreground/30"
                />
                {cepLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
              </div>
            </Field>
            <Field label="Logradouro">
              <Input value={f.street} onChange={(e) => setF({ ...f, street: e.target.value })} className="rounded-none border-foreground/30" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-[120px_1fr] gap-4">
            <Field label="Número">
              <Input value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} className="rounded-none border-foreground/30" />
            </Field>
            <Field label="Complemento">
              <Input value={f.complement} onChange={(e) => setF({ ...f, complement: e.target.value })} className="rounded-none border-foreground/30" />
            </Field>
          </div>
          <Field label="Bairro">
            <Input value={f.neighborhood} onChange={(e) => setF({ ...f, neighborhood: e.target.value })} className="rounded-none border-foreground/30" />
          </Field>
          <div className="grid grid-cols-[1fr_100px] gap-4">
            <Field label="Cidade">
              <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className="rounded-none border-foreground/30" />
            </Field>
            <Field label="UF">
              <Input maxLength={2} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value.toUpperCase() })} className="rounded-none border-foreground/30" />
            </Field>
          </div>
        </Section>

        <Button
          type="submit"
          disabled={loading}
          className="rounded-none bg-foreground text-background hover:bg-foreground/90 h-12 text-xs font-mono uppercase tracking-[0.3em]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar cadastro"}
        </Button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4">
      <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground border-b border-border pb-2 w-full">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}