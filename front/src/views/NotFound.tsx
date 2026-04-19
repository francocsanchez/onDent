import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-secondary-dark/60 bg-white p-8 text-center shadow-[0_30px_80px_-60px_rgba(14,124,114,0.45)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-dark/70">Error 404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Página no encontrada</h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          La ruta que intentaste abrir no existe o ya no está disponible.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
