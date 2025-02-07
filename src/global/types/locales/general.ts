import { object, string } from 'yup';

export const generalSchema = object({
  noSelectOptions: string().required(),
});
