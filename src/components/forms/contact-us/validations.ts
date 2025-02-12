import { InferType, object, string } from 'yup';

export const contactUsSchema = object({
  cityId: string(),
  email: string().email('emailAddressNotValid'),
  message: string().required('messageIsRequired'),
  generalTicketType: string().required('inquiryTypeIsRequired'),
  name: string().required('fullNameIsRequired').min(3, 'fullNameMinimum'),
  phone: string()
    .required('phoneNumberIsRequired')
    .transform(value => value.replace(/^0/, ''))
    .matches(/^\d+$/, 'phoneNumberFormatInvalid')
    .length(10, 'phoneNumberFormatInvalid'),
});

export type ContactUs = InferType<typeof contactUsSchema>;
