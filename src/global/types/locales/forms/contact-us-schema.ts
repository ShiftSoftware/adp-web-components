import { object, string } from 'yup';

export const contactUsSchema = object({
  fullName: string().required(),
  fullNameMinimum: string().required(),
  fullNameIsRequired: string().required(),
  emailAddress: string().required(),
  emailAddressNotValid: string().required(),
  city: string().required(),
  selectCity: string().required(),
  cityIsRequired: string().required(),
  phoneNumber: string().required(),
  phoneNumberIsRequired: string().required(),
  phoneNumberFormatInvalid: string().required(),
  inquiryType: string().required(),
  selectInquiryType: string().required(),
  inquiryTypeIsRequired: string().required(),
  writeAMessage: string().required(),
  leaveUsMessage: string().required(),
  messageIsRequired: string().required(),
});
