import { z } from "zod";

export const obraSocialSchema = z.object({
  _id: z.string(),
  name: z.string(),
  enable: z.boolean(),
  limitePrestacionesMensuales: z.number().int().nullable().optional(),
});

export const ObrasSocialesTableSchema = z.array(
  obraSocialSchema.pick({ _id: true, name: true, enable: true, limitePrestacionesMensuales: true }),
);

export type ObraSocial = z.infer<typeof obraSocialSchema>;
export type ObraSocialFormData = Pick<ObraSocial, "name" | "limitePrestacionesMensuales">;

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
  pieza: z.string().optional().default(""),
  valor: z.number(),
  status: z.enum(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"]),
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

export const atencionesAvailableFiltersSchema = z.object({
  availableYears: z.array(z.number()),
});

export const liquidacionItemSchema = z.object({
  atencionId: z.string(),
  codigoId: z.string(),
  fecha: z.string(),
  pieza: z.string().optional().default(""),
  usuario: z.object({
    _id: z.string(),
    name: z.string(),
    lastName: z.string(),
  }),
  paciente: z.object({
    dni: z.number(),
    name: z.string(),
    lastName: z.string(),
  }),
  obraSocial: z.object({
    _id: z.string(),
    name: z.string(),
  }),
  codigoAtencion: z.object({
    _id: z.string(),
    code: z.string(),
    description: z.string(),
  }),
  status: z.enum(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"]),
  valor: z.number(),
});

export const liquidacionesTableSchema = z.array(liquidacionItemSchema);

export const liquidacionesListResponseSchema = z.object({
  data: liquidacionesTableSchema,
  pagination: pacientesPaginationSchema,
});

export const liquidacionesAvailableFiltersSchema = z.object({
  availableYears: z.array(z.number()),
  usuarios: z.array(
    z.object({
      _id: z.string(),
      name: z.string(),
      lastName: z.string(),
      role: z.string(),
    }),
  ),
  obrasSociales: z.array(
    z.object({
      _id: z.string(),
      name: z.string(),
    }),
  ),
});

export const coseguroItemSchema = z.object({
  atencionId: z.string(),
  fecha: z.string(),
  paciente: z.object({
    dni: z.number(),
    name: z.string(),
    lastName: z.string(),
  }),
  coseguro: z.number(),
  coseguroOdonto: z.number(),
});

export const cosegurosTableSchema = z.array(coseguroItemSchema);

export const cosegurosListResponseSchema = z.object({
  data: cosegurosTableSchema,
  pagination: pacientesPaginationSchema,
});

export const atencionesDashPorDiaSchema = z.object({
  fecha: z.string(),
  dia: z.number(),
  cantidad: z.number(),
});

export const atencionesDashPorMesSchema = z.object({
  periodo: z.string(),
  anio: z.number(),
  mes: z.number(),
  cantidad: z.number(),
});

export const atencionesDashResumenMensualSchema = z.object({
  periodo: z.string(),
  anio: z.number(),
  mes: z.number(),
  cantidad: z.number(),
  montoAtencion: z.number(),
  montoCoseguro: z.number(),
  montoTotal: z.number(),
  ok: z.number(),
  pendiente: z.number(),
  denegado: z.number(),
  diferido: z.number(),
  noCargado: z.number(),
});

export const atencionesDashSchema = z.object({
  atencionesPorDiaMesActual: z.array(atencionesDashPorDiaSchema),
  atencionesPorMes: z.array(atencionesDashPorMesSchema),
  resumenMensual: z.array(atencionesDashResumenMensualSchema),
});

export const disponibilidadPrestacionesSchema = z.object({
  tieneLimiteConfigurado: z.boolean(),
  limiteMensual: z.number().int().nullable(),
  utilizadas: z.number(),
  disponibles: z.number().nullable(),
  mes: z.number(),
  anio: z.number(),
});

export const atencionStatusCounterSchema = z.object({
  OK: z.number(),
  Pendiente: z.number(),
  Denegado: z.number(),
  Diferido: z.number(),
  "No cargado": z.number(),
});

export const atencionesGlobalMontoPorUsuarioSchema = z.object({
  usuarioId: z.string(),
  nombre: z.string(),
  cantidadAtenciones: z.number(),
  montoAtencion: z.number(),
  montoCoseguroOdonto: z.number(),
  montoTotal: z.number(),
});

export const atencionesGlobalTopConsultaSchema = z.object({
  codigoId: z.string(),
  code: z.string(),
  description: z.string(),
  cantidad: z.number(),
  montoTotal: z.number(),
});

export const atencionesGlobalResumenAnualSchema = z.object({
  cantidadAtenciones: z.number(),
  cantidadPorEstado: atencionStatusCounterSchema,
  montoPorEstado: atencionStatusCounterSchema,
  montoPorUsuario: z.array(atencionesGlobalMontoPorUsuarioSchema),
  topConsultasCantidad: z.array(atencionesGlobalTopConsultaSchema),
  topConsultasMonto: z.array(atencionesGlobalTopConsultaSchema),
  montoAtencion: z.number(),
  montoCoseguroOdonto: z.number(),
  montoTotal: z.number(),
});

export const atencionesGlobalResumenMensualSchema = z.object({
  periodo: z.string(),
  anio: z.number(),
  mes: z.number(),
  cantidadAtenciones: z.number(),
  cantidadPorEstado: atencionStatusCounterSchema,
  montoPorEstado: atencionStatusCounterSchema,
  montoAtencion: z.number(),
  montoCoseguroOdonto: z.number(),
  montoTotal: z.number(),
});

export const atencionesGlobalReportSchema = z.object({
  availableYears: z.array(z.number()),
  selectedYear: z.number(),
  resumenAnual: atencionesGlobalResumenAnualSchema,
  resumenMensual: z.array(atencionesGlobalResumenMensualSchema),
});

export type DisponibilidadPrestaciones = z.infer<typeof disponibilidadPrestacionesSchema>;

export type Atencion = z.infer<typeof atencionSchema>;
export type AtencionCodigo = z.infer<typeof atencionCodigoSchema>;
export type Codigo = z.infer<typeof codigoSchema>;
export type AtencionesListResponse = z.infer<typeof atencionesListResponseSchema>;
export type AtencionesAvailableFilters = z.infer<typeof atencionesAvailableFiltersSchema>;
export type LiquidacionItem = z.infer<typeof liquidacionItemSchema>;
export type LiquidacionesListResponse = z.infer<typeof liquidacionesListResponseSchema>;
export type LiquidacionesAvailableFilters = z.infer<typeof liquidacionesAvailableFiltersSchema>;
export type CoseguroItem = z.infer<typeof coseguroItemSchema>;
export type CosegurosListResponse = z.infer<typeof cosegurosListResponseSchema>;
export type AtencionesDash = z.infer<typeof atencionesDashSchema>;
export type AtencionStatusCounter = z.infer<typeof atencionStatusCounterSchema>;
export type AtencionesGlobalMontoPorUsuario = z.infer<typeof atencionesGlobalMontoPorUsuarioSchema>;
export type AtencionesGlobalTopConsulta = z.infer<typeof atencionesGlobalTopConsultaSchema>;
export type AtencionesGlobalResumenAnual = z.infer<typeof atencionesGlobalResumenAnualSchema>;
export type AtencionesGlobalResumenMensual = z.infer<typeof atencionesGlobalResumenMensualSchema>;
export type AtencionesGlobalReport = z.infer<typeof atencionesGlobalReportSchema>;
