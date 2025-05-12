import { object, string } from 'yup';

export const manufacturerSchema = object({
  origin: string().required(),
  warrantyPrice: string().required(),
  specialPrice: string().required(),
  wholesalesPrice: string().required(),
  pnc: string().required(),
  pncName: string().required(),
  binCode: string().required(),
  dimension1: string().required(),
  dimension2: string().required(),
  dimension3: string().required(),
  netWeight: string().required(),
  grossWeight: string().required(),
  cubicMeasure: string().required(),
  hsCode: string().required(),
  uzHsCode: string().required(),
});
