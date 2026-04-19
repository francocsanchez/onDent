import { z } from "zod";

export const obraSocialSchema = z.object({
  _id: z.string(),
  name: z.string(),
  enable: z.boolean(),
});

export const ObrasSocialesTableSchema = z.array(obraSocialSchema.pick({ _id: true, name: true, enable: true }));

export type ObraSocial = z.infer<typeof obraSocialSchema>;
export type ObraSocialFormData = Pick<ObraSocial, "name">;

export const usuarioSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  enable: z.boolean(),
  email: z.string(),
  role: z.string(),
});

export const UsuariosTableSchema = z.array(usuarioSchema.pick({ _id: true, name: true, lastName: true, enable: true, email: true, role: true }));

export type Usuario = z.infer<typeof usuarioSchema>;
export type UsuarioFormData = Pick<Usuario, "name" | "lastName" | "email" | "role">;

export const pacienteSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  dni: z.number(),
  obraSocial: z.object({
    _id: z.string(),
    name: z.string(),
  }),
});

export const PacientesTableSchema = z.array(
  pacienteSchema.pick({
    _id: true,
    name: true,
    lastName: true,
    dni: true,
    obraSocial: true,
  }),
);

export const pacientesPaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export const pacientesListResponseSchema = z.object({
  data: PacientesTableSchema,
  pagination: pacientesPaginationSchema,
});

export type Paciente = z.infer<typeof pacienteSchema>;
export type PacienteObraSocial = Paciente["obraSocial"];
export type PacientesPagination = z.infer<typeof pacientesPaginationSchema>;
export type PacientesListResponse = z.infer<typeof pacientesListResponseSchema>;
export type PacienteFormData = {
  name: string;
  lastName: string;
  dni: number;
  obraSocial: string;
};

export const codigoSchema = z.object({
  _id: z.string(),
  code: z.string(),
  description: z.string(),
  obraSocial: z.string(),
});

export const atencionCodigoSchema = z.object({
  codigo: codigoSchema,
  pieza: z.string(),
  valor: z.number(),
  status: z.enum(["OK", "Pendiente", "Denegado", "Diferido"]),
  observaciones: z.string().optional(),
});

export const atencionSchema = z.object({
  _id: z.string(),
  fecha: z.string(),

  paciente: z.object({
    _id: z.string(),
    name: z.string(),
    lastName: z.string(),
    dni: z.number(),
    obraSocial: z.string(),
  }),

  usuario: z.object({
    _id: z.string(),
    name: z.string(),
    lastName: z.string(),
    enable: z.boolean(),
    email: z.string(),
    role: z.string(),
  }),

  obraSocial: obraSocialSchema,

  codigos: z.array(atencionCodigoSchema),

  observaciones: z.string().optional(),
  coseguro: z.number().optional(),
  coseguroOdonto: z.number().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AtencionesTableSchema = z.array(atencionSchema);
export const atencionesListResponseSchema = z.object({
  data: AtencionesTableSchema,
  pagination: pacientesPaginationSchema,
});

export type Atencion = z.infer<typeof atencionSchema>;
export type AtencionCodigo = z.infer<typeof atencionCodigoSchema>;
export type Codigo = z.infer<typeof codigoSchema>;
export type AtencionesListResponse = z.infer<typeof atencionesListResponseSchema>;
