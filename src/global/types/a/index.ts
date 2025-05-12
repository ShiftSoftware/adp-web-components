import { InferType, object, string } from 'yup';

import { FormsSchema } from './forms';
import { generalSchema } from './general';
import { errorsSchema } from './error-schema';
import { partLookupSchema } from './part-lookup';
import { vehicleLookupSchema } from './vehicle-lookup';
import { generalTicketTypesSchema } from './inquiryTypes';

export const localeSchema = object({
  forms: FormsSchema,
  errors: errorsSchema,
  general: generalSchema,
  lang: string().required(),
  noData: string().required(),
  partLookup: partLookupSchema,
  language: string().required(),
  direction: string().required(),
  vehicleLookup: vehicleLookupSchema,
  generalTicketTypes: generalTicketTypesSchema,
});

export type Locale = InferType<typeof localeSchema>;

export type ErrorKeys = keyof InferType<typeof errorsSchema> | null;
