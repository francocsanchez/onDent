import { Schema, model, Document } from "mongoose";

export interface ITipoRx extends Document {
  name: string;
  enable: boolean;
}

const TipoRxSchema: Schema = new Schema<ITipoRx>(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    enable: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
  },
);

TipoRxSchema.index({ name: 1 }, { unique: true });

export default model<ITipoRx>("tipos_rx", TipoRxSchema);
