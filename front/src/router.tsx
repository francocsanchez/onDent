import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ListObrasSocialesView from "@/views/obrasSociales/ListObrasSocialesView";
import MenuConfigView from "./views/MenuConfigView";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/config" element={<MenuConfigView />} />
          <Route path="/config/obras-sociales" element={<ListObrasSocialesView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
