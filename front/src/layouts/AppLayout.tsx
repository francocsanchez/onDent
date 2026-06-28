import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import MenuAppLayout from "./MenuAppLayout";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1800px] items-start">
        <MenuAppLayout
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onClose={() => setIsSidebarOpen(false)}
          onToggleCollapsed={() => setIsSidebarCollapsed((currentValue) => !currentValue)}
        />

        <main className="min-w-0 flex-1 bg-white lg:w-10/12">
          <div className="sticky top-0 z-20 border-b border-secondary-dark/40 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-secondary-dark/60 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
            >
              <Menu className="h-4 w-4" strokeWidth={2.2} />
              <span>Menú</span>
            </button>
          </div>

          <div className="flex min-h-full flex-col bg-white p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
