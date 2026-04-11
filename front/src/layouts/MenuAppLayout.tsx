import { ChartColumn, ChevronRight, LayoutDashboard, Settings, Stethoscope, UserCircle2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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
    href: "/patients",
    icon: Users,
  },
  {
    label: "Tratamientos",
    href: "/treatments",
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
  return (
    <aside className="flex w-full max-w-sm flex-col border-r border-secondary-dark/60 bg-white px-4 py-6 sm:px-6 lg:w-2/12 lg:min-w-[280px]">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_18px_40px_-24px_rgba(21,170,154,0.9)]">
          <svg viewBox="0 0 48 48" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M7 19c4.4-6.2 14.6-6.6 19.2-.8 3.8 4.7 11.1 5 15.8.8" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M7 30c4.4-6.2 14.6-6.6 19.2-.8 3.8 4.7 11.1 5 15.8.8" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-dark/70">OnDent</p>
          <h1 className="text-lg font-semibold text-slate-900">Panel clínico</h1>
        </div>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
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
          className="group mt-3 flex items-center gap-3 rounded-3xl border border-secondary-dark/60 bg-white p-4 shadow-[0_20px_50px_-40px_rgba(14,124,114,0.6)] transition-colors hover:border-primary/30 hover:bg-secondary/40"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <UserCircle2 className="h-6 w-6" strokeWidth={1.9} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500">Mi perfil</p>
            <p className="truncate font-semibold text-slate-900">OnDent Admin</p>
          </div>

          <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-primary" strokeWidth={1.9} />
        </Link>
      </div>
    </aside>
  );
}
