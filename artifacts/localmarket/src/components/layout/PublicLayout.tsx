import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Activity, Heart, LogOut, User, X, ShieldAlert, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useHealthCheck, useListActiveAnnouncements } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const ANNOUNCEMENT_STYLES: Record<string, { icon: typeof Info; classes: string }> = {
  info: { icon: Info, classes: "bg-blue-600 text-white" },
  warning: { icon: AlertTriangle, classes: "bg-amber-500 text-white" },
  success: { icon: CheckCircle2, classes: "bg-emerald-600 text-white" },
};

const DISMISSED_ANNOUNCEMENTS_KEY = "dismissedAnnouncementIds";

function useDismissedAnnouncements() {
  const [dismissed, setDismissed] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  const dismiss = (id: number) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(next));
  };

  return { dismissed, dismiss };
}

function AnnouncementBanner() {
  const { data: announcements } = useListActiveAnnouncements();
  const { dismissed, dismiss } = useDismissedAnnouncements();

  const visible = announcements?.filter(a => !dismissed.includes(a.id)) ?? [];
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col">
      {visible.map(a => {
        const style = ANNOUNCEMENT_STYLES[a.style] ?? ANNOUNCEMENT_STYLES.info;
        const Icon = style.icon;
        return (
          <div key={a.id} className={`px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-3 ${style.classes}`}>
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{a.message}</span>
            </div>
            <button
              aria-label="Fermer l'annonce"
              className="shrink-0 opacity-80 hover:opacity-100"
              onClick={() => dismiss(a.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function parseJwtPayload(token: string): { impersonatedByRoot?: boolean; [key: string]: unknown } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch { return null; }
}

function useAuth() {
  const [user, setUser] = useState<{ name: string; token: string; role: string | null } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const name = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");
    if (token && name) setUser({ token, name, role });

    const handler = () => {
      const t = localStorage.getItem("userToken");
      const n = localStorage.getItem("userName");
      const r = localStorage.getItem("userRole");
      setUser(t && n ? { token: t, name: n, role: r } : null);
    };
    window.addEventListener("storage", handler);
    window.addEventListener("auth-change", handler);
    return () => { window.removeEventListener("storage", handler); window.removeEventListener("auth-change", handler); };
  }, []);

  const isImpersonating = user ? parseJwtPayload(user.token)?.impersonatedByRoot === true : false;

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
  };

  const exitImpersonation = () => {
    const adminToken = localStorage.getItem("adminTokenBackup");
    if (adminToken) localStorage.setItem("adminToken", adminToken);
    localStorage.removeItem("adminTokenBackup");
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
  };

  return { user, logout, isImpersonating, exitImpersonation };
}

function useIsAdmin() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("adminToken");
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: health } = useHealthCheck();
  const isAdmin = useIsAdmin();
  const { user, logout, isImpersonating, exitImpersonation } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMerchant = user?.role === "merchant";
  const postAdHref = isMerchant ? "/deposer" : "/inscription-marchand";

  const handleExitImpersonation = () => {
    exitImpersonation();
    setLocation("/admin/dashboard?tab=membres");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setLocation("/");
    setOpen(false);
  };

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/annonces", label: t("nav.ads") },
    { href: "/publicites", label: t("nav.ads_promo") },
    { href: postAdHref, label: t("nav.post_ad") },
    { href: "/tarifs", label: t("nav.pricing") },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background font-sans text-foreground">
      <AnnouncementBanner />
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${
          scrolled
            ? "border-border/60 bg-background shadow-md shadow-black/20"
            : "border-border/30 bg-background"
        }`}
      >
        <div className="container flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-grainily.jpg" alt="Grainily" className="h-9 w-auto rounded object-contain" />
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("header.menu_sr")}>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 sm:w-96 p-0 overflow-y-auto">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                  <img src="/logo-grainily.jpg" alt="Grainily" className="h-8 w-auto rounded object-contain" />
                  <LanguageSwitcher />
                </div>

                <nav className="flex flex-col px-4 py-4 gap-1">
                  {navLinks.map(l => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>

                <div className="px-4 pb-4 border-t border-border/40 pt-4 mt-auto flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 justify-start gap-2 font-semibold"
                    onClick={() => { setLocation("/dons"); setOpen(false); }}
                  >
                    <Heart className="h-4 w-4 fill-current" />
                    {t("header.support_full")}
                  </Button>

                  {user ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg mt-2">
                        <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{t("user.connected")}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => { setLocation("/espace-commercant"); setOpen(false); }}
                      >
                        {t("user.merchant_space")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        {t("user.logout")}
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => { setLocation("/connexion"); setOpen(false); }}
                      >
                        {t("header.login")}
                      </Button>
                      <Button
                        className="w-full font-semibold"
                        onClick={() => { setLocation("/inscription"); setOpen(false); }}
                      >
                        {t("header.register_free")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {isImpersonating && (
        <div className="bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Mode usurpation : vous agissez en tant que {user?.name}.</span>
          </div>
          <button className="underline hover:no-underline" onClick={handleExitImpersonation}>Quitter l'usurpation</button>
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-200 py-12">
        <div className="container max-w-7xl px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <img src="/logo-grainily.jpg" alt="Grainily" className="h-9 w-auto rounded object-contain brightness-0 invert" />
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              {t("footer.description")}
            </p>
            {health && (
              <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                <Activity className="h-3 w-3 text-green-500" />
                <span>{t("footer.system_status", { status: health.status })}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{t("footer.nav_title")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">{t("nav.home")}</Link></li>
              <li><Link href="/annonces" className="hover:text-white transition-colors">{t("nav.ads")}</Link></li>
              <li><Link href="/publicites" className="hover:text-white transition-colors">{t("nav.ads_promo")}</Link></li>
              <li><Link href={postAdHref} className="hover:text-white transition-colors">{t("nav.post_ad")}</Link></li>
              <li><Link href="/tarifs" className="hover:text-white transition-colors">{t("footer.pricing_plans")}</Link></li>
              <li><Link href="/dons" className="hover:text-white transition-colors">{t("footer.support")}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{t("footer.legal_title")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">{t("footer.legal_notices")}</Link></li>
              <li><Link href="/cgu" className="hover:text-white transition-colors">{t("footer.cgu")}</Link></li>
              <li><Link href="/politique-confidentialite" className="hover:text-white transition-colors">{t("footer.privacy")}</Link></li>
              {isAdmin && (
                <li><Link href="/admin" className="hover:text-white transition-colors">{t("footer.admin")}</Link></li>
              )}
            </ul>
          </div>
        </div>
        <div className="container max-w-7xl px-4 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-400 text-center">
          <div>&copy; {t("footer.copyright", { year: new Date().getFullYear() })}</div>
        </div>
      </footer>
    </div>
  );
}
