import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo-bumpside.png";

const nav = [
  { to: "/", label: "Loja", end: true },
  { to: "/mapa", label: "Revendedores" },
  { to: "/cadastro", label: "Cadastro" },
];

export function StoreLayout() {
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-foreground bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="BUMPSIDE" className="h-9 w-auto" />
            <span className="hidden sm:inline text-[10px] tracking-[0.3em] font-mono text-muted-foreground">
              BUMPSIDE / BR
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `text-xs font-mono uppercase tracking-[0.2em] transition-colors ${
                    isActive ? "text-foreground border-b-2 border-foreground pb-0.5" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {authed ? (
              <Button size="sm" variant="outline" className="gap-2 rounded-none border-foreground" onClick={() => navigate("/admin")}>
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </Button>
            ) : (
              <Button size="sm" variant="ghost" className="gap-2 text-xs font-mono uppercase tracking-wider" onClick={() => navigate("/auth")}>
                <LogIn className="h-3.5 w-3.5" /> Entrar
              </Button>
            )}
          </div>
        </div>

        <div className="md:hidden border-t border-border">
          <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto py-2">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `text-[11px] font-mono uppercase tracking-[0.2em] whitespace-nowrap ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-foreground mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <span>© BUMPSIDE BRASIL</span>
          <span>Streetwear / Est. BR</span>
        </div>
      </footer>
    </div>
  );
}