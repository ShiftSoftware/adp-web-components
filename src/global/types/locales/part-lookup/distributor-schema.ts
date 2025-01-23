import { object, string } from 'yup';

export const distributorSchema = object({
  info: string().required(),
  distributorStock: string().required(),
  availability: string().required(),
  notAvailable: string().required(),
  partiallyAvailable: string().required(),
  available: string().required(),
  location: string().required(),
  description: string().required(),
  productGroup: string().required(),
  postLocalDescription: string().required(),
  dealerPurchasePrice: string().required(),
  recommendedRetailPrice: string().required(),
  supersededFrom: string().required(),
  supersededTo: string().required(),
});
