import { Schema, model, Document, Types } from "mongoose";

export const CONTROL_FACTURACION_PIEZAS = [
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "51",
  "52",
  "53",
  "54",
  "55",
  "61",
  "62",
  "63",
  "64",
  "65",
  "71",
  "72",
  "73",
  "74",
  "75",
  "81",
  "82",
  "83",
  "84",
] as const;

export const CONTROL_FACTURACION_CARAS = ["Oclusal", "Vestibular", "Mesial", "Distal", "Lingual", "Palatino"] as const;

export type ControlFacturacionPieza = (typeof CONTROL_FACTURACION_PIEZAS)[number];
export type ControlFacturacionCara = (typeof CONTROL_FACTURACION_CARAS)[number];

export interface IControlFacturacionItem {
  codigo: Types.ObjectId;
  pieza?: ControlFacturacionPieza;
  cara?: ControlFacturacionCara;
}

export interface IControlFacturacion extends Document {
  periodoMes: number;
  periodoAnio: number;
  paciente: Types.ObjectId;
  obraSocial: Types.ObjectId;
  usuario: Types.ObjectId;
  items: IControlFacturacionItem[];
}

const ControlFacturacionItemSchema = new Schema<IControlFacturacionItem>(
  {
    codigo: { type: Schema.Types.ObjectId, ref: "codigos", required: true },
    pieza: { type: String, enum: CONTROL_FACTURACION_PIEZAS, trim: true },
    cara: { type: String, enum: CONTROL_FACTURACION_CARAS, trim: true },
  },
  { _id: false },
);

const ControlFacturacionSchema = new Schema<IControlFacturacion>(
  {
    periodoMes: { type: Number, required: true, min: 1, max: 12 },
    periodoAnio: { type: Number, required: true, min: 2000, max: 9999 },
    paciente: { type: Schema.Types.ObjectId, ref: "pacientes", required: true },
    obraSocial: { type: Schema.Types.ObjectId, ref: "obras_sociales", required: true },
    usuario: { type: Schema.Types.ObjectId, ref: "usuarios", required: true },
    items: { type: [ControlFacturacionItemSchema], required: true, default: [] },
  },
  {
    timestamps: true,
  },
);

ControlFacturacionSchema.index({ periodoAnio: -1, periodoMes: -1, createdAt: -1 });
ControlFacturacionSchema.index({ paciente: 1, periodoAnio: -1, periodoMes: -1 });
ControlFacturacionSchema.index({ obraSocial: 1, periodoAnio: -1, periodoMes: -1 });

export default model<IControlFacturacion>("control_facturacion", ControlFacturacionSchema);
