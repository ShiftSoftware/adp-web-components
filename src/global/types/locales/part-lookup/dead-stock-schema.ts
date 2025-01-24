import { object, string } from 'yup';

export const deadStockSchema = object({
  deadStock: string().required(),
  branch: string().required(),
  availableQuantity: string().required(),
});
