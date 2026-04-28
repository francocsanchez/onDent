import { NextFunction, Request, Response } from "express";

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        data: null,
        message: "No tenés permisos para acceder a este recurso",
      });
    }

    next();
  };
}
