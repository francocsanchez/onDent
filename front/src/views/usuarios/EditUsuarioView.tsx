import { getUsuarioByID } from "@/api/usuarioAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import EditUsuarioForm from "@/components/usuarios/EditUsuarioForm";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export default function EditUsuarioView() {
  const params = useParams();
  const idUsuario = params.idUsuario!;

  const {
    data: usuario,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["usuario", idUsuario],
    queryFn: () => getUsuarioByID(idUsuario),
    retry: false,
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando usuario..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar el usuario.
      </div>
    );
  }

  if (usuario) return <EditUsuarioForm usuario={usuario} />;
}
