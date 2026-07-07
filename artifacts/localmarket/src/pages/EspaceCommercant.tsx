import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Store, BarChart2, ListChecks, Settings, LogOut, ChevronRight, Plus, Eye, Clock, CheckCircle, XCircle, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";


interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  subscription: {
    status: string;
    plan: { name: string; maxAds: number } | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface Ad {
  id: number;
  title: string;
  product: string;
  location: string;
  status: string;
  createdAt: string;
  views?: number;
}

interface Stats {
  totalAds: number;
  publishedAds: number;
  pendingAds: number;
  totalViews30d: number;
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "published") return <Badge className="bg-green-100 text-green-800">{t("merchant.status.published")}</Badge>;
  if (status === "pending") return <Badge className="bg-yellow-100 text-yellow-800">{t("merchant.status.pending")}</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-800">{t("merchant.status.rejected")}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function EspaceCommercant() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("userToken");
    if (!t) { setLocation("/connexion"); return; }
    setToken(t);
    loadAll(t);
  }, []);

  async function loadAll(tok: string) {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
      const [profileRes, adsRes, statsRes] = await Promise.all([
        fetch(`/api/merchant/me`, { headers }),
        fetch(`/api/merchant/ads`, { headers }),
        fetch(`/api/merchant/stats`, { headers }),
      ]);
      if (!profileRes.ok) { setLocation("/connexion"); return; }
      const [p, a, s] = await Promise.all([profileRes.json(), adsRes.json(), statsRes.json()]);
      setProfile(p);
      setProfileName(p.name);
      setAds(Array.isArray(a) ? a : []);
      setStats(s);
    } catch {
      toast({ title: t("merchant.error_loading"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    window.dispatchEvent(new Event("auth-change"));
    setLocation("/connexion");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/merchant/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProfile((p) => p ? { ...p, name: updated.name } : p);
      localStorage.setItem("userName", updated.name);
      window.dispatchEvent(new Event("auth-change"));
      toast({ title: t("merchant.profile.updated") });
    } catch {
      toast({ title: t("common.error"), description: t("merchant.profile.error"), variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-blue-600" />
              {t("merchant.title")}
            </h1>
            <p className="text-slate-500 mt-1">{t("merchant.hello")} <span className="font-medium text-slate-700">{profile?.name}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/deposer">
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> {t("merchant.new_ad")}
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> {t("merchant.logout")}
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-2xl font-bold text-slate-900">{stats.totalAds}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> {t("merchant.stats.total")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-2xl font-bold text-green-600">{stats.publishedAds}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> {t("merchant.stats.published")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-2xl font-bold text-amber-600">{stats.pendingAds}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t("merchant.stats.pending")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-2xl font-bold text-blue-600">{stats.totalViews30d}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {t("merchant.stats.views")}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="annonces">
          <TabsList className="mb-6">
            <TabsTrigger value="annonces" className="gap-1.5"><ListChecks className="h-4 w-4" /> {t("merchant.tabs.ads")}</TabsTrigger>
            <TabsTrigger value="abonnement" className="gap-1.5"><CreditCard className="h-4 w-4" /> {t("merchant.tabs.subscription")}</TabsTrigger>
            <TabsTrigger value="profil" className="gap-1.5"><User className="h-4 w-4" /> {t("merchant.tabs.profile")}</TabsTrigger>
          </TabsList>

          {/* Onglet Annonces */}
          <TabsContent value="annonces">
            {ads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ListChecks className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">{t("merchant.ads.empty_title")}</p>
                  <p className="text-slate-400 text-sm mt-1 mb-4">{t("merchant.ads.empty_desc")}</p>
                  <Link href="/deposer"><Button size="sm">{t("merchant.ads.post_ad")}</Button></Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {ads.map((ad) => (
                  <Card key={ad.id} className="hover:border-blue-200 transition-colors">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{ad.title}</div>
                        <div className="text-sm text-slate-500">{ad.product} · {ad.location}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(ad.createdAt).toLocaleDateString(i18n.language === "en" ? "en-GB" : "fr-FR")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {ad.views !== undefined && (
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Eye className="h-3 w-3" />{ad.views}</span>
                        )}
                        <StatusBadge status={ad.status} />
                        <Link href={`/annonces/${ad.id}`}>
                          <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Abonnement */}
          <TabsContent value="abonnement">
            <Card>
              <CardHeader>
                <CardTitle>{t("merchant.subscription.title")}</CardTitle>
                <CardDescription>{t("merchant.subscription.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.subscription && profile.subscription.status === "active" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <div className="font-medium text-green-800">{profile.subscription.plan?.name ?? t("merchant.subscription.title")}</div>
                        {profile.subscription.currentPeriodEnd && (
                          <div className="text-sm text-green-600">
                            {t("merchant.subscription.renewal", { date: new Date(profile.subscription.currentPeriodEnd).toLocaleDateString(i18n.language === "en" ? "en-GB" : "fr-FR") })}
                          </div>
                        )}
                        {profile.subscription.cancelAtPeriodEnd && (
                          <div className="text-sm text-amber-600 mt-1">{t("merchant.subscription.cancel_end")}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-600">{t("merchant.subscription.no_sub")}</p>
                    <Link href="/tarifs">
                      <Button className="gap-1.5"><CreditCard className="h-4 w-4" /> {t("merchant.subscription.see_plans")}</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Profil */}
          <TabsContent value="profil">
            <Card>
              <CardHeader>
                <CardTitle>{t("merchant.profile.title")}</CardTitle>
                <CardDescription>{t("merchant.profile.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="name">{t("merchant.profile.name")}</Label>
                    <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>{t("merchant.profile.email")}</Label>
                    <Input value={profile?.email ?? ""} disabled className="mt-1 bg-slate-50" />
                  </div>
                  <div>
                    <Label>{t("merchant.profile.role")}</Label>
                    <Input value={profile?.role ?? ""} disabled className="mt-1 bg-slate-50" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${profile?.emailVerified ? "bg-green-500" : "bg-amber-500"}`} />
                    <span className="text-sm text-slate-600">
                      {profile?.emailVerified ? t("merchant.profile.email_verified") : t("merchant.profile.email_not_verified")}
                    </span>
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? t("merchant.profile.saving") : t("merchant.profile.save")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PublicLayout>
  );
}
