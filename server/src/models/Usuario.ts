import { Schema, model, Document } from "mongoose";

export type UserRole = "superadmin" | "admin" | "odontologo";

export interface IUsuario extends Document {
  name: string;
  lastName: string;
  email: string;
  enable: boolean;
  password: string;
  role: UserRole;
}

const UsuarioSchema: Schema = new Schema<IUsuario>(
  {
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    enable: { type: Boolean, required: true, default: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "odontologo"],
      required: true,
      default: "odontologo",
    },
  },
  {
    timestamps: true,
  }
);

export default model<IUsuario>("usuarios", UsuarioSchema);
