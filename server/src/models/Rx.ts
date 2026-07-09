import { Schema, model, Document, Types } from "mongoose";

export type RxDerivanteTipo = "interno" | "externo";

export interface IRx extends Document {
  fecha: string;
  paciente: Types.ObjectId;
  derivanteTipo: RxDerivanteTipo;
  derivanteUsuario?: Types.ObjectId;
  derivanteExterno?: string;
  tipoRx: Types.ObjectId;
  valor: number;
  usuarioCarga: Types.ObjectId;
  observacion?: string;
}

const RxSchema: Schema = new Schema<IRx>(
  {
    fecha: { type: String, required: true },
    paciente: { type: Schema.Types.ObjectId, ref: "pacientes", required: true },
    derivanteTipo: {
      type: String,
      enum: ["interno", "externo"],
      required: true,
    },
    derivanteUsuario: { type: Schema.Types.ObjectId, ref: "usuarios" },
    derivanteExterno: { type: String, trim: true },
    tipoRx: { type: Schema.Types.ObjectId, ref: "tipos_rx", required: true },
    valor: { type: Number, required: true, min: 0 },
    usuarioCarga: { type: Schema.Types.ObjectId, ref: "usuarios", required: true },
    observacion: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

RxSchema.index({ paciente: 1, fecha: -1, _id: -1 });

export default model<IRx>("rx", RxSchema);
