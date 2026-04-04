import { Schema, model, Document, Types } from "mongoose";

export interface IPaciente extends Document {
  name: string;
  lastName: string;
  dni: number;
  obraSocial: Types.ObjectId;
}

const PacienteSchema: Schema = new Schema<IPaciente>(
  {
    name: { type: String, required: true, lowercase: true },
    lastName: { type: String, required: true, lowercase: true },
    dni: { type: Number, required: true, unique: true, trim: true },
    obraSocial: { type: Schema.Types.ObjectId, ref: "obras_sociales", required: true },
  },
  {
    timestamps: true,
  }
);

export default model<IPaciente>("pacientes", PacienteSchema);
