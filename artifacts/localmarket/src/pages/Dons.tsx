import { useState } from "react";
import { Heart, Leaf, Users, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const AMOUNTS = [5, 10, 20, 50];

export default function Dons() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | null>(10);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const amount = custom ? Number(custom) : (selected ?? 0);

  const IMPACTS = [
    { icon: Leaf, title: t("donations.impact.exchanges_title"), desc: t("donations.impact.exchanges_desc") },
    { icon: Users, title: t("donations.impact.community_title"), desc: t("donations.impact.community_desc") },
    { icon: Shield, title: t("donations.impact.infra_title"), desc: t("donations.impact.infra_desc") },
  ];

  const PERKS = [
    t("donations.perk_servers"),
    t("donations.perk_features"),
    t("donations.perk_moderation"),
    t("donations.perk_free"),
    t("donations.perk_community"),
  ];

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 1) {
      toast({ title: t("donations.error_amount"), description: t("donations.error_amount_desc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/donations/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          donorName: name || undefined,
          donorEmail: email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("donations.error_title"));
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("donations.error_title");
      toast({ title: t("donations.error_title"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="py-16 lg:py-24">
        <div className="container max-w-5xl px-4">
          <div className="text-center mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 border border-red-300 bg-red-50 text-red-600 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest">
              <Heart className="h-3.5 w-3.5 fill-current" />
              {t("donations.badge")}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {t("donations.title_part1")}<br />
              <span className="text-primary">{t("donations.title_highlight")}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t("donations.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="space-y-4">
                {IMPACTS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3">
                <h3 className="font-bold text-foreground">{t("donations.perks_title")}</h3>
                <ul className="space-y-2">
                  {PERKS.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Card className="border-border/50 shadow-2xl shadow-black/10">
              <CardContent className="p-8">
                <form onSubmit={handleDonate} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">{t("donations.form.title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("donations.form.stripe_info")}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">{t("donations.form.amount_label")}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AMOUNTS.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setSelected(a); setCustom(""); }}
                          className={`h-11 rounded-lg border-2 text-sm font-bold transition-all ${
                            selected === a && !custom
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:border-primary/50"
                          }`}
                        >
                          {a} €
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        placeholder={t("donations.form.custom_placeholder")}
                        value={custom}
                        onChange={e => { setCustom(e.target.value); setSelected(null); }}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">€</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground">{t("donations.form.info_label")}</label>
                    <Input
                      placeholder={t("donations.form.name_placeholder")}
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder={t("donations.form.email_placeholder")}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 font-bold text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    disabled={loading || !amount || amount < 1}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("donations.form.processing")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Heart className="h-4 w-4 fill-current" />
                        {amount >= 1 ? t("donations.form.submit", { amount }) : t("donations.form.submit_generic")}
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground whitespace-pre-line">
                    {t("donations.form.security_note")}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
