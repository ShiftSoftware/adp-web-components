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
});
