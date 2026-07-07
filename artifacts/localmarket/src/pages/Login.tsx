import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Triangle, Lock, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserLogin } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useUserLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          localStorage.setItem("userToken", data.token);
          localStorage.setItem("userName", data.user.name);
          if (data.user.role) localStorage.setItem("userRole", data.user.role);
          else localStorage.removeItem("userRole");
          window.dispatchEvent(new Event("auth-change"));
          toast({ title: t("login.success_title"), description: t("login.success_desc", { name: data.user.name }) });
          setLocation("/");
        },
        onError: () => {
          toast({
            title: t("login.error_title"),
            description: t("login.error_desc"),
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center relative">
          <div className="absolute right-0 top-0">
            <LanguageSwitcher />
          </div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Triangle className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">LocalMarket</span>
          </Link>
        </div>

        <Card className="border-border/50 bg-card shadow-2xl shadow-black/30">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold">{t("login.title")}</CardTitle>
            <CardDescription>{t("login.subtitle")}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("login.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("login.email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Link href="/mot-de-passe-oublie" className="text-xs text-primary hover:underline">
                    {t("login.forgot")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pl-10"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-semibold mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("login.submitting")}</>
                ) : (
                  t("login.submit")
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-3 border-t border-border/40 pt-4">
            <p className="text-sm text-muted-foreground text-center">
              {t("login.no_account")}{" "}
              <Link href="/inscription" className="text-primary font-semibold hover:underline">
                {t("login.register_link")}
              </Link>
            </p>
            <Link href="/espace-commercant" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t("login.merchant_link")}
            </Link>
          </CardFooter>
        </Card>

        <p className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t("login.back_home")}
          </Link>
        </p>
      </div>
    </div>
  );
}
