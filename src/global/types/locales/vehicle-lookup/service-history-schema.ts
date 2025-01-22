import { object, string } from 'yup';

export const ServiceHistorySchema = object({
  serviceHistory: string().required(),
  noData: string().required(),
  branch: string().required(),
  dealer: string().required(),
  invoiceNumber: string().required(),
  date: string().required(),
  serviceType: string().required(),
  odometer: string().required(),
});
