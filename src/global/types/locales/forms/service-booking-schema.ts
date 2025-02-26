import { object, string } from 'yup';

export const serviceBookingSchema = object({
  vehicle: string().required(),
  vehicleSelection: string().required(),
});
