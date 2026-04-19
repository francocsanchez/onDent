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
import AtencionView from "./views/atenciones/AtencionView";
import CreateAtencionView from "./views/atenciones/CreateAtencionView";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/atenciones" element={<ListAtencionesView />} />
          <Route path="/atenciones/create" element={<CreateAtencionView />} />
          <Route path="/atenciones/:idAtencion" element={<AtencionView />} />

          <Route path="/pacientes" element={<ListPacientesView />} />
          <Route path="/pacientes/create" element={<CreatePacienteView />} />
          <Route path="/pacientes/:idPaciente/editar" element={<EditPacienteView />} />

          <Route path="/config" element={<MenuConfigView />} />

          <Route path="/config/usuarios" element={<ListUsuariosView />} />
          <Route path="/config/usuarios/create" element={<CreateUsuarioView />} />
          <Route path="/config/usuarios/:idUsuario/editar" element={<EditUsuarioView />} />

          <Route path="/config/obras-sociales" element={<ListObrasSocialesView />} />
          <Route path="/config/obras-sociales/create" element={<CreateObraSocialView />} />
          <Route path="/config/obras-sociales/:idObraSocial/editar" element={<EditObraSocialView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
