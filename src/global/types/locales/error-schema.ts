import { object, string } from 'yup';

export const errorsSchema = object({
  wildCard: string().required(),
  noBaseUrl: string().required(),
  invalidVin: string().required(),
  noPartsFound: string().required(),
  vinNumberRequired: string().required(),
  partNumberRequired: string().required(),
  noServiceAvailable: string().required(),
  wrongResponseFormat: string().required(),
  requestFailedPleaseTryAgainLater: string().required(),
});
