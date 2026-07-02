import { Document, Schema, Types, model } from "mongoose";

export interface IPagoOdontologoCodigoPagado {
  rowIndex: number;
  codigoId: Types.ObjectId;
  code: string;
  description: string;
  pieza?: string;
  valor: number;
  coseguro: number;
}

export interface IPagoOdontologoItem {
  atencion: Types.ObjectId;
  fechaAtencion: string;
  paciente: {
    dni: number;
    name: string;
    lastName: string;
  };
  codigosPagados: IPagoOdontologoCodigoPagado[];
  montoAtencionPagado: number;
  montoCoseguroOdontoPagado: number;
  montoTotalPagado: number;
}

export interface IPagoOdontologo extends Document {
  usuario: Types.ObjectId;
  periodoPago: string;
  fechaPago: string;
  totalAtencion: number;
  totalCoseguroOdonto: number;
  totalGeneral: number;
  items: IPagoOdontologoItem[];
}

const PagoOdontologoCodigoPagadoSchema = new Schema<IPagoOdontologoCodigoPagado>(
  {
    rowIndex: { type: Number, required: true },
    codigoId: { type: Schema.Types.ObjectId, required: true },
    code: { type: String, required: true },
    description: { type: String, required: true },
    pieza: { type: String },
    valor: { type: Number, required: true },
    coseguro: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const PagoOdontologoItemSchema = new Schema<IPagoOdontologoItem>(
  {
    atencion: { type: Schema.Types.ObjectId, ref: "atenciones", required: true },
    fechaAtencion: { type: String, required: true },
    paciente: {
      dni: { type: Number, required: true },
      name: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    codigosPagados: { type: [PagoOdontologoCodigoPagadoSchema], required: true, default: [] },
    montoAtencionPagado: { type: Number, required: true, default: 0 },
    montoCoseguroOdontoPagado: { type: Number, required: true, default: 0 },
    montoTotalPagado: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const PagoOdontologoSchema = new Schema<IPagoOdontologo>(
  {
    usuario: { type: Schema.Types.ObjectId, ref: "usuarios", required: true },
    periodoPago: { type: String, required: true },
    fechaPago: { type: String, required: true },
    totalAtencion: { type: Number, required: true, default: 0 },
    totalCoseguroOdonto: { type: Number, required: true, default: 0 },
    totalGeneral: { type: Number, required: true, default: 0 },
    items: { type: [PagoOdontologoItemSchema], required: true, default: [] },
  },
  {
    timestamps: true,
  },
);

export default model<IPagoOdontologo>("pagos_odontologos", PagoOdontologoSchema);
