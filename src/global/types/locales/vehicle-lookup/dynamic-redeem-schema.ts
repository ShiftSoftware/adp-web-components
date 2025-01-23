import { object, string } from 'yup';

export const dynamicRedeemSchema = object({
  serviceType: string().required(),
  name: string().required(),
  activationDate: string().required(),
  expireDate: string().required(),
  menuCode: string().required(),
  scanTheInvoice: string().required(),
  processing: string().required(),
  warning: string().required(),
  skipServicesWarning: string().required(),
  confirmSkipServices: string().required(),
  notInvoiced: string().required(),
  confirmNotInvoiced: string().required(),

  claimAt: string().required(),
  redeemingDealer: string().required(),
  invoiceNumber: string().required(),
  wip: string().required(),
  claim: string().required(),
  processed: string().required(),
  expired: string().required(),
  cancelled: string().required(),
  pending: string().required(),
});
