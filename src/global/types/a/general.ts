import { object, string } from 'yup';

export const generalSchema = object({
  close: string().required(),
  submit: string().required(),
  noSelectOptions: string().required(),
  formSubmittedSuccessfully: string().required(),
});
