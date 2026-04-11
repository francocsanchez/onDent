import { LoaderCircle } from "lucide-react";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export default function LoadingSpinner({
  label = "Cargando...",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex min-h-[240px] flex-col items-center justify-center gap-3 ${className}`}>
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" strokeWidth={2.2} />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
