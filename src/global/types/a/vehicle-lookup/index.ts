import { object } from 'yup';

import { warrantySchema } from './warranty-schema';
import { accessoriesSchema } from './accessories-schema';
import { dynamicClaimSchema } from './dynamic-claim-schema';
import { specificationSchema } from './specification-schema';
import { dynamicRedeemSchema } from './dynamic-redeem-schema';
import { ServiceHistorySchema } from './service-history-schema';
import { paintThicknessSchema } from './paint-thickness-schema';

export const vehicleLookupSchema = object({
  warranty: warrantySchema,
  accessories: accessoriesSchema,
  dynamicClaim: dynamicClaimSchema,
  dynamicRedeem: dynamicRedeemSchema,
  specification: specificationSchema,
  serviceHistory: ServiceHistorySchema,
  paintThickness: paintThicknessSchema,
});
