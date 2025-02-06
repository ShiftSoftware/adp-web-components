import { object, string } from 'yup';

export const contactUsSchema = object({
  fullName: string().required(),
  fullNameMinimum: string().required(),
  fullNameIsRequired: string().required(),
});
