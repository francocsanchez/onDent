import { Schema, model, Document, Types } from "mongoose";

export type AtencionStatus = "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";

export interface IAtencionCodigo {
  codigo: Types.ObjectId;
  pieza?: string;
  valor: number;
  coseguro?: number;
  status: AtencionStatus;
  observaciones?: string;
  pagadoOdonto?: boolean;
  pagadoOdontoAt?: string;
  pagadoOdontoPagoId?: Types.ObjectId;
  pagadoOdontoPeriodo?: string;
}

export interface IOdontologoPagos {
  coseguroOdontoPagado?: number;
  totalPagado?: number;
  lastPaidAt?: string;
  lastPeriodoPago?: string;
}

const AtencionCodigoSchema = new Schema<IAtencionCodigo>(
  {
    codigo: { type: Schema.Types.ObjectId, ref: "codigos", required: true },
    pieza: { type: String, trim: true },
    valor: { type: Number, default: 0 },
    coseguro: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"],
      required: true,
      default: "Pendiente",
    },
    observaciones: { type: String },
    pagadoOdonto: { type: Boolean, default: false },
    pagadoOdontoAt: { type: String },
    pagadoOdontoPagoId: { type: Schema.Types.ObjectId, ref: "pagos_odontologos" },
    pagadoOdontoPeriodo: { type: String },
  },
  { _id: false },
);

export interface IAtencion extends Document {
  fecha: string;
  paciente: Types.ObjectId;
  usuario: Types.ObjectId;
  obraSocial: Types.ObjectId;
  codigos: IAtencionCodigo[];
  observaciones?: string;
  coseguroOdonto?: number;
  odontologoPagos?: IOdontologoPagos;
}

const AtencionSchema: Schema = new Schema<IAtencion>(
  {
    fecha: { type: String, required: true },
    paciente: { type: Schema.Types.ObjectId, ref: "pacientes", required: true },
    usuario: { type: Schema.Types.ObjectId, ref: "usuarios", required: true },
    obraSocial: { type: Schema.Types.ObjectId, ref: "obras_sociales", required: true },
    codigos: { type: [AtencionCodigoSchema], required: true, default: [] },
    observaciones: { type: String },
    coseguroOdonto: { type: Number },
    odontologoPagos: {
      coseguroOdontoPagado: { type: Number, default: 0 },
      totalPagado: { type: Number, default: 0 },
      lastPaidAt: { type: String },
      lastPeriodoPago: { type: String },
    },
  },
  {
    timestamps: true,
  },
);

export default model<IAtencion>("atenciones", AtencionSchema);
