import { useAuth } from "./useAuth";

type Role = string;

export default function useRoleGuard(allowedRoles: Role[]) {
  const { user } = useAuth();

  const roles = Array.isArray(user?.role) ? user?.role : user?.role ? [user.role] : [];

  const hasAccess = roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return {
      allowed: false,
      message: "No posee permisos para acceder a esta sección.",
    };
  }

  return {
    allowed: true,
    message: null,
  };
}
