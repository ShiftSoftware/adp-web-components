import { object, InferType } from 'yup';

import yupTypeMapper from '~lib/yup-type-mapper';

export const dynamicRedeemSchema = yupTypeMapper([
  'serviceType',
  'name',
  'activationDate',
  'expireDate',
  'packageCode',
  'scanTheVoucher',
  'qrCode',
  'processing',
  'warning',
  'skipServicesWarning',
  'confirmSkipServices',
  'notInvoiced',
  'confirmNotInvoiced',
  'enterServiceInfo',
  'invoice',
  'jobNumber',
  'claim',
]);

export type DynamicRedeemType = InferType<typeof dynamicRedeemSchema>;

const dynamicClaimSchema = object({
  dynamicRedeem: dynamicRedeemSchema,
}).concat(
  yupTypeMapper([
    'serviceType',
    'activationDate',
    'expireDate',
    'claimAt',
    'claimingCompany',
    'invoiceNumber',
    'jobNumber',
    'packageCode',
    'claim',
    'processed',
    'expired',
    'cancelled',
    'pending',
    'warning',
    'activateNow',
    'activationRequired',
    'warrantyAndServicesNotActivated',
  ]),
);

export default dynamicClaimSchema;
