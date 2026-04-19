import { Schema, model, Document, Types } from "mongoose";

export type AtencionStatus = "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";

export interface IAtencionCodigo {
  codigo: Types.ObjectId;
  pieza?: string;
  valor: number;
  status: AtencionStatus;
  observaciones?: string;
}

const AtencionCodigoSchema = new Schema<IAtencionCodigo>(
  {
    codigo: { type: Schema.Types.ObjectId, ref: "codigos", required: true },
    pieza: { type: String, trim: true },
    valor: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"],
      required: true,
      default: "Pendiente",
    },
    observaciones: { type: String },
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
  coseguro?: number;
  coseguroOdonto?: number;
}

const AtencionSchema: Schema = new Schema<IAtencion>(
  {
    fecha: { type: String, required: true },
    paciente: { type: Schema.Types.ObjectId, ref: "pacientes", required: true },
    usuario: { type: Schema.Types.ObjectId, ref: "usuarios", required: true },
    obraSocial: { type: Schema.Types.ObjectId, ref: "obras_sociales", required: true },
    codigos: { type: [AtencionCodigoSchema], required: true, default: [] },
    observaciones: { type: String },
    coseguro: { type: Number },
    coseguroOdonto: { type: Number },
  },
  {
    timestamps: true,
  },
);

export default model<IAtencion>("atenciones", AtencionSchema);
