import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { AdminLayout, useAdminRole } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useAdminListAds, useUpdateAdStatus, useDeleteAd, useAdminBulkUpdateAds,
  useGetBranding, useUpdateBranding,
  useAdminListCategories, useAdminCreateCategory, useAdminUpdateCategory, useAdminDeleteCategory,
  useAdminListUnits, useAdminCreateUnit, useAdminUpdateUnit, useAdminDeleteUnit,
  useAdminListPromotionPrices, useAdminCreatePromotionPrice, useAdminUpdatePromotionPrice, useAdminDeletePromotionPrice,
  useAdminListPlans, useAdminCreatePlan, useAdminUpdatePlan, useAdminDeletePlan,
  useAdminListConfig, useAdminUpdateConfig,
  useAdminGetStats, useAdminGetModes, useAdminUpdateMode,
  useAdminListUsers, useAdminCreateUser, useAdminUpdateUser, useAdminDeleteUser,
  useAdminListAdvertisements, useAdminCreateAdvertisement, useAdminUpdateAdvertisement,
  useAdminDeleteAdvertisement, useAdminReorderAdvertisements,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, XCircle, Trash2, Eye, EyeOff, Paintbrush, Loader2, Plus, Pencil,
  Settings2, Star, Users, Shield, Crown, ToggleLeft, FileText, UserCheck,
  TrendingUp, Clock, Activity, AlertTriangle, CheckSquare, Square, Globe, Hash,
  Share2, Wrench, Key, ChevronDown, ChevronRight, CreditCard, Heart, RefreshCw,
  Megaphone, Image, Video, Link2, ArrowUp, ArrowDown, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const activeTab = params.get("tab") || "overview";
  const role = useAdminRole();

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      setLocation("/admin");
    }
  }, [setLocation]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 pb-10">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "annonces" && <AnnoncesTab />}
        {activeTab === "publicites" && <PublicitesTab />}
        {activeTab === "plans" && <PlansTab />}
        {activeTab === "modes" && <ModesTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "unites" && <UnitesTab />}
        {activeTab === "tarifs" && <TarifsTab />}
        {activeTab === "branding" && <BrandingTab />}
        {activeTab === "paiements" && <PaiementsTab />}
        {activeTab === "settings" && <ParametresTab />}
        {activeTab === "admins" && role === "root" && <AdminsTab />}
        {activeTab === "admins" && role !== "root" && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Shield className="h-10 w-10 text-amber-500" />
            <p className="font-semibold text-lg">Accès réservé au Root Admin</p>
            <p className="text-sm">Vous devez être connecté en tant que Root Admin pour gérer les comptes administrateurs.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function TabHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: number | string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useAdminGetStats();

  return (
    <div className="space-y-6">
      <TabHeader title="Vue d'ensemble" description="Tableau de bord en temps réel de la plateforme LocalMarket." />

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement des statistiques...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Total annonces" value={stats?.totalAds ?? 0} icon={FileText} color="bg-primary/10 text-primary" />
            <StatCard label="En attente" value={stats?.pendingAds ?? 0} icon={Clock} color="bg-yellow-500/10 text-yellow-600" />
            <StatCard label="Publiées" value={stats?.publishedAds ?? 0} icon={CheckCircle2} color="bg-green-500/10 text-green-600" />
            <StatCard label="Rejetées" value={stats?.rejectedAds ?? 0} icon={XCircle} color="bg-red-500/10 text-red-600" />
            <StatCard label="Utilisateurs" value={stats?.totalUsers ?? 0} icon={UserCheck} color="bg-blue-500/10 text-blue-600" />
            <StatCard label="Admins" value={stats?.totalAdmins ?? 0} icon={Shield} color="bg-amber-500/10 text-amber-600" />
          </div>

          {(stats?.pendingAds ?? 0) > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
                    {stats?.pendingAds} annonce{(stats?.pendingAds ?? 0) > 1 ? "s" : ""} en attente de validation
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-0.5">Des utilisateurs attendent votre approbation.</p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto border-yellow-300 text-yellow-700 hover:bg-yellow-100" onClick={() => window.location.href = "/admin/dashboard?tab=annonces"}>
                  Voir les annonces
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Répartition des annonces
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.totalAds ? (
                  <div className="space-y-3">
                    {[
                      { label: "Publiées", count: stats.publishedAds, color: "bg-green-500", total: stats.totalAds },
                      { label: "En attente", count: stats.pendingAds, color: "bg-yellow-500", total: stats.totalAds },
                      { label: "Rejetées", count: stats.rejectedAds, color: "bg-red-500", total: stats.totalAds },
                    ].map(({ label, count, color, total }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-semibold">{count} ({total ? Math.round(count / total * 100) : 0}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: total ? `${count / total * 100}%` : "0%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Activité de la plateforme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm">Plateforme</span>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">En ligne</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Total membres inscrits</span>
                    <span className="font-bold">{stats?.totalUsers ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Comptes admins actifs</span>
                    <span className="font-bold">{(stats?.totalAdmins ?? 0) + 1} <span className="text-xs text-muted-foreground">(+root)</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ModesTab() {
  const { toast } = useToast();
  const { data: modes, isLoading, refetch } = useAdminGetModes();
  const updateMode = useAdminUpdateMode();
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleToggle = (key: string, enabled: boolean) => {
    setSaving(s => ({ ...s, [key]: true }));
    updateMode.mutate(
      { key, data: { enabled } },
      {
        onSuccess: () => { toast({ title: "Mode mis à jour." }); refetch(); },
        onError: () => toast({ title: "Erreur lors de la mise à jour", variant: "destructive" }),
        onSettled: () => setSaving(s => ({ ...s, [key]: false })),
      }
    );
  };

  const MODE_ICONS: Record<string, React.ElementType> = {
    maintenance_mode: AlertTriangle,
    registration_enabled: UserCheck,
    auto_approve_ads: CheckCircle2,
    show_contact_email: Eye,
    allow_donations: Star,
  };

  const MODE_COLORS: Record<string, string> = {
    maintenance_mode: "text-red-600",
    registration_enabled: "text-green-600",
    auto_approve_ads: "text-blue-600",
    show_contact_email: "text-purple-600",
    allow_donations: "text-pink-600",
  };

  return (
    <div className="space-y-6">
      <TabHeader
        title="Modes de la plateforme"
        description="Activez ou désactivez des fonctionnalités globales de la plateforme en temps réel."
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement des modes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes?.map(mode => {
            const Icon = MODE_ICONS[mode.key] ?? ToggleLeft;
            const colorClass = MODE_COLORS[mode.key] ?? "text-primary";
            const isWarning = mode.key === "maintenance_mode" && mode.enabled;
            return (
              <Card key={mode.key} className={`border-border/50 transition-all ${isWarning ? "border-red-300 bg-red-50/40 dark:bg-red-950/20" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm text-foreground">{mode.label}</h3>
                        {saving[mode.key] ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch
                            checked={mode.enabled}
                            onCheckedChange={(val) => handleToggle(mode.key, val)}
                          />
                        )}
                      </div>
                      {mode.description && (
                        <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                      )}
                      <div className="mt-2">
                        {mode.enabled ? (
                          <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">Actif</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactif</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isWarning && (
                    <div className="mt-3 p-2 rounded bg-red-100 dark:bg-red-900/30 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      La plateforme est en mode maintenance — les visiteurs voient une page indisponible.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminsTab() {
  const { toast } = useToast();
  const { data: admins, isLoading, refetch } = useAdminListUsers();
  const createAdmin = useAdminCreateUser();
  const updateAdmin = useAdminUpdateUser();
  const deleteAdmin = useAdminDeleteUser();

  const emptyForm = { email: "", name: "", password: "", role: "admin" as "root" | "admin", isActive: true };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const setField = <K extends keyof typeof emptyForm>(k: K, v: typeof emptyForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleCreate = () => {
    if (!form.email || !form.name || !form.password) return;
    createAdmin.mutate(
      { data: { email: form.email, name: form.name, password: form.password, role: form.role, isActive: form.isActive } },
      {
        onSuccess: () => {
          toast({ title: "Administrateur créé." });
          setForm(emptyForm); setShowForm(false); refetch();
        },
        onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
      }
    );
  };

  const startEdit = (a: NonNullable<typeof admins>[number]) => {
    setEditingId(a.id);
    setForm({ email: a.email, name: a.name, password: "", role: a.role, isActive: a.isActive });
    setShowForm(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const payload: Parameters<typeof updateAdmin.mutate>[0]["data"] = {
      email: form.email, name: form.name, role: form.role, isActive: form.isActive,
    };
    if (form.password) payload.password = form.password;
    updateAdmin.mutate(
      { id: editingId, data: payload },
      {
        onSuccess: () => {
          toast({ title: "Administrateur mis à jour." });
          setEditingId(null); setForm(emptyForm); setShowForm(false); refetch();
        },
        onError: () => toast({ title: "Erreur lors de la mise à jour", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer cet administrateur ?")) return;
    deleteAdmin.mutate(
      { id },
      {
        onSuccess: () => { toast({ title: "Administrateur supprimé." }); refetch(); },
        onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
      }
    );
  };

  const cancel = () => { setEditingId(null); setForm(emptyForm); setShowForm(false); };

  return (
    <div className="space-y-6">
      <TabHeader
        title="Gestion des administrateurs"
        description="Créez et gérez les comptes admin de la plateforme. Réservé au Root Admin."
        action={
          <Button onClick={() => { cancel(); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nouvel admin
          </Button>
        }
      />

      {/* Root admin card (non-deletable) */}
      <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Root Admin</p>
              <Badge className="bg-amber-500/20 text-amber-700 border-amber-300 text-[10px]">ROOT</Badge>
            </div>
            <p className="text-xs text-muted-foreground">admin@localmarket.fr — Compte root hardcodé, toujours actif</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-300 text-xs shrink-0">Actif</Badge>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-base">{editingId ? "Modifier l'administrateur" : "Nouvel administrateur"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nom complet *</Label>
                <Input placeholder="Marie Dupont" value={form.name} onChange={e => setField("name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" placeholder="marie@localmarket.fr" value={form.email} onChange={e => setField("email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{editingId ? "Nouveau mot de passe (laisser vide pour conserver)" : "Mot de passe *"}</Label>
                <Input type="password" placeholder="Minimum 6 caractères" value={form.password} onChange={e => setField("password", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={(v: "root" | "admin") => setField("role", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="root">Root Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch checked={form.isActive} onCheckedChange={v => setField("isActive", v)} />
                <Label>Compte actif</Label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={editingId ? handleUpdate : handleCreate} disabled={createAdmin.isPending || updateAdmin.isPending}>
                {editingId ? "Enregistrer" : "Créer l'administrateur"}
              </Button>
              <Button variant="ghost" onClick={cancel}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
              ) : admins?.length ? admins.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{a.email}</TableCell>
                  <TableCell>
                    {a.role === "root" ? (
                      <Badge className="bg-amber-500/20 text-amber-700 border-amber-300 text-xs gap-1">
                        <Crown className="h-3 w-3" /> Root
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Shield className="h-3 w-3" /> Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.isActive ? (
                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Actif</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-300 text-xs">Inactif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.lastLoginAt ? format(new Date(a.lastLoginAt), "dd MMM yyyy HH:mm", { locale: fr }) : "Jamais"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => startEdit(a)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                    Aucun administrateur créé. Cliquez sur "Nouvel admin" pour commencer.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AnnoncesTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: ads, isLoading, refetch } = useAdminListAds({
    status: statusFilter !== "all" ? statusFilter : undefined
  });

  const updateStatus = useUpdateAdStatus();
  const deleteAd = useDeleteAd();
  const bulkUpdate = useAdminBulkUpdateAds();

  const allIds = (ads ?? []).map(a => a.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulk = (action: "publish" | "reject" | "delete") => {
    const ids = [...selected];
    if (!ids.length) return;
    const msg = action === "delete"
      ? `Supprimer ${ids.length} annonce(s) définitivement ?`
      : action === "reject"
      ? `Rejeter ${ids.length} annonce(s) ?`
      : null;
    if (msg && !confirm(msg)) return;
    bulkUpdate.mutate(
      { data: { ids, action } },
      {
        onSuccess: (res) => {
          toast({ title: `${res.affected} annonce(s) ${action === "publish" ? "publiée(s)" : action === "reject" ? "rejetée(s)" : "supprimée(s)"}.` });
          setSelected(new Set());
          refetch();
        },
        onError: () => toast({ title: "Erreur lors de l'action groupée", variant: "destructive" })
      }
    );
  };

  const handleStatusChange = (id: number, status: 'published' | 'rejected') => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Annonce ${status === 'published' ? 'publiée' : 'rejetée'} avec succès.` });
          refetch();
        },
        onError: () => toast({ title: "Erreur", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      deleteAd.mutate(
        { id },
        {
          onSuccess: () => { toast({ title: "Annonce supprimée." }); refetch(); },
          onError: () => toast({ title: "Erreur", variant: "destructive" })
        }
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
      case 'published': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Publiée</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejetée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <TabHeader
        title="Gestion des annonces"
        description="Validez, rejetez ou supprimez les annonces soumises par les utilisateurs."
        action={
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSelected(new Set()); }}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Filtrer par statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les annonces</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="published">Publiées</SelectItem>
              <SelectItem value="rejected">Rejetées</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {someSelected && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <span className="text-sm font-medium text-primary">{selected.size} sélectionnée(s)</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 gap-1" onClick={() => handleBulk("publish")} disabled={bulkUpdate.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Publier tout
            </Button>
            <Button size="sm" variant="outline" className="text-yellow-700 border-yellow-300 hover:bg-yellow-50 gap-1" onClick={() => handleBulk("reject")} disabled={bulkUpdate.isPending}>
              <XCircle className="h-3.5 w-3.5" /> Rejeter tout
            </Button>
            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1" onClick={() => handleBulk("delete")} disabled={bulkUpdate.isPending}>
              <Trash2 className="h-3.5 w-3.5" /> Supprimer tout
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setSelected(new Set())}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <button onClick={toggleAll} className="p-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead className="w-[55px]">ID</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin inline mr-2" /> Chargement...</TableCell></TableRow>
              ) : ads?.length ? (
                ads.map((ad) => (
                  <TableRow key={ad.id} className={selected.has(ad.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <button onClick={() => toggleOne(ad.id)} className="p-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        {selected.has(ad.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{ad.id}</TableCell>
                    <TableCell className="font-medium max-w-[160px] truncate" title={ad.title}>
                      {ad.isPromoted && <Badge className="mr-1 bg-amber-500 text-white text-[10px]">Sponsorisé</Badge>}
                      {ad.title}
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{ad.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ad.listingType === "free" ? "Don" : ad.listingType === "fixed" ? "Prix fixe" : "Prix libre"}
                      {ad.price && ` — ${ad.price}€`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ad.createdAt), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{getStatusBadge(ad.status)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {ad.status === 'pending' && (
                        <>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusChange(ad.id, 'published')} title="Valider">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(ad.id, 'rejected')} title="Rejeter">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(ad.id)} title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Aucune annonce trouvée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PublicitesTab() {
  const { toast } = useToast();
  const { data: ads, isLoading, refetch } = useAdminListAdvertisements();
  const createAd = useAdminCreateAdvertisement();
  const updateAd = useAdminUpdateAdvertisement();
  const deleteAd = useAdminDeleteAdvertisement();
  const reorderAds = useAdminReorderAdvertisements();

  const emptyForm = {
    title: "",
    mediaType: "image" as "image" | "video",
    mediaUrl: "",
    linkUrl: "",
    isActive: true,
    startDate: "",
    endDate: "",
  };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const setField = <K extends keyof typeof emptyForm>(k: K, v: typeof emptyForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const cancel = () => { setEditingId(null); setForm(emptyForm); setShowForm(false); };

  const buildPayload = () => ({
    title: form.title,
    mediaType: form.mediaType,
    mediaUrl: form.mediaUrl,
    linkUrl: form.linkUrl || undefined,
    isActive: form.isActive,
    startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
    endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
  });

  const handleCreate = () => {
    if (!form.title || !form.mediaUrl) return;
    createAd.mutate(
      { data: buildPayload() },
      {
        onSuccess: () => { toast({ title: "Publicité créée." }); cancel(); refetch(); },
        onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
      }
    );
  };

  const startEdit = (a: NonNullable<typeof ads>[number]) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      mediaType: a.mediaType,
      mediaUrl: a.mediaUrl,
      linkUrl: a.linkUrl ?? "",
      isActive: a.isActive,
      startDate: a.startDate ? a.startDate.slice(0, 10) : "",
      endDate: a.endDate ? a.endDate.slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updateAd.mutate(
      { id: editingId, data: buildPayload() },
      {
        onSuccess: () => { toast({ title: "Publicité mise à jour." }); cancel(); refetch(); },
        onError: () => toast({ title: "Erreur lors de la mise à jour", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer cette publicité ?")) return;
    deleteAd.mutate(
      { id },
      {
        onSuccess: () => { toast({ title: "Publicité supprimée." }); refetch(); },
        onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
      }
    );
  };

  const handleToggleActive = (a: NonNullable<typeof ads>[number]) => {
    updateAd.mutate(
      {
        id: a.id,
        data: {
          title: a.title,
          mediaType: a.mediaType,
          mediaUrl: a.mediaUrl,
          linkUrl: a.linkUrl ?? undefined,
          isActive: !a.isActive,
          startDate: a.startDate,
          endDate: a.endDate,
        },
      },
      {
        onSuccess: () => { toast({ title: a.isActive ? "Publicité désactivée." : "Publicité activée." }); refetch(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      }
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    if (!ads) return;
    const target = index + direction;
    if (target < 0 || target >= ads.length) return;
    const reordered = [...ads];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderAds.mutate(
      { data: { ids: reordered.map(a => a.id) } },
      {
        onSuccess: () => refetch(),
        onError: () => toast({ title: "Erreur lors de la réorganisation", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <TabHeader
        title="Gestion des publicités"
        description="Créez, modifiez, réordonnez et supprimez les bannières et vidéos promotionnelles affichées publiquement."
        action={
          <Button onClick={() => { cancel(); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nouvelle publicité
          </Button>
        }
      />

      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-base">{editingId ? "Modifier la publicité" : "Nouvelle publicité"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label>Titre *</Label>
                <Input placeholder="Promotion de printemps" value={form.title} onChange={e => setField("title", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Type de média</Label>
                <Select value={form.mediaType} onValueChange={(v: "image" | "video") => setField("mediaType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image / Bannière</SelectItem>
                    <SelectItem value="video">Vidéo courte (short)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>URL du média *</Label>
                <Input placeholder="https://..." value={form.mediaUrl} onChange={e => setField("mediaUrl", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Lien de destination (optionnel)</Label>
                <Input placeholder="https://... ou /annonces/123" value={form.linkUrl} onChange={e => setField("linkUrl", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Date de début (optionnel)</Label>
                <Input type="date" value={form.startDate} onChange={e => setField("startDate", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Date de fin (optionnel)</Label>
                <Input type="date" value={form.endDate} onChange={e => setField("endDate", e.target.value)} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch checked={form.isActive} onCheckedChange={v => setField("isActive", v)} />
                <Label>Publicité active</Label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={editingId ? handleUpdate : handleCreate} disabled={createAd.isPending || updateAd.isPending}>
                {editingId ? "Enregistrer" : "Créer la publicité"}
              </Button>
              <Button variant="ghost" onClick={cancel}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Ordre</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lien</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
              ) : ads?.length ? ads.map((a, index) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === ads.length - 1} onClick={() => move(index, 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" title={a.title}>{a.title}</TableCell>
                  <TableCell>
                    {a.mediaType === "video" ? (
                      <Badge variant="outline" className="text-xs gap-1"><Video className="h-3 w-3" /> Vidéo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1"><Image className="h-3 w-3" /> Image</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.linkUrl ? (
                      <a href={a.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline max-w-[140px] truncate">
                        <ExternalLink className="h-3 w-3 shrink-0" /> {a.linkUrl}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.startDate || a.endDate ? (
                      <>
                        {a.startDate ? format(new Date(a.startDate), "dd MMM yyyy", { locale: fr }) : "…"}
                        {" → "}
                        {a.endDate ? format(new Date(a.endDate), "dd MMM yyyy", { locale: fr }) : "…"}
                      </>
                    ) : "Illimitée"}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleActive(a)}>
                      {a.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">Inactive</Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => startEdit(a)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Aucune publicité créée pour le moment.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesTab() {
  const { toast } = useToast();
  const { data: categories, isLoading, refetch } = useAdminListCategories();
  const createCategory = useAdminCreateCategory();
  const updateCategory = useAdminUpdateCategory();
  const deleteCategory = useAdminDeleteCategory();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const slug = newSlug.trim() || newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    createCategory.mutate(
      { data: { name: newName.trim(), slug, active: true } },
      {
        onSuccess: () => { toast({ title: "Catégorie créée." }); setNewName(""); setNewSlug(""); refetch(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" })
      }
    );
  };

  const handleUpdate = (id: number) => {
    updateCategory.mutate(
      { id, data: { name: editName, slug: editSlug, active: true } },
      {
        onSuccess: () => { toast({ title: "Catégorie mise à jour." }); setEditingId(null); refetch(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" })
      }
    );
  };

  const handleToggleActive = (cat: { id: number; name: string; slug: string; active: boolean }) => {
    updateCategory.mutate({ id: cat.id, data: { name: cat.name, slug: cat.slug, active: !cat.active } }, { onSuccess: () => refetch() });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette catégorie ?")) {
      deleteCategory.mutate({ id }, { onSuccess: () => { toast({ title: "Catégorie supprimée." }); refetch(); } });
    }
  };

  return (
    <div className="space-y-6">
      <TabHeader title="Catégories d'annonces" description="Gérez les catégories disponibles dans les formulaires." />
      <Card className="border-border/50">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex gap-3">
            <Input placeholder="Nom de la catégorie" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            <Input placeholder="Slug (auto)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="w-36" />
            <Button onClick={handleCreate} disabled={createCategory.isPending}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
              ) : categories?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{editingId === cat.id ? <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" /> : cat.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{editingId === cat.id ? <Input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="h-8" /> : cat.slug}</TableCell>
                  <TableCell><Switch checked={cat.active} onCheckedChange={() => handleToggleActive(cat)} /></TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === cat.id ? (
                      <>
                        <Button size="sm" onClick={() => handleUpdate(cat.id)} disabled={updateCategory.isPending}>Enregistrer</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditSlug(cat.slug); }}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id)}><Trash2 className="h-3 w-3" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UnitesTab() {
  const { toast } = useToast();
  const { data: units, isLoading, refetch } = useAdminListUnits();
  const createUnit = useAdminCreateUnit();
  const updateUnit = useAdminUpdateUnit();
  const deleteUnit = useAdminDeleteUnit();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [editName, setEditName] = useState("");
  const [editSymbol, setEditSymbol] = useState("");

  const handleCreate = () => {
    if (!newName.trim() || !newSymbol.trim()) return;
    createUnit.mutate({ data: { name: newName.trim(), symbol: newSymbol.trim(), active: true } }, {
      onSuccess: () => { toast({ title: "Unité créée." }); setNewName(""); setNewSymbol(""); refetch(); },
      onError: () => toast({ title: "Erreur", variant: "destructive" })
    });
  };

  const handleUpdate = (id: number) => {
    updateUnit.mutate({ id, data: { name: editName, symbol: editSymbol, active: true } }, {
      onSuccess: () => { toast({ title: "Unité mise à jour." }); setEditingId(null); refetch(); },
      onError: () => toast({ title: "Erreur", variant: "destructive" })
    });
  };

  const handleToggleActive = (u: { id: number; name: string; symbol: string; active: boolean }) => {
    updateUnit.mutate({ id: u.id, data: { name: u.name, symbol: u.symbol, active: !u.active } }, { onSuccess: () => refetch() });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette unité ?")) {
      deleteUnit.mutate({ id }, { onSuccess: () => { toast({ title: "Unité supprimée." }); refetch(); } });
    }
  };

  return (
    <div className="space-y-6">
      <TabHeader title="Unités de mesure" description="Gérez les unités disponibles dans les formulaires d'annonces." />
      <Card className="border-border/50">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex gap-3">
            <Input placeholder="Nom (ex: Kilogramme)" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            <Input placeholder="Symbole (ex: kg)" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} className="w-36" />
            <Button onClick={handleCreate} disabled={createUnit.isPending}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Symbole</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
              ) : units?.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>{editingId === unit.id ? <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" /> : unit.name}</TableCell>
                  <TableCell className="font-mono text-sm">{editingId === unit.id ? <Input value={editSymbol} onChange={(e) => setEditSymbol(e.target.value)} className="h-8 w-24" /> : unit.symbol}</TableCell>
                  <TableCell><Switch checked={unit.active} onCheckedChange={() => handleToggleActive(unit)} /></TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === unit.id ? (
                      <>
                        <Button size="sm" onClick={() => handleUpdate(unit.id)} disabled={updateUnit.isPending}>Enregistrer</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { setEditingId(unit.id); setEditName(unit.name); setEditSymbol(unit.symbol); }}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(unit.id)}><Trash2 className="h-3 w-3" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function TarifsTab() {
  const { toast } = useToast();
  const { data: prices, isLoading, refetch } = useAdminListPromotionPrices();
  const createPrice = useAdminCreatePromotionPrice();
  const updatePrice = useAdminUpdatePromotionPrice();
  const deletePrice = useAdminDeletePromotionPrice();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newDuration, setNewDuration] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const handleCreate = () => {
    if (!newLabel.trim() || !newPrice.trim() || !newDuration) return;
    createPrice.mutate({ data: { duration: Number(newDuration), label: newLabel.trim(), price: newPrice.trim(), active: true } }, {
      onSuccess: () => { toast({ title: "Tarif créé." }); setNewDuration(""); setNewLabel(""); setNewPrice(""); refetch(); },
      onError: () => toast({ title: "Erreur", variant: "destructive" })
    });
  };

  const handleUpdate = (id: number) => {
    updatePrice.mutate({ id, data: { duration: Number(editDuration), label: editLabel, price: editPrice, active: true } }, {
      onSuccess: () => { toast({ title: "Tarif mis à jour." }); setEditingId(null); refetch(); },
      onError: () => toast({ title: "Erreur", variant: "destructive" })
    });
  };

  const handleToggleActive = (p: { id: number; duration: number; label: string; price: string; active: boolean }) => {
    updatePrice.mutate({ id: p.id, data: { duration: p.duration, label: p.label, price: p.price, active: !p.active } }, { onSuccess: () => refetch() });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer ce tarif ?")) {
      deletePrice.mutate({ id }, { onSuccess: () => { toast({ title: "Tarif supprimé." }); refetch(); } });
    }
  };

  return (
    <div className="space-y-6">
      <TabHeader title="Tarifs de mise en avant" description="Gérez les tarifs publicitaires pour la mise en avant des annonces." />
      <Card className="border-border/50">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Durée (jours)" type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} className="w-full sm:w-32" />
            <Input placeholder="Libellé (ex: 7 jours)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="w-full sm:flex-1 sm:min-w-[140px]" />
            <Input placeholder="Prix (ex: 9.90)" type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full sm:w-32" />
            <Button onClick={handleCreate} disabled={createPrice.isPending} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Durée</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Prix (€)</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
              ) : prices?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{editingId === p.id ? <Input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="h-8 w-24" /> : `${p.duration} jours`}</TableCell>
                  <TableCell>{editingId === p.id ? <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-8" /> : p.label}</TableCell>
                  <TableCell className="font-semibold text-primary">{editingId === p.id ? <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 w-28" /> : `${p.price} €`}</TableCell>
                  <TableCell><Switch checked={p.active} onCheckedChange={() => handleToggleActive(p)} /></TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === p.id ? (
                      <>
                        <Button size="sm" onClick={() => handleUpdate(p.id)} disabled={updatePrice.isPending}>Enregistrer</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { setEditingId(p.id); setEditDuration(String(p.duration)); setEditLabel(p.label); setEditPrice(p.price); }}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PlansTab() {
  const { toast } = useToast();
  const { data: plans, isLoading, refetch } = useAdminListPlans();
  const createPlan = useAdminCreatePlan();
  const updatePlan = useAdminUpdatePlan();
  const deletePlan = useAdminDeletePlan();

  const emptyForm = { name: "", slug: "", description: "", priceMonthly: "0", priceAnnual: "", maxAds: "", featuresText: "", isActive: true, sortOrder: "0" };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const setField = (k: keyof typeof emptyForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const toPayload = () => ({
    name: form.name.trim(),
    slug: form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    description: form.description.trim() || undefined,
    priceMonthly: form.priceMonthly || "0",
    priceAnnual: form.priceAnnual.trim() || undefined,
    maxAds: form.maxAds ? Number(form.maxAds) : undefined,
    features: form.featuresText.split("\n").map(s => s.trim()).filter(Boolean),
    isActive: form.isActive,
    sortOrder: Number(form.sortOrder) || 0,
  });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createPlan.mutate({ data: toPayload() }, {
      onSuccess: () => { toast({ title: "Plan créé." }); setForm(emptyForm); setShowForm(false); refetch(); },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  const startEdit = (p: NonNullable<typeof plans>[number]) => {
    setEditingId(p.id);
    setForm({ name: p.name, slug: p.slug, description: p.description ?? "", priceMonthly: p.priceMonthly, priceAnnual: p.priceAnnual ?? "", maxAds: p.maxAds != null ? String(p.maxAds) : "", featuresText: (p.features as string[]).join("\n"), isActive: p.isActive, sortOrder: String(p.sortOrder) });
    setShowForm(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updatePlan.mutate({ id: editingId, data: toPayload() }, {
      onSuccess: () => { toast({ title: "Plan mis à jour." }); setEditingId(null); setForm(emptyForm); setShowForm(false); refetch(); },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer ce plan ?")) return;
    deletePlan.mutate({ id }, { onSuccess: () => { toast({ title: "Plan supprimé." }); refetch(); } });
  };

  const cancel = () => { setEditingId(null); setForm(emptyForm); setShowForm(false); };

  return (
    <div className="space-y-6">
      <TabHeader
        title="Plans & Abonnements"
        description="Créez et gérez les offres d'abonnement affichées sur la page publique /tarifs."
        action={<Button onClick={() => { cancel(); setShowForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> Nouveau plan</Button>}
      />

      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-base">{editingId ? "Modifier le plan" : "Créer un nouveau plan"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nom du plan *</Label>
                <Input placeholder="ex: Max" value={form.name} onChange={e => setField("name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input placeholder="ex: max (auto)" value={form.slug} onChange={e => setField("slug", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Prix mensuel (€) *</Label>
                <Input type="number" step="0.01" placeholder="0" value={form.priceMonthly} onChange={e => setField("priceMonthly", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Prix annuel (€)</Label>
                <Input type="number" step="0.01" placeholder="Optionnel" value={form.priceAnnual} onChange={e => setField("priceAnnual", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Limite d'annonces</Label>
                <Input type="number" placeholder="Illimité si vide" value={form.maxAds} onChange={e => setField("maxAds", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ordre d'affichage</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setField("sortOrder", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Description</Label>
                <Input placeholder="Brève description du plan" value={form.description} onChange={e => setField("description", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Fonctionnalités <span className="text-muted-foreground text-xs">(une par ligne)</span></Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={"Annonces illimitées\nMise en avant prioritaire\nSupport prioritaire"}
                  value={form.featuresText}
                  onChange={e => setField("featuresText", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setField("isActive", v)} />
                <Label>Plan actif (visible sur /tarifs)</Label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={editingId ? handleUpdate : handleCreate} disabled={createPlan.isPending || updatePlan.isPending}>
                {editingId ? "Enregistrer les modifications" : "Créer le plan"}
              </Button>
              <Button variant="ghost" onClick={cancel}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prix mensuel</TableHead>
                <TableHead>Prix annuel</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead>Fonctionnalités</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
              ) : plans?.length ? plans.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground text-sm">{p.sortOrder}</TableCell>
                  <TableCell>
                    <div className="font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" /> {p.name}
                    </div>
                    {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{Number(p.priceMonthly) === 0 ? "Gratuit" : `${p.priceMonthly} €/mois`}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.priceAnnual ? `${p.priceAnnual} €/an` : "—"}</TableCell>
                  <TableCell className="text-sm">{p.maxAds != null ? `${p.maxAds} annonces` : "Illimité"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {(p.features as string[]).slice(0, 2).map((f, i) => <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>)}
                      {(p.features as string[]).length > 2 && <Badge variant="outline" className="text-[10px]">+{(p.features as string[]).length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={p.isActive} onCheckedChange={() => {
                      updatePlan.mutate({ id: p.id, data: { name: p.name, slug: p.slug, description: p.description ?? undefined, priceMonthly: p.priceMonthly, priceAnnual: p.priceAnnual ?? undefined, maxAds: p.maxAds ?? undefined, features: p.features as string[], isActive: !p.isActive, sortOrder: p.sortOrder } }, { onSuccess: () => refetch() });
                    }} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => startEdit(p)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Aucun plan configuré. Cliquez sur "Nouveau plan" pour commencer.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ParametresTab() {
  const { toast } = useToast();
  const { data: configs, isLoading, refetch } = useAdminListConfig();
  const updateConfig = useAdminUpdateConfig();
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (configs) {
      const initial: Record<string, string> = {};
      configs.forEach(c => { initial[c.key] = c.value ?? ""; });
      setValues(initial);
    }
  }, [configs]);

  const handleSave = (key: string, isSecret: boolean) => {
    setSaving(s => ({ ...s, [key]: true }));
    updateConfig.mutate(
      { key, data: { value: values[key] ?? "" } },
      {
        onSuccess: () => { toast({ title: "Configuration sauvegardée." }); refetch(); },
        onError: () => toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" }),
        onSettled: () => setSaving(s => ({ ...s, [key]: false })),
      }
    );
    void isSecret;
  };

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground py-10"><Loader2 className="h-5 w-5 animate-spin" /> Chargement...</div>;

  const renderConfigRow = (c: NonNullable<typeof configs>[number]) => {
    const isSecret = c.isSecret;
    const showClear = isSecret && visible[c.key];
    return (
      <div key={c.key} className="space-y-2 p-4 border rounded-lg bg-card">
        <div className="flex items-start justify-between">
          <div>
            <Label className="text-sm font-semibold">{c.label}</Label>
            {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
          </div>
          {isSecret && <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">Secret</Badge>}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={isSecret && !visible[c.key] ? "password" : "text"}
              value={values[c.key] ?? ""}
              onChange={e => setValues(v => ({ ...v, [c.key]: e.target.value }))}
              placeholder={isSecret ? "Saisir pour définir ou remplacer la clé" : ""}
              className="pr-10 font-mono text-sm"
            />
            {isSecret && (
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setVisible(v => ({ ...v, [c.key]: !v[c.key] }))} tabIndex={-1}>
                {showClear ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
          <Button size="sm" onClick={() => handleSave(c.key, isSecret)} disabled={saving[c.key]} className="shrink-0">
            {saving[c.key] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sauvegarder"}
          </Button>
        </div>
        {isSecret && c.value && <p className="text-xs text-green-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" /> Clé configurée</p>}
        {isSecret && !c.value && <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block" /> Non configuré</p>}
      </div>
    );
  };

  type ConfigGroup = { label: string; icon: React.ElementType; description: string; keys: string[] };
  const CONFIG_GROUPS: ConfigGroup[] = [
    { label: "Identité de la plateforme", icon: Globe, description: "Nom, slogan, URL et coordonnées de contact.", keys: ["site_name", "site_tagline", "site_url", "contact_email", "from_email", "footer_address"] },
    { label: "SEO", icon: Hash, description: "Optimisation pour les moteurs de recherche.", keys: ["seo_title", "seo_description", "seo_keywords", "og_image_url"] },
    { label: "Réseaux sociaux", icon: Share2, description: "Liens vers vos pages et profils.", keys: ["facebook_url", "instagram_url", "twitter_url", "whatsapp_number", "youtube_url"] },
    { label: "Maintenance", icon: Wrench, description: "Message affiché en mode maintenance.", keys: ["maintenance_message"] },
    { label: "Intégrations & Clés API", icon: Key, description: "Clés secrètes — masquées par défaut.", keys: ["stripe_api_key", "stripe_webhook_secret", "resend_api_key", "google_analytics_id"] },
  ];

  const configByKey = Object.fromEntries((configs ?? []).map(c => [c.key, c]));

  return (
    <div className="space-y-6">
      <TabHeader title="Paramètres plateforme" description="Contrôle total — configurez chaque aspect de LocalMarket." />
      {CONFIG_GROUPS.map((group) => {
        const groupConfigs = group.keys.map(k => configByKey[k]).filter(Boolean) as NonNullable<typeof configs>[number][];
        const GroupIcon = group.icon;
        return (
          <Card key={group.label} className="border-border/50">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <GroupIcon className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{group.label}</CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {groupConfigs.length === 0
                ? <p className="text-muted-foreground text-sm py-2">Aucun paramètre disponible.</p>
                : groupConfigs.map(renderConfigRow)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function BrandingTab() {
  const { data: branding, isLoading } = useGetBranding();
  const updateBranding = useUpdateBranding();
  const { toast } = useToast();
  const [formState, setFormState] = useState({ siteName: "", primaryColor: "", accentColor: "", backgroundColor: "", fontFamily: "", logoUrl: "" });

  useEffect(() => {
    if (branding) {
      setFormState({ siteName: branding.siteName || "LocalMarket", primaryColor: branding.primaryColor || "#2563eb", accentColor: branding.accentColor || "#1d4ed8", backgroundColor: branding.backgroundColor || "#ffffff", fontFamily: branding.fontFamily || "Inter", logoUrl: branding.logoUrl || "" });
    }
  }, [branding]);

  const handleSave = () => {
    updateBranding.mutate({ data: formState }, {
      onSuccess: () => toast({ title: "Branding mis à jour." }),
      onError: () => toast({ title: "Erreur", variant: "destructive" })
    });
  };

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground py-10"><Loader2 className="h-5 w-5 animate-spin" /> Chargement...</div>;

  return (
    <div className="space-y-6">
      <TabHeader title="Branding & Identité visuelle" description="Personnalisez l'apparence globale de la plateforme LocalMarket." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/50">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle>Éditeur de marque</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>Nom du site</Label>
              <Input value={formState.siteName} onChange={(e) => setFormState({ ...formState, siteName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>URL du logo</Label>
              <Input placeholder="https://..." value={formState.logoUrl} onChange={(e) => setFormState({ ...formState, logoUrl: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Couleur Primaire", key: "primaryColor" as const },
                { label: "Couleur d'Accent", key: "accentColor" as const },
                { label: "Fond", key: "backgroundColor" as const },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex gap-1">
                    <Input type="color" className="w-10 p-1 h-9 cursor-pointer shrink-0" value={formState[key]} onChange={(e) => setFormState({ ...formState, [key]: e.target.value })} />
                    <Input value={formState[key]} onChange={(e) => setFormState({ ...formState, [key]: e.target.value })} className="font-mono text-xs" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Police de caractères</Label>
              <Select value={formState.fontFamily} onValueChange={(v) => setFormState({ ...formState, fontFamily: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Sans-serif Moderne)</SelectItem>
                  <SelectItem value="Roboto">Roboto (Clair & Lisible)</SelectItem>
                  <SelectItem value="Poppins">Poppins (Arrondi & Convivial)</SelectItem>
                  <SelectItem value="Lato">Lato (Chaleureux)</SelectItem>
                  <SelectItem value="Montserrat">Montserrat (Élégant)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={updateBranding.isPending} className="w-full">
              <Paintbrush className="h-4 w-4 mr-2" /> Appliquer le nouveau style
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold">Aperçu en direct</h3>
          <Card className="overflow-hidden border-2 shadow-xl" style={{ backgroundColor: formState.backgroundColor, fontFamily: formState.fontFamily }}>
            <div className="h-12 border-b flex items-center px-4 justify-between bg-white">
              <div className="flex items-center gap-2 font-bold" style={{ color: formState.primaryColor }}>
                {formState.logoUrl ? <img src={formState.logoUrl} alt="Logo" className="h-7" /> : <div className="h-7 w-7 rounded flex items-center justify-center text-white text-xs" style={{ backgroundColor: formState.primaryColor }}>LM</div>}
                {formState.siteName}
              </div>
              <div className="flex gap-2"><div className="h-2 w-12 bg-muted rounded-full" /><div className="h-2 w-12 bg-muted rounded-full" /></div>
            </div>
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Bienvenue sur <span style={{ color: formState.primaryColor }}>{formState.siteName}</span></h2>
              <p style={{ color: '#64748b' }} className="text-sm">Aperçu de la typographie et des couleurs.</p>
              <div className="flex gap-3">
                <Button style={{ backgroundColor: formState.primaryColor, color: '#ffffff' }} size="sm">Action principale</Button>
                <Button variant="outline" style={{ borderColor: formState.accentColor, color: formState.accentColor }} size="sm">Secondaire</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Onglet Paiements ───────────────────────────────────────────────────────

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getAdminHeaders() {
  return {
    "x-admin-token": localStorage.getItem("adminToken") ?? "",
    "Content-Type": "application/json",
  };
}

type SubStatus = "active" | "cancelled" | "past_due" | "trialing" | "expired" | "pending";
type DonStatus = "pending" | "completed" | "failed" | "refunded";

interface SubRow {
  id: number; status: SubStatus; stripeSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null;
  createdAt: string; userName: string | null; userEmail: string | null; planName: string | null; priceMonthly: string | null;
}

interface DonRow {
  id: number; amount: number; currency: string; donorName: string | null;
  donorEmail: string | null; status: DonStatus; stripeSessionId: string | null;
  createdAt: string; userName: string | null; userEmail: string | null;
}

function SubStatusBadge({ status }: { status: SubStatus }) {
  const map: Record<SubStatus, { label: string; cls: string }> = {
    active: { label: "Actif", cls: "bg-green-100 text-green-800" },
    cancelled: { label: "Annulé", cls: "bg-slate-100 text-slate-600" },
    past_due: { label: "Retard", cls: "bg-red-100 text-red-700" },
    trialing: { label: "Essai", cls: "bg-blue-100 text-blue-700" },
    expired: { label: "Expiré", cls: "bg-orange-100 text-orange-700" },
    pending: { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "" };
  return <Badge className={cls}>{label}</Badge>;
}

function DonStatusBadge({ status }: { status: DonStatus }) {
  const map: Record<DonStatus, { label: string; cls: string }> = {
    completed: { label: "Complété", cls: "bg-green-100 text-green-800" },
    pending: { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
    failed: { label: "Échoué", cls: "bg-red-100 text-red-700" },
    refunded: { label: "Remboursé", cls: "bg-slate-100 text-slate-600" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "" };
  return <Badge className={cls}>{label}</Badge>;
}

function PaiementsTab() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"subscriptions" | "donations">("subscriptions");
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [dons, setDons] = useState<DonRow[]>([]);
  const [subStats, setSubStats] = useState<{ total: number; active: number; cancelled: number; pastDue: number } | null>(null);
  const [donTotal, setDonTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [subsRes, donsRes, subStatsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/payments/subscriptions?limit=50`, { headers: getAdminHeaders() }),
        fetch(`${API_BASE}/api/admin/payments/donations?limit=50`, { headers: getAdminHeaders() }),
        fetch(`${API_BASE}/api/admin/payments/subscriptions/stats`, { headers: getAdminHeaders() }),
      ]);
      const [subsData, donsData, ssData] = await Promise.all([subsRes.json(), donsRes.json(), subStatsRes.json()]);
      setSubs(subsData.rows ?? []);
      setDons(donsData.rows ?? []);
      setDonTotal(donsData.totalCompleted ?? 0);
      setSubStats(ssData);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateSubStatus = async (id: number, status: SubStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/payments/subscriptions/${id}`, {
        method: "PATCH", headers: getAdminHeaders(), body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setSubs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toast({ title: "Statut mis à jour" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const deleteSub = async (id: number) => {
    if (!confirm("Supprimer cet abonnement de la base ?")) return;
    try {
      await fetch(`${API_BASE}/api/admin/payments/subscriptions/${id}`, { method: "DELETE", headers: getAdminHeaders() });
      setSubs(prev => prev.filter(s => s.id !== id));
      toast({ title: "Abonnement supprimé" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const updateDonStatus = async (id: number, status: DonStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/payments/donations/${id}`, {
        method: "PATCH", headers: getAdminHeaders(), body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setDons(prev => prev.map(d => d.id === id ? { ...d, status } : d));
      toast({ title: "Statut mis à jour" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const deleteDon = async (id: number) => {
    if (!confirm("Supprimer ce don de la base ?")) return;
    try {
      await fetch(`${API_BASE}/api/admin/payments/donations/${id}`, { method: "DELETE", headers: getAdminHeaders() });
      setDons(prev => prev.filter(d => d.id !== id));
      toast({ title: "Don supprimé" });
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  return (
    <div>
      <TabHeader
        title="Paiements"
        description="Gérez les abonnements et les dons de la plateforme."
        action={
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="pt-5 pb-4">
          <div className="text-2xl font-bold">{subStats?.total ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">Total abonnements</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4">
          <div className="text-2xl font-bold text-green-600">{subStats?.active ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">Actifs</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4">
          <div className="text-2xl font-bold text-red-600">{subStats?.pastDue ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">En retard</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4">
          <div className="text-2xl font-bold text-primary">{(donTotal / 100).toFixed(2)} €</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Heart className="h-3 w-3 text-red-500" /> Dons collectés</div>
        </CardContent></Card>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeSection === "subscriptions" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("subscriptions")}
          className="gap-1.5"
        >
          <CreditCard className="h-4 w-4" /> Abonnements ({subs.length})
        </Button>
        <Button
          variant={activeSection === "donations" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("donations")}
          className="gap-1.5"
        >
          <Heart className="h-4 w-4" /> Dons ({dons.length})
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : activeSection === "subscriptions" ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Fin période</TableHead>
                  <TableHead className="hidden lg:table-cell">Stripe ID</TableHead>
                  <TableHead className="hidden md:table-cell">Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Aucun abonnement</TableCell></TableRow>
                ) : subs.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{sub.userName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{sub.userEmail ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{sub.planName ?? "—"}</div>
                      {sub.priceMonthly && <div className="text-xs text-muted-foreground">{sub.priceMonthly} €/mois</div>}
                    </TableCell>
                    <TableCell><SubStatusBadge status={sub.status} /></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), "dd/MM/yyyy", { locale: fr }) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">{sub.stripeSubscriptionId?.slice(0, 20) ?? "—"}…</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {format(new Date(sub.createdAt), "dd/MM/yy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Select value={sub.status} onValueChange={(v) => updateSubStatus(sub.id, v as SubStatus)}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["active", "cancelled", "past_due", "trialing", "expired", "pending"] as SubStatus[]).map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deleteSub(sub.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donateur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Session Stripe</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dons.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Aucun don</TableCell></TableRow>
                ) : dons.map(don => (
                  <TableRow key={don.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{don.donorName ?? don.userName ?? "Anonyme"}</div>
                      <div className="text-xs text-muted-foreground">{don.donorEmail ?? don.userEmail ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-sm">{(don.amount / 100).toFixed(2)} €</div>
                    </TableCell>
                    <TableCell><DonStatusBadge status={don.status} /></TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">{don.stripeSessionId?.slice(0, 16) ?? "—"}…</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {format(new Date(don.createdAt), "dd/MM/yy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Select value={don.status} onValueChange={(v) => updateDonStatus(don.id, v as DonStatus)}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["pending", "completed", "failed", "refunded"] as DonStatus[]).map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deleteDon(don.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
