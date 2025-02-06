import { object, string } from 'yup';

import { contactUsSchema } from './contact-us-schema';

export const FormsSchema = object({
  contactUs: contactUsSchema,
  inputValueIsIncorrect: string().required(),
});
