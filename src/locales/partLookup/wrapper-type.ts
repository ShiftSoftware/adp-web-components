import { object } from 'yup';
import deadStockSchema from './deadStock/type';
import distributerSchema from './distributor/type';
import manufacturerSchema from './manufacturer/type';

const partLookupSchema = object({
  deadStock: deadStockSchema,
  distributor: distributerSchema,
  manufacturer: manufacturerSchema,
});

export default partLookupSchema;
