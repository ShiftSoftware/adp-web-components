import { object, InferType } from 'yup';

import yupTypeMapper from '~lib/yup-type-mapper';

export const claimFormSchema = yupTypeMapper([
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

export type ClaimFormType = InferType<typeof claimFormSchema>;

const claimableItemsSchema = object({
  claimForm: claimFormSchema,
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

export default claimableItemsSchema;
