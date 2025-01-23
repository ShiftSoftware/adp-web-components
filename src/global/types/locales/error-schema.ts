import { object, string } from 'yup';

export const errorsSchema = object({
  noServiceAvailable: string().required(),
  wrongResponseFormat: string().required(),
});
