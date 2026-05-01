import { Schema, model, Document } from "mongoose";

export interface IObraSocial extends Document {
  name: string;
  enable: boolean;
  limitePrestacionesMensuales?: number | null;
}

const ObraSocialSchema: Schema = new Schema<IObraSocial>(
  {
    name: { type: String, required: true, lowercase: true },
    enable: { type: Boolean, default: true },
    limitePrestacionesMensuales: { type: Number, default: null, min: 0 },
  },
  {
    timestamps: true,
  }
);

export default model<IObraSocial>("obras_sociales", ObraSocialSchema);
