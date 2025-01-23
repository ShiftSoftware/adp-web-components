import { object, string } from 'yup';

export const errorsSchema = object({
  wildCard: string().required(),
  noBaseUrl: string().required(),
  noServiceAvailable: string().required(),
  wrongResponseFormat: string().required(),
});
