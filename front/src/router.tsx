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
const CosegurosView = lazy(() => import("./views/atenciones/CosegurosView"));
const LiquidacionesView = lazy(() => import("./views/atenciones/LiquidacionesView"));
const PagosOdontologosView = lazy(() => import("./views/atenciones/PagosOdontologosView"));
const ListPacientesView = lazy(() => import("./views/pacientes/ListPacientesView"));
const CreatePacienteView = lazy(() => import("./views/pacientes/CreatePacienteView"));
const EditPacienteView = lazy(() => import("./views/pacientes/EditPacienteView"));
const PacienteAtencionesView = lazy(() => import("./views/pacientes/PacienteAtencionesView"));
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
const ListRxView = lazy(() => import("./views/rx/ListRxView"));
const CreateRxView = lazy(() => import("./views/rx/CreateRxView"));
const ListTiposRxView = lazy(() => import("./views/tiposRx/ListTiposRxView"));
const CreateTipoRxView = lazy(() => import("./views/tiposRx/CreateTipoRxView"));
const EditTipoRxView = lazy(() => import("./views/tiposRx/EditTipoRxView"));
const ListControlFacturacionView = lazy(() => import("./views/controlFacturacion/ListControlFacturacionView"));
const CreateControlFacturacionView = lazy(() => import("./views/controlFacturacion/CreateControlFacturacionView"));
const ControlFacturacionPacienteDetailView = lazy(() => import("./views/controlFacturacion/ControlFacturacionPacienteDetailView"));

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
            <Route path="/pacientes/:idPaciente/atenciones" element={withSuspense(<PacienteAtencionesView />, "Cargando atenciones...")} />

            <Route element={<RoleProtectedRoute allowedRoles={["rayos", "superadmin"]} />}>
              <Route path="/rx" element={withSuspense(<ListRxView />, "Cargando RX...")} />
              <Route path="/rx/create" element={withSuspense(<CreateRxView />, "Cargando formulario...")} />
            </Route>

            <Route element={<RoleProtectedRoute allowedRoles={["admin", "superadmin"]} />}>
              <Route path="/coseguros" element={withSuspense(<CosegurosView />, "Cargando coseguros...")} />
              <Route path="/liquidaciones" element={withSuspense(<LiquidacionesView />, "Cargando liquidaciones...")} />
              <Route path="/pagos" element={withSuspense(<PagosOdontologosView />, "Cargando pagos...")} />
              <Route path="/atenciones/:idAtencion/auditar" element={withSuspense(<AuditarAtencionView />, "Cargando auditoría...")} />
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
                <Route
                  path="/control-facturacion"
                  element={withSuspense(<ListControlFacturacionView />, "Cargando control de facturación...")}
                />
                <Route
                  path="/control-facturacion/create"
                  element={withSuspense(<CreateControlFacturacionView />, "Cargando formulario...")}
                />
                <Route
                  path="/control-facturacion/paciente/:idPaciente"
                  element={withSuspense(<ControlFacturacionPacienteDetailView />, "Cargando cargas del paciente...")}
                />
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
                <Route path="/config/tipos-rx" element={withSuspense(<ListTiposRxView />, "Cargando tipos de RX...")} />
                <Route path="/config/tipos-rx/create" element={withSuspense(<CreateTipoRxView />, "Cargando formulario...")} />
                <Route path="/config/tipos-rx/:idTipoRx/editar" element={withSuspense(<EditTipoRxView />, "Cargando tipo de RX...")} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={withSuspense(<NotFound />, "Cargando vista...")} />
      </Routes>
    </BrowserRouter>
  );
}
