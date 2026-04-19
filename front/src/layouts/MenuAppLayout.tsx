import useRoleGuard from "@/hooks/useRoleGuard";
import { useQueryClient } from "@tanstack/react-query";
import { ChartColumn, LayoutDashboard, LogOut, Settings, Stethoscope, UserCircle2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Pacientes",
    href: "/pacientes",
    icon: Users,
  },
  {
    label: "Atencionces",
    href: "/atenciones",
    icon: Stethoscope,
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

export default function MenuAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    queryClient.removeQueries({ queryKey: ["auth-user"] });
    navigate("/login", { replace: true });
  };

  const { allowed: canShowConfig } = useRoleGuard(["superadmin"]);

  return (
    <aside className="sticky top-0 flex h-screen w-full max-w-sm flex-col overflow-y-auto border-r border-secondary-dark/60 bg-white px-4 py-6 sm:px-6 lg:w-2/12 lg:min-w-[280px]">
      <div className="mb-10 flex justify-center px-2">
        <div className="flex w-full justify-center">
          <img src="/logo.png" alt="OnDent" className="h-auto w-full max-w-[120px] object-contain" />
        </div>
      </div>

      <nav className="space-y-2">
        {navigationItems
          .filter((item) => (item.href === "/config" ? canShowConfig : true))
          .map((item) => {
            const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
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

                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="mt-auto pt-8">
        <Link
          to="/profile"
          className="group flex items-center gap-3 rounded-2xl border border-secondary-dark/60 bg-white px-3 py-2.5 shadow-[0_20px_50px_-40px_rgba(14,124,114,0.6)] transition-colors hover:border-primary/30 hover:bg-secondary/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <UserCircle2 className="h-5 w-5" strokeWidth={1.9} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Mi perfil</p>
            <p className="truncate text-sm font-semibold text-slate-900">OnDent Admin</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500">
            <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
