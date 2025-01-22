import { object, string } from 'yup';

export const errorsSchema = object({
  wrongResponseFormat: string().required(),
});
