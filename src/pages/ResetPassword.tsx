import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo-bumpside.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places a recovery session in the URL hash when the user clicks the email link.
    // onAuthStateChange will fire with event "PASSWORD_RECOVERY" or a session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não coincidem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada com sucesso");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md p-6 shadow-elegant-md">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src={logo} alt="BUMPSIDE BRASIL" className="h-16 w-auto object-contain" />
          <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
            Redefinir senha
          </p>
        </div>

        {!ready ? (
          <p className="text-sm text-center text-muted-foreground">
            Validando link de redefinição...
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Confirmar senha</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}