import { Outlet } from "react-router-dom";
import MenuAppLayout from "./MenuAppLayout";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <MenuAppLayout />

        <main className="flex-1 bg-white  lg:w-10/12 ">
          <div className="flex min-h-full flex-col   bg-white p-4 shadow-[0_30px_80px_-60px_rgba(14,124,114,0.45)] sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
