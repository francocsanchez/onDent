import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ListObrasSocialesView from "@/views/obrasSociales/ListObrasSocialesView";
import MenuConfigView from "./views/MenuConfigView";
import CreateObraSocialView from "./views/obrasSociales/CreateObraSocialView";
import EditObraSocialView from "./views/obrasSociales/EditObraSocialView";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/config" element={<MenuConfigView />} />

          <Route path="/config/obras-sociales" element={<ListObrasSocialesView />} />
          <Route path="/config/obras-sociales/nueva" element={<CreateObraSocialView />} />
          <Route path="/config/obras-sociales/:idObraSocial/editar" element={<EditObraSocialView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
