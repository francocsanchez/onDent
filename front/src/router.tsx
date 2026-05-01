import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProtectedRoute from "./layouts/ProtectedRoute";
import RoleProtectedRoute from "./layouts/RoleProtectedRoute";

const LoginView = lazy(() => import("./views/auth/LoginView"));
const ForgotPasswordView = lazy(() => import("./views/auth/ForgotPasswordView"));
const NotFound = lazy(() => import("./views/NotFound"));
const NoAutorizado = lazy(() => import("./views/NoAutorizado"));
const MiPerfilView = lazy(() => import("./views/auth/MiPerfilView"));
const DashBoardView = lazy(() => import("./views/dashboard/DashBoardView"));
const ListAtencionesView = lazy(() => import("./views/atenciones/ListAtencionesView"));
const ListAtencionesFilteredView = lazy(() => import("./views/atenciones/ListAtencionesFilteredView"));
const CreateAtencionView = lazy(() => import("./views/atenciones/CreateAtencionView"));
const EditAtencionView = lazy(() => import("./views/atenciones/EditAtencionView"));
const AtencionView = lazy(() => import("./views/atenciones/AtencionView"));
const ListPacientesView = lazy(() => import("./views/pacientes/ListPacientesView"));
const CreatePacienteView = lazy(() => import("./views/pacientes/CreatePacienteView"));
const EditPacienteView = lazy(() => import("./views/pacientes/EditPacienteView"));
const ReportesView = lazy(() => import("./views/reportes/ReportesView"));
const ReportesAtencionesByEstadoView = lazy(() => import("./views/reportes/ReportesAtencionesByEstadoView"));
const AuditarAtencionView = lazy(() => import("./views/reportes/AuditarAtencionView"));
const MenuConfigView = lazy(() => import("./views/MenuConfigView"));
const ListUsuariosView = lazy(() => import("./views/usuarios/ListUsuariosView"));
const CreateUsuarioView = lazy(() => import("./views/usuarios/CreateUsuarioView"));
const EditUsuarioView = lazy(() => import("./views/usuarios/EditUsuarioView"));
const ListObrasSocialesView = lazy(() => import("./views/obrasSociales/ListObrasSocialesView"));
const CreateObraSocialView = lazy(() => import("./views/obrasSociales/CreateObraSocialView"));
const EditObraSocialView = lazy(() => import("./views/obrasSociales/EditObraSocialView"));

function withSuspense(element: ReactNode, label?: string) {
  return <Suspense fallback={<LoadingSpinner label={label} />}>{element}</Suspense>;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={withSuspense(<LoginView />, "Cargando acceso...")} />
        <Route path="/forgot-password" element={withSuspense(<ForgotPasswordView />, "Cargando recuperación...")} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/profile" element={withSuspense(<MiPerfilView />, "Cargando perfil...")} />
            <Route path="/no-autorizado" element={withSuspense(<NoAutorizado />, "Cargando vista...")} />

            <Route path="/" element={withSuspense(<DashBoardView />, "Cargando dashboard...")} />
            <Route path="/atenciones" element={withSuspense(<ListAtencionesView />, "Cargando atenciones...")} />
            <Route path="/atenciones/filtrar" element={withSuspense(<ListAtencionesFilteredView />, "Cargando atenciones...")} />
            <Route path="/atenciones/create" element={withSuspense(<CreateAtencionView />, "Cargando formulario...")} />
            <Route path="/atenciones/:idAtencion/editar" element={withSuspense(<EditAtencionView />, "Cargando atención...")} />
            <Route path="/atenciones/:idAtencion" element={withSuspense(<AtencionView />, "Cargando atención...")} />

            <Route path="/pacientes" element={withSuspense(<ListPacientesView />, "Cargando pacientes...")} />
            <Route path="/pacientes/create" element={withSuspense(<CreatePacienteView />, "Cargando formulario...")} />
            <Route path="/pacientes/:idPaciente/editar" element={withSuspense(<EditPacienteView />, "Cargando paciente...")} />

            <Route element={<RoleProtectedRoute allowedRoles={["admin", "superadmin"]} />}>
              <Route path="/reports" element={withSuspense(<ReportesView />, "Cargando reportes...")} />
              <Route
                path="/reports/atenciones/:estado/:idUsuario"
                element={withSuspense(<ReportesAtencionesByEstadoView />, "Cargando reporte...")}
              />
              <Route
                path="/reports/atenciones/:estado/:idUsuario/:idAtencion/auditar"
                element={withSuspense(<AuditarAtencionView />, "Cargando auditoría...")}
              />

              <Route element={<RoleProtectedRoute allowedRoles={["superadmin"]} />}>
                <Route path="/config" element={withSuspense(<MenuConfigView />, "Cargando configuración...")} />
                <Route path="/config/usuarios" element={withSuspense(<ListUsuariosView />, "Cargando usuarios...")} />
                <Route path="/config/usuarios/create" element={withSuspense(<CreateUsuarioView />, "Cargando formulario...")} />
                <Route path="/config/usuarios/:idUsuario/editar" element={withSuspense(<EditUsuarioView />, "Cargando usuario...")} />

                <Route path="/config/obras-sociales" element={withSuspense(<ListObrasSocialesView />, "Cargando obras sociales...")} />
                <Route
                  path="/config/obras-sociales/create"
                  element={withSuspense(<CreateObraSocialView />, "Cargando formulario...")}
                />
                <Route
                  path="/config/obras-sociales/:idObraSocial/editar"
                  element={withSuspense(<EditObraSocialView />, "Cargando obra social...")}
                />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={withSuspense(<NotFound />, "Cargando vista...")} />
      </Routes>
    </BrowserRouter>
  );
}
