import yupTypeMapper from '~lib/yup-type-mapper';

const dynamicRedeemSchema = yupTypeMapper([
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

export default dynamicRedeemSchema;
