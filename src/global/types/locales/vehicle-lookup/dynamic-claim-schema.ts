import { object, string } from 'yup';

export const dynamicClaimSchema = object({
  serviceType: string().required(),
  activationDate: string().required(),
  expireDate: string().required(),
  claimAt: string().required(),
  redeemingDealer: string().required(),
  invoiceNumber: string().required(),
  wip: string().required(),
  menuCode: string().required(),
  claim: string().required(),
  processed: string().required(),
  expired: string().required(),
  cancelled: string().required(),
  pending: string().required(),
  warning: string().required(),
});
