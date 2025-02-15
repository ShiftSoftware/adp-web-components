import { object, string } from 'yup';

export const generalSchema = object({
  close: string().required(),
  noSelectOptions: string().required(),
});
