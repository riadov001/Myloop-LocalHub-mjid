import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft, Loader2, CheckCircle, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      toast({ title: t("common.error"), description: t("forgot.error"), variant: "destructive" });
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
            <span className="text-xl font-bold tracking-tight">Grainily</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>{t("forgot.title")}</CardTitle>
            <CardDescription>{t("forgot.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">{t("forgot.sent_title")}</h3>
                <p className="text-slate-600 text-sm mb-4">
                  {t("forgot.sent_desc")}
                </p>
                <Link href="/connexion">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" /> {t("forgot.back_login")}
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t("forgot.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("forgot.email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {t("forgot.submit")}
                </Button>
                <Link href="/connexion">
                  <Button variant="ghost" size="sm" className="w-full gap-1.5">
                    <ArrowLeft className="h-4 w-4" /> {t("forgot.back_login")}
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
