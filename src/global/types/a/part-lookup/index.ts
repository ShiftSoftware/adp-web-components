import { object } from 'yup';

import { deadStockSchema } from './dead-stock-schema';
import { distributorSchema } from './distributor-schema';
import { manufacturerSchema } from './manufacturer-schema';

export const partLookupSchema = object({
  deadStock: deadStockSchema,
  distributor: distributorSchema,
  manufacturer: manufacturerSchema,
});
