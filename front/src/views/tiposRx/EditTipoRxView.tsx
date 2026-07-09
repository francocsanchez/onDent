import { getTipoRxByID } from "@/api/tipoRxAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import EditTipoRxForm from "@/components/tiposRx/EditTipoRxForm";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export default function EditTipoRxView() {
  const { idTipoRx = "" } = useParams();
  const { data: tipoRx, isLoading, isError } = useQuery({
    queryKey: ["tipo_rx", idTipoRx],
    queryFn: () => getTipoRxByID(idTipoRx),
    retry: false,
  });

  if (isLoading) return <LoadingSpinner label="Cargando tipo de RX..." />;
  if (isError || !tipoRx) return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Ocurrió un error al cargar el tipo de RX.</div>;

  return <EditTipoRxForm tipoRx={{ name: tipoRx.name }} />;
}
