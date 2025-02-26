import { object, string } from 'yup';

import { contactUsSchema } from './contact-us-schema';
import { serviceBookingSchema } from './service-booking-schema';

export const FormsSchema = object({
  contactUs: contactUsSchema,
  serviceBooking: serviceBookingSchema,
  reCaptchaIsRequired: string().required(),
  inputValueIsIncorrect: string().required(),
});
