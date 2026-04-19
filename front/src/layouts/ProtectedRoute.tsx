import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (isError || !isAuthenticated) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
