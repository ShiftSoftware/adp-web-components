import { object } from 'yup';

import { warrantySchema } from './warranty-schema';
import { accessoriesSchema } from './accessories-schema';
import { specificationSchema } from './specification-schema';

export const vehicleLookupSchema = object({
  warranty: warrantySchema,
  accessories: accessoriesSchema,
  specification: specificationSchema,
});
