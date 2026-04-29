import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/logo-bumpside.png";

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate("/", { replace: true });
  };

  const signUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu email para confirmar.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md p-6 shadow-elegant-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src={logo} alt="BUMPSIDE BRASIL" className="h-16 w-auto object-contain" />
          <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
            Estoque
          </p>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full" onClick={signIn} disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Senha (mín. 6 caracteres)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full" onClick={signUp} disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}