import { BadgePercent, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

const configItems = [
  {
    title: "Obras Sociales",
    description: "Administra coberturas, convenios y reglas de facturación.",
    href: "/config/obras-sociales",
    icon: BadgePercent,
  },
  {
    title: "Usuarios",
    description: "Configura accesos, permisos y cuentas del equipo.",
    href: "/config/usuarios",
    icon: Users,
  },
];

export default function MenuConfigView() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Configuracion</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Centro de control</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid  gap-4 md:grid-cols-2 xl:grid-cols-3">
          {configItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                to={item.href}
                className="group flex min-h-[200px] flex-col rounded-[1.75rem] border border-secondary-dark/70 bg-white p-6 shadow-[0_24px_60px_-48px_rgba(14,124,114,0.5)] transition-all duration-200 "
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-7 w-7" strokeWidth={1.9} />
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-primary">
                  <span>Abrir sección</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
