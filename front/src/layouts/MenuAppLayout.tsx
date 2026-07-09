import useRoleGuard from "@/hooks/useRoleGuard";
import { useQueryClient } from "@tanstack/react-query";
import { ChartColumn, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Settings, Stethoscope, UserCircle2, Users, X, ScanLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type MenuAppLayoutProps = {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Atencionces",
    href: "/atenciones",
    icon: Stethoscope,
  },
  {
    label: "Pacientes",
    href: "/pacientes",
    icon: Users,
  },
  {
    label: "RX",
    href: "/rx",
    icon: ScanLine,
  },
  {
    label: "Liquidaciones",
    href: "/liquidaciones",
    icon: ClipboardList,
  },
  {
    label: "Pagos",
    href: "/pagos",
    icon: ClipboardList,
  },
  {
    label: "Coseguros",
    href: "/coseguros",
    icon: ClipboardList,
  },
  {
    label: "Reportes",
    href: "/reports",
    icon: ChartColumn,
  },
  {
    label: "Configuración",
    href: "/config",
    icon: Settings,
  },
];

export default function MenuAppLayout({ isOpen, isCollapsed, onClose, onToggleCollapsed }: MenuAppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    queryClient.removeQueries({ queryKey: ["auth-user"] });
    onClose();
    navigate("/login", { replace: true });
  };

  const { allowed: canShowConfig } = useRoleGuard(["superadmin"]);
  const { allowed: canShowReports } = useRoleGuard(["admin", "superadmin"]);
  const { allowed: canShowLiquidaciones } = useRoleGuard(["admin", "superadmin"]);
  const { allowed: canShowPagos } = useRoleGuard(["admin", "superadmin"]);
  const { allowed: canShowCoseguros } = useRoleGuard(["admin", "superadmin"]);
  const { allowed: canShowRx } = useRoleGuard(["rayos", "superadmin"]);

  const visibleNavigationItems = navigationItems.filter((item) => {
    if (item.href === "/config") return canShowConfig;
    if (item.href === "/reports") return canShowReports;
    if (item.href === "/liquidaciones") return canShowLiquidaciones;
    if (item.href === "/pagos") return canShowPagos;
    if (item.href === "/coseguros") return canShowCoseguros;
    if (item.href === "/rx") return canShowRx;
    return true;
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity duration-200 lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-y-auto border-r border-secondary-dark/60 bg-white py-6 transition-all duration-300 lg:sticky lg:top-0 lg:z-10 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-[286px] px-4 sm:px-6 lg:w-[104px] lg:px-3" : "w-[286px] px-4 sm:px-6 lg:w-[280px]"}`}
      >
        <div className={`mb-8 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-1`}>
          <div className="flex min-w-0 flex-1 justify-center">
            <img src="/logo.png" alt="OnDent" className={`h-auto object-contain transition-all ${isCollapsed ? "max-w-[52px]" : "w-full max-w-[120px]"}`} />
          </div>

          <div className={`flex items-center gap-2 ${isCollapsed ? "absolute right-3 top-4 lg:static" : ""}`}>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden rounded-xl border border-secondary-dark/60 bg-white p-2 text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark lg:inline-flex"
              aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" strokeWidth={2.2} /> : <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-xl border border-secondary-dark/60 bg-white p-2 text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark lg:hidden"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <nav className="space-y-2">
          {visibleNavigationItems.map((item) => {
            const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`group flex items-center rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-secondary text-primary shadow-[0_12px_30px_-24px_rgba(21,170,154,0.95)]"
                    : "text-slate-600 hover:bg-secondary/70 hover:text-primary-dark"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                    isActive
                      ? "border-primary/10 bg-white text-primary"
                      : "border-slate-200 text-slate-400 group-hover:border-secondary-dark group-hover:text-primary-dark"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.9} />
                </span>

                {!isCollapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Link
            to="/profile"
            onClick={onClose}
            title={isCollapsed ? "Mi perfil" : undefined}
            className={`group flex rounded-2xl border border-secondary-dark/60 bg-white shadow-[0_20px_50px_-40px_rgba(14,124,114,0.6)] transition-colors hover:border-primary/30 hover:bg-secondary/40 ${
              isCollapsed ? "justify-center px-2 py-2.5" : "items-center gap-3 px-3 py-2.5"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <UserCircle2 className="h-5 w-5" strokeWidth={1.9} />
            </div>

            {!isCollapsed ? (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Mi perfil</p>
                <p className="truncate text-sm font-semibold text-slate-900">OnDent Admin</p>
              </div>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? "Cerrar sesión" : undefined}
            className={`mt-3 flex w-full rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 ${
              isCollapsed ? "justify-center px-2 py-2.5" : "items-center gap-3 px-3 py-2.5"
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500">
              <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            {!isCollapsed ? <span>Cerrar sesión</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
}
