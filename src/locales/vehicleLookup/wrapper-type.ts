import { object } from 'yup';
import warrantySchema from './warranty/type';
import accessoriesSchema from './accessories/type';
import dynamicClaimSchema from './dynamicClaim/type';
import dynamicRedeemSchema from './dynamicRedeem/type';
import specificationSchema from './specification/type';
import paintThicknessSchema from './paintThickness/type';
import ServiceHistorySchema from './serviceHistory/type';

const vehicleLookupSchema = object({
  accessories: accessoriesSchema,
  dynamicClaim: dynamicClaimSchema,
  dynamicRedeem: dynamicRedeemSchema,
  paintThickness: paintThicknessSchema,
  serviceHistory: ServiceHistorySchema,
  specification: specificationSchema,
  warranty: warrantySchema,
});

export default vehicleLookupSchema;
