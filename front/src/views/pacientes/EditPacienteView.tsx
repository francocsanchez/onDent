import { getPacienteByID } from "@/api/pacienteAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import EditPacienteForm from "@/components/pacientes/EditPacienteForm";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

export default function EditPacienteView() {
  const params = useParams();
  const idPaciente = params.idPaciente!;

  const {
    data: paciente,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["edit_paciente", idPaciente],
    queryFn: () => getPacienteByID(idPaciente),
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

  if (paciente) return <EditPacienteForm paciente={paciente} />;
}
