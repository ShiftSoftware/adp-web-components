import { object } from 'yup';
import warrantySchema from './warranty/type';
import accessoriesSchema from './accessories/type';
import dynamicClaimSchema from './dynamicClaim/type';
import specificationSchema from './specification/type';
import paintThicknessSchema from './paintThickness/type';
import ServiceHistorySchema from './serviceHistory/type';

const vehicleLookupWrapperSchema = object({
  warranty: warrantySchema,
  accessories: accessoriesSchema,
  dynamicClaim: dynamicClaimSchema,
  specification: specificationSchema,
  paintThickness: paintThicknessSchema,
  serviceHistory: ServiceHistorySchema,
});

export default vehicleLookupWrapperSchema;
