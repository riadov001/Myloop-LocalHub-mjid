import { useLocation } from "wouter";
import { Check, Zap, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListPlans } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

const ICONS = [Star, Zap, Rocket];
const COLORS = [
  { bg: "bg-slate-100 dark:bg-slate-800", badge: "bg-slate-200 text-slate-700", btn: "bg-slate-700 hover:bg-slate-800 text-white", border: "border-slate-200" },
  { bg: "bg-primary/5", badge: "bg-primary text-primary-foreground", btn: "bg-primary hover:bg-primary/90 text-primary-foreground", border: "border-primary/30" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-500 text-white", btn: "bg-amber-500 hover:bg-amber-600 text-white", border: "border-amber-300" },
];

export default function Tarifs() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: plans, isLoading } = useListPlans();

  const activePlans = plans?.filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];

  return (
    <PublicLayout>
      <section className="py-16 lg:py-24">
        <div className="container max-w-6xl px-4">
          <div className="text-center mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t("pricing.badge")}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {t("pricing.title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t("pricing.subtitle")}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : activePlans.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">{t("pricing.no_plans")}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-6">
              {activePlans.map((plan, i) => {
                const color = COLORS[i % COLORS.length];
                const Icon = ICONS[i % ICONS.length];
                const isPopular = i === 1;
                const features = plan.features as string[];

                return (
                  <div key={plan.id} className="relative flex flex-col">
                    {isPopular && (
                      <div className="absolute -top-6 left-0 right-0 flex justify-center">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
                          {t("pricing.popular")}
                        </span>
                      </div>
                    )}
                    <Card className={`overflow-hidden border-2 ${color.border} shadow-xl ${isPopular ? "shadow-primary/20" : ""} h-full flex flex-col`}>
                      <CardHeader className={`${color.bg} p-8 pb-6`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color.badge}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {plan.name.toLowerCase() === "max" && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[11px] font-bold">
                              MAX
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">{plan.name}</h2>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                        )}
                        <div className="mt-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-foreground">
                              {plan.priceMonthly === "0" ? t("pricing.free") : `${plan.priceMonthly} €`}
                            </span>
                            {plan.priceMonthly !== "0" && (
                              <span className="text-muted-foreground text-sm">{t("pricing.per_month")}</span>
                            )}
                          </div>
                          {plan.priceAnnual && plan.priceMonthly !== "0" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("pricing.annual_price", { price: plan.priceAnnual })}{" "}
                              <span className="text-green-600 font-semibold">
                                {t("pricing.savings", { percent: Math.round((1 - Number(plan.priceAnnual) / (Number(plan.priceMonthly) * 12)) * 100) })}
                              </span>
                            </p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-6 space-y-6 flex-1 flex flex-col">
                        {plan.maxAds != null && (
                          <div className="text-sm font-semibold text-foreground border-b border-border/40 pb-4">
                            {t("pricing.ads_limit_other", { count: plan.maxAds })}
                          </div>
                        )}
                        {plan.maxAds == null && (
                          <div className="text-sm font-bold text-primary border-b border-border/40 pb-4">
                            {t("pricing.ads_unlimited")}
                          </div>
                        )}
                        <ul className="space-y-3">
                          {features.map((f, j) => (
                            <li key={j} className="flex items-start gap-3 text-sm text-foreground">
                              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full h-11 font-semibold ${color.btn}`}
                          onClick={() => {
                            if (plan.priceMonthly === "0") {
                              setLocation("/inscription");
                            } else {
                              setLocation(`/inscription?plan=${plan.slug}`);
                            }
                          }}
                        >
                          {plan.priceMonthly === "0" ? t("pricing.start_free") : t("pricing.select_plan", { plan: plan.name })}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 text-center">
            <p className="text-muted-foreground text-sm mb-6 whitespace-pre-line">
              {t("pricing.footer_info")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-sm">
              {([
                t("pricing.feat_immediate"),
                t("pricing.feat_no_commitment"),
                t("pricing.feat_support"),
                t("pricing.feat_secure"),
              ]).map(feat => (
                <div key={feat} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
