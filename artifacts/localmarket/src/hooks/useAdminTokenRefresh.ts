import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function parseJwtPayload(token: string): { exp?: number; role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

function isJwt(token: string): boolean {
  return token.split(".").length === 3;
}

const REFRESH_BEFORE_EXPIRY_MS = 60 * 60 * 1000;

export function useAdminTokenRefresh() {
  const [, setLocation] = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleRefresh() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const token = localStorage.getItem("adminToken");
      if (!token || !isJwt(token)) return;

      const payload = parseJwtPayload(token);
      if (!payload?.exp) return;

      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const delay = expiresAt - now - REFRESH_BEFORE_EXPIRY_MS;

      if (delay <= 0) {
        doRefresh();
        return;
      }

      timerRef.current = setTimeout(doRefresh, delay);
    }

    async function doRefresh() {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setLocation("/admin");
        return;
      }

      try {
        const res = await fetch("/api/admin/refresh", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminRole");
          setLocation("/admin");
          return;
        }

        if (res.ok) {
          const data = await res.json() as { token: string; role: string };
          localStorage.setItem("adminToken", data.token);
          if (data.role) localStorage.setItem("adminRole", data.role);
          scheduleRefresh();
        }
      } catch {
        // Network error — retry in 30s
        timerRef.current = setTimeout(doRefresh, 30_000);
      }
    }

    scheduleRefresh();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [setLocation]);
}
