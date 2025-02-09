import { object, string } from 'yup';

import { contactUsSchema } from './contact-us-schema';

export const FormsSchema = object({
  contactUs: contactUsSchema,
  reCaptchaIsRequired: string().required(),
  inputValueIsIncorrect: string().required(),
});
