import { object } from 'yup';

import { warrantySchema } from './warranty-schema';
import { accessoriesSchema } from './accessories-schema';
import { specificationSchema } from './specification-schema';
import { ServiceHistorySchema } from './service-history-schema';
import { paintThicknessSchema } from './paint-thickness-schema';

export const vehicleLookupSchema = object({
  warranty: warrantySchema,
  accessories: accessoriesSchema,
  specification: specificationSchema,
  serviceHistory: ServiceHistorySchema,
  paintThickness: paintThicknessSchema,
});
