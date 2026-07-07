import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Lock, Loader2, CheckCircle, AlertTriangle, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ResetPassword() {
  const { t } = useTranslation();
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
    if (!tk) setError(t("reset.invalid_link"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: t("reset.error_short"), description: t("reset.error_short_desc"), variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: t("reset.error_mismatch"), description: t("reset.error_mismatch_desc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("reset.invalid_link")); return; }
      setSuccess(true);
      setTimeout(() => setLocation("/connexion"), 3000);
    } catch {
      setError(t("reset.error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 relative">
          <div className="absolute right-0 top-0">
            <LanguageSwitcher />
          </div>
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Triangle className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight">LocalMarket</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>{t("reset.title")}</CardTitle>
            <CardDescription>{t("reset.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-4">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <p className="text-slate-700 text-sm mb-4">{error}</p>
                <Link href="/mot-de-passe-oublie">
                  <Button variant="outline" size="sm">{t("reset.request_new")}</Button>
                </Link>
              </div>
            ) : success ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">{t("reset.success_title")}</h3>
                <p className="text-slate-600 text-sm mb-4">{t("reset.success_desc")}</p>
                <Link href="/connexion"><Button size="sm">{t("reset.login")}</Button></Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">{t("reset.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("reset.password_placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">{t("reset.confirm")}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder={t("reset.confirm_placeholder")}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading || !token}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {t("reset.submit")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
