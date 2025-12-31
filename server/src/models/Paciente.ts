import { Schema, model, Document } from "mongoose";

export interface IPaciente extends Document {
  name: string;
  lastName: string;
  dni: number;
  password: string;
}

const PacienteSchema: Schema = new Schema<IPaciente>(
  {
    name: { type: String, required: true, lowercase: true },
    lastName: { type: String, required: true, lowercase: true },
    dni: { type: Number, required: true, unique: true, trim:true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default model<IPaciente>("pacientes", PacienteSchema);
