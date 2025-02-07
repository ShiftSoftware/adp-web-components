import { object, string } from 'yup';

export const contactUsSchema = object({
  fullName: string().required(),
  fullNameMinimum: string().required(),
  fullNameIsRequired: string().required(),
  emailAddress: string().required(),
  emailAddressNotValid: string().required(),
  city: string().required(),
  selectCity: string().required(),
});
