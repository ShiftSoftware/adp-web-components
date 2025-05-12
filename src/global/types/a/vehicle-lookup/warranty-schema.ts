import { object, string } from 'yup';

export const warrantySchema = object({
  authorized: string().required(),
  unauthorized: string().required(),
  activeWarranty: string().required(),
  notActiveWarranty: string().required(),
  notInvoiced: string().required(),
  from: string().required(),
  to: string().required(),
  pendingSSC: string().required(),
  noPendingSSC: string().required(),
  checkingTMC: string().required(),
  sscCampings: string().required(),
  sscTableCode: string().required(),
  sscTableDescription: string().required(),
  sscTableRepairStatus: string().required(),
  sscTableOPCode: string().required(),
  sscTablePartNumber: string().required(),
});
