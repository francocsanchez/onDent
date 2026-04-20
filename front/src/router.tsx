import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ListObrasSocialesView from "@/views/obrasSociales/ListObrasSocialesView";
import MenuConfigView from "./views/MenuConfigView";
import CreateObraSocialView from "./views/obrasSociales/CreateObraSocialView";
import EditObraSocialView from "./views/obrasSociales/EditObraSocialView";
import ListUsuariosView from "./views/usuarios/ListUsuariosView";
import CreateUsuarioView from "./views/usuarios/CreateUsuarioView";
import EditUsuarioView from "./views/usuarios/EditUsuarioView";
import ListPacientesView from "./views/pacientes/ListPacientesView";
import CreatePacienteView from "./views/pacientes/CreatePacienteView";
import EditPacienteView from "./views/pacientes/EditPacienteView";
import ListAtencionesView from "./views/atenciones/ListAtencionesView";
import ListAtencionesFilteredView from "./views/atenciones/ListAtencionesFilteredView";
import AtencionView from "./views/atenciones/AtencionView";
import EditAtencionView from "./views/atenciones/EditAtencionView";
import CreateAtencionView from "./views/atenciones/CreateAtencionView";
import LoginView from "./views/auth/LoginView";
import NotFound from "./views/NotFound";
import ProtectedRoute from "./layouts/ProtectedRoute";
import RoleProtectedRoute from "./layouts/RoleProtectedRoute";
import NoAutorizado from "./views/NoAutorizado";
import MiPerfilView from "./views/auth/MiPerfilView";
import DashBoardView from "./views/dashboard/DashBoardView";
import ReportesView from "./views/reportes/ReportesView";
import ReportesAtencionesByEstadoView from "./views/reportes/ReportesAtencionesByEstadoView";
import AuditarAtencionView from "./views/reportes/AuditarAtencionView";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/profile" element={<MiPerfilView />} />
            <Route path="/no-autorizado" element={<NoAutorizado />} />

            <Route path="/" element={<DashBoardView />} />
            <Route path="/atenciones" element={<ListAtencionesView />} />
            <Route path="/atenciones/filtrar" element={<ListAtencionesFilteredView />} />
            <Route path="/atenciones/create" element={<CreateAtencionView />} />
            <Route path="/atenciones/:idAtencion/editar" element={<EditAtencionView />} />
            <Route path="/atenciones/:idAtencion" element={<AtencionView />} />

            <Route path="/pacientes" element={<ListPacientesView />} />
            <Route path="/pacientes/create" element={<CreatePacienteView />} />
            <Route path="/pacientes/:idPaciente/editar" element={<EditPacienteView />} />

            <Route element={<RoleProtectedRoute allowedRoles={["admin", "superadmin"]} />}>
              <Route path="/reports" element={<ReportesView />} />
              <Route path="/reports/atenciones/:estado/:idUsuario" element={<ReportesAtencionesByEstadoView />} />
              <Route path="/reports/atenciones/:estado/:idUsuario/:idAtencion/auditar" element={<AuditarAtencionView />} />

              <Route element={<RoleProtectedRoute allowedRoles={["superadmin"]} />}>
              <Route path="/config" element={<MenuConfigView />} />
              <Route path="/config/usuarios" element={<ListUsuariosView />} />
              <Route path="/config/usuarios/create" element={<CreateUsuarioView />} />
              <Route path="/config/usuarios/:idUsuario/editar" element={<EditUsuarioView />} />

              <Route path="/config/obras-sociales" element={<ListObrasSocialesView />} />
              <Route path="/config/obras-sociales/create" element={<CreateObraSocialView />} />
              <Route path="/config/obras-sociales/:idObraSocial/editar" element={<EditObraSocialView />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
