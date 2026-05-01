import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const handleImputErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    res.status(422).json({
      data: null,
      message: validationErrors[0]?.msg || "Datos inválidos",
      errors: validationErrors,
    });
    return;
  }

  next();
};
