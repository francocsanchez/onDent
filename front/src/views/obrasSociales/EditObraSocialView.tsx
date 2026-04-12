import { getObrasSocialByID } from "@/api/obraSocialAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import EditObraSocialForm from "@/components/obrasSociales/EditObraSocialForm";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export default function EditObraSocialView() {
  const params = useParams();
  const idObraSocial = params.idObraSocial!;

  const {
    data: obraSocial,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["edit_obra_social", idObraSocial],
    queryFn: () => getObrasSocialByID(idObraSocial),
    retry: false,
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando obra social..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar la obra social.
      </div>
    );
  }

  if (obraSocial) return <EditObraSocialForm obraSocial={obraSocial} />;
}
