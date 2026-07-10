import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Triangle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdminLogin } from "@workspace/api-client-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useAdminLogin();

  useEffect(() => {
    if (localStorage.getItem("adminToken")) {
      setLocation("/admin/dashboard");
    }
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          if (data.success && data.token) {
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminRole", data.role ?? "admin");
            toast({ title: "Connexion réussie", description: "Bienvenue dans l'espace administrateur." });
            setLocation("/admin/dashboard");
          } else {
            toast({
              title: "Identifiants incorrects",
              description: "Vérifiez votre email et mot de passe.",
              variant: "destructive",
            });
          }
        },
        onError: () => {
          toast({
            title: "Erreur de connexion",
            description: "Impossible de joindre le serveur. Vérifiez vos identifiants.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">

        <Card className="border-border/50 bg-card shadow-2xl shadow-black/40">
          <CardHeader className="space-y-4 items-center text-center pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Triangle className="h-7 w-7 fill-current" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">Espace Administrateur</CardTitle>
              <CardDescription className="text-muted-foreground">
                Gérez la plateforme Grainily
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-input border-border text-foreground"
                  data-testid="input-admin-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-input border-border text-foreground"
                  data-testid="input-admin-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion...</>
                ) : (
                  <><Lock className="mr-2 h-4 w-4" /> Se connecter</>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border/40 p-4">
            <p className="text-xs text-muted-foreground text-center">
              Accès réservé à l'équipe de modération Grainily.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
