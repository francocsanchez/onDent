import { z } from "zod";

export const obraSocialSchema = z.object({
  _id: z.string(),
  name: z.string(),
  enable: z.boolean(),
});

export const ObrasSocialesTableSchema = z.array(obraSocialSchema.pick({ _id: true, name: true, enable: true }));

export type ObraSocial = z.infer<typeof obraSocialSchema>;
export type ObraSocialFormData = Pick<ObraSocial, "name">;
