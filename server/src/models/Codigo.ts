import { Schema, model, Document, Types } from "mongoose";

export interface ICodigo extends Document {
  code: string;
  description: string;
  obraSocial: Types.ObjectId;
  enable: boolean;
}

const CodigoSchema: Schema = new Schema<ICodigo>(
  {
    code: { type: String, required: true, trim: true },
    description: { type: String, required: true, lowercase: true },
    obraSocial: { type: Schema.Types.ObjectId, ref: "obras_sociales", required: true },
    enable: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
  },
);

CodigoSchema.index({ obraSocial: 1 });
CodigoSchema.index({ code: 1, obraSocial: 1 }, { unique: true });

export default model<ICodigo>("codigos", CodigoSchema);
