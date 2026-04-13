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

export type Paciente = z.infer<typeof pacienteSchema>;
export type PacienteObraSocial = Paciente["obraSocial"];
export type PacienteFormData = {
  name: string;
  lastName: string;
  dni: number;
  obraSocial: string;
};
