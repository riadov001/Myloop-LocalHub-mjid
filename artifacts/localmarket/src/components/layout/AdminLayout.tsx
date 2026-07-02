import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, LogOut, Settings, Palette, List, Tag, Scale,
  Star, Users, Shield, ToggleLeft, ChevronRight, Menu, X, Triangle, Crown, CreditCard, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function useAdminRole(): "root" | "admin" {
  if (typeof window === "undefined") return "admin";
  return (localStorage.getItem("adminRole") ?? "admin") as "root" | "admin";
}

const NAV_ITEMS = [
  { tab: "overview", label: "Vue d'ensemble", icon: LayoutDashboard, roles: ["root", "admin"] },
  { tab: "annonces", label: "Annonces", icon: List, roles: ["root", "admin"] },
  { tab: "publicites", label: "Publicités", icon: Megaphone, roles: ["root", "admin"] },
  { tab: "plans", label: "Plans & Abonnements", icon: Star, roles: ["root", "admin"] },
  { tab: "modes", label: "Modes plateforme", icon: ToggleLeft, roles: ["root", "admin"] },
  { tab: "categories", label: "Catégories", icon: Tag, roles: ["root", "admin"] },
  { tab: "unites", label: "Unités", icon: Scale, roles: ["root", "admin"] },
  { tab: "branding", label: "Branding", icon: Palette, roles: ["root", "admin"] },
  { tab: "paiements", label: "Paiements", icon: CreditCard, roles: ["root", "admin"] },
  { tab: "settings", label: "Paramètres", icon: Settings, roles: ["root", "admin"] },
  { tab: "admins", label: "Gestion admins", icon: Users, roles: ["root"] },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = useAdminRole();

  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const activeTab = params.get("tab") || "overview";

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    setLocation("/admin");
  };

  const navItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 w-full" onClick={() => setMobileOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow shrink-0">
            <Triangle className="h-4 w-4 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-sidebar-foreground leading-tight">LocalMarket</div>
            <div className="text-[10px] text-sidebar-foreground/50 leading-tight">Cockpit Admin</div>
          </div>
          {role === "root" && (
            <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0.5 shrink-0 flex items-center gap-1">
              <Crown className="h-2.5 w-2.5" />ROOT
            </Badge>
          )}
        </Link>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => {
                setLocation(`/admin/dashboard?tab=${item.tab}`);
                setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground")} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.tab === "admins" && (
                <Shield className="h-3 w-3 text-amber-400 shrink-0" />
              )}
              {isActive && <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border shrink-0 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
              {role === "root" ? <Crown className="h-3.5 w-3.5 text-amber-400" /> : <Shield className="h-3.5 w-3.5 text-primary" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-sidebar-foreground truncate">
                {role === "root" ? "Root Admin" : "Administrateur"}
              </div>
              <div className="text-[10px] text-sidebar-foreground/50">LocalMarket</div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-400 gap-2"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="h-14 flex items-center px-4 border-b bg-background md:hidden justify-between shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-sm">Cockpit Admin</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
