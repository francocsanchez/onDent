import { Schema, model, Document } from "mongoose";

export interface IObraSocial extends Document {
  name: string;
  enable: boolean;
}

const ObraSocialSchema: Schema = new Schema<IObraSocial>(
  {
    name: { type: String, required: true, lowercase: true },
    enable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default model<IObraSocial>("obras_sociales", ObraSocialSchema);
