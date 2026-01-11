import { Schema, model, Document, Types } from "mongoose";

export type AtencionStatus = "OK" | "Pendiente" | "Rechazado";

export interface IAtencionCodigo {
  codigo: string;
  pieza: string;
  valor?: number;
  valorOdonto?: number;
  status: AtencionStatus;
  observaciones?: string;
}

export interface IAtencion extends Document {
  fecha: string;
  paciente: Types.ObjectId;
  usuario: Types.ObjectId;
  obraSocial: Types.ObjectId;
  codigos: IAtencionCodigo[];
  observaciones?: string;
  coseguro?: number;
  coseguroOdonto?: number;
}

const AtencionCodigoSchema = new Schema<IAtencionCodigo>(
  {
    codigo: { type: String, required: true, trim: true },
    pieza: { type: String, required: true, trim: true },
    valor: { type: Number },
    valorOdonto: { type: Number },
    status: {
      type: String,
      enum: ["OK", "Pendiente", "Rechazado"],
      required: true,
      default: "Pendiente",
    },
    observaciones: { type: String },
  },
  { _id: false }
);

const AtencionSchema: Schema = new Schema<IAtencion>(
  {
    fecha: { type: String, required: true },
    paciente: { type: Schema.Types.ObjectId, ref: "pacientes", required: true },
    usuario: { type: Schema.Types.ObjectId, ref: "usuarios", required: true },
    obraSocial: { type: Schema.Types.ObjectId, ref: "obrasSociales", required: true },
    codigos: { type: [AtencionCodigoSchema], required: true, default: [] },
    observaciones: { type: String },
    coseguro: { type: Number },
    coseguroOdonto: { type: Number },
  },
  {
    timestamps: true,
  }
);

export default model<IAtencion>("atenciones", AtencionSchema);
