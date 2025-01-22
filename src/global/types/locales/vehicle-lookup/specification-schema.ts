import { object, string } from 'yup';

export const specificationSchema = object({
  vehicleSpecification: string().required(),
  noData: string().required(),
  model: string().required(),
  variant: string().required(),
  katashiki: string().required(),
  modelYear: string().required(),
  sfx: string().required(),
});
