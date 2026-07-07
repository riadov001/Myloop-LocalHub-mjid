import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Triangle, Activity, Heart, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHealthCheck } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
  };

  return { user, logout };
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
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isMerchant = user?.role === "merchant";
  const postAdHref = isMerchant ? "/deposer" : "/inscription-marchand";

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
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
                <Triangle className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">LocalMarket</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className="text-sm font-medium transition-colors hover:text-primary">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />

            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 font-semibold gap-1.5"
              onClick={() => setLocation("/dons")}
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
              {t("header.support")}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 font-semibold">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{t("user.account_type")}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation(postAdHref)} className="cursor-pointer">
                    {t("user.post_ad")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/espace-commercant")} className="cursor-pointer">
                    {t("user.merchant_space")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("user.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setLocation("/connexion")}>
                  {t("header.login")}
                </Button>
                <Button size="sm" onClick={() => setLocation("/inscription")} className="font-semibold">
                  {t("header.register")}
                </Button>
              </div>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">{t("header.menu_sr")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
                      <Triangle className="h-5 w-5 fill-current" />
                    </div>
                    <span className="font-bold text-foreground">LocalMarket</span>
                  </div>
                  <LanguageSwitcher />
                </div>

                {navLinks.map(l => (
                  <Link key={l.href} href={l.href} className="text-base font-medium hover:text-primary transition-colors" onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                ))}

                <hr className="my-2" />

                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50 justify-start gap-2"
                  onClick={() => { setLocation("/dons"); setOpen(false); }}
                >
                  <Heart className="h-4 w-4 fill-current" />
                  {t("header.support_full")}
                </Button>

                {user ? (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
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
                      variant="outline"
                      className="w-full justify-start text-red-600 border-red-200 gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("user.logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { setLocation("/connexion"); setOpen(false); }}>
                      {t("header.login")}
                    </Button>
                    <Button className="w-full justify-start font-semibold" onClick={() => { setLocation("/inscription"); setOpen(false); }}>
                      {t("header.register_free")}
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-200 py-12">
        <div className="container max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
                <Triangle className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">LocalMarket</span>
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
        <div className="container max-w-7xl mt-12 pt-8 border-t border-slate-800 text-sm text-slate-400 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <div>&copy; {t("footer.copyright", { year: new Date().getFullYear() })}</div>
          <div className="flex items-center gap-1 text-slate-500">
            {t("footer.made_with")} <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 mx-1" /> {t("footer.made_with_suffix")}
          </div>
        </div>
      </footer>
    </div>
  );
}
