import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer l'email. Réessayez.", variant: "destructive" });
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
            <CardTitle className="text-xl font-bold tracking-tight">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre adresse email administrateur. Si elle est reconnue, vous recevrez un lien de réinitialisation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-semibold text-foreground">Email envoyé</h3>
                <p className="text-sm text-muted-foreground">
                  Si cet email est associé à un compte admin actif, un lien de réinitialisation a été envoyé. Vérifiez votre boite mail.
                </p>
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="gap-1.5 mt-2">
                    <ArrowLeft className="h-4 w-4" /> Retour à la connexion
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-input border-border"
                  />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Envoyer le lien de réinitialisation
                </Button>
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="w-full gap-1.5">
                    <ArrowLeft className="h-4 w-4" /> Retour à la connexion
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
