import { object } from 'yup';

import { warrantySchema } from './warranty-schema';
import { specificationSchema } from './specification-schema';

export const vehicleLookupSchema = object({
  warranty: warrantySchema,
  specification: specificationSchema,
});
