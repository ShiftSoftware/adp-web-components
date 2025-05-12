import yupTypeMapper from '~lib/yup-type-mapper';

const dynamicClaimSchema = yupTypeMapper([
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
]);

export default dynamicClaimSchema;
