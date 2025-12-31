import { Schema, model, Document } from "mongoose";

export interface IUsuario extends Document {
  email: string;
  password: string;
}

const UsuarioSchema: Schema = new Schema<IUsuario>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default model<IUsuario>("usuarios", UsuarioSchema);
