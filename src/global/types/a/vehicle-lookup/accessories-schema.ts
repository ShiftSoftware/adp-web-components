import { object, string } from 'yup';

export const accessoriesSchema = object({
  vehicleAccessories: string().required(),
  noData: string().required(),
  partNumber: string().required(),
  description: string().required(),
  image: string().required(),
  expand: string().required(),
});
