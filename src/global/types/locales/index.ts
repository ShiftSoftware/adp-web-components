import { InferType, object, string } from 'yup';

import { errorsSchema } from './error-schema';
import { partLookupSchema } from './part-lookup';
import { vehicleLookupSchema } from './vehicle-lookup';

export const ARABIC_JSON_FILE = 'ar.json';
export const ENGLISH_JSON_FILE = 'en.json';
export const KURDISH_JSON_FILE = 'ku.json';
export const RUSSIAN_JSON_FILE = 'ru.json';

export type LanguageKeys = 'en' | 'ar' | 'ku' | 'ru';

export const languageMapper = {
  ar: ARABIC_JSON_FILE,
  en: ENGLISH_JSON_FILE,
  ku: KURDISH_JSON_FILE,
  ru: RUSSIAN_JSON_FILE,
};

export const localeSchema = object({
  errors: errorsSchema,
  lang: string().required(),
  noData: string().required(),
  partLookup: partLookupSchema,
  language: string().required(),
  direction: string().required(),
  vehicleLookup: vehicleLookupSchema,
});

export type Locale = InferType<typeof localeSchema>;

export type ErrorKeys = keyof InferType<typeof errorsSchema> | null;
