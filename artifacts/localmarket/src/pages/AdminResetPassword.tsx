import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Lock, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tk = params.get("token") ?? "";
    setToken(tk);
    if (!tk) setError("Lien de réinitialisation invalide ou manquant.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Le mot de passe doit contenir au moins 8 caractères.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Les mots de passe ne correspondent pas", description: "Vérifiez la confirmation.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lien invalide ou expiré."); return; }
      setSuccess(true);
      setTimeout(() => setLocation("/admin"), 3000);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-center mb-2">
          <img src="/logo-grainily.jpg" alt="Grainily" className="h-10 rounded-lg object-contain" />
        </div>

        <Card className="border-border/50 bg-card shadow-2xl shadow-black/40">
          <CardHeader className="space-y-2 pb-5">
            <CardTitle className="text-xl font-bold tracking-tight">Nouveau mot de passe</CardTitle>
            <CardDescription>Choisissez un nouveau mot de passe pour votre compte administrateur.</CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <div className="text-center py-4 space-y-3">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Link href="/admin/mot-de-passe-oublie">
                  <Button variant="outline" size="sm">Demander un nouveau lien</Button>
                </Link>
              </div>
            ) : success ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-semibold text-foreground">Mot de passe réinitialisé</h3>
                <p className="text-sm text-muted-foreground">Redirection vers la connexion dans 3 secondes...</p>
                <Link href="/admin">
                  <Button size="sm">Se connecter</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Nouveau mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 bg-input border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-sm font-medium">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Répétez le mot de passe"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="h-11 bg-input border-border"
                  />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold gap-2" disabled={loading || !token}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Enregistrer le nouveau mot de passe
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
