import { Build } from '@stencil/core';
import { InferType, object, string } from 'yup';
import { errorsSchema } from './locales/error-schema';
import { vehicleLookupSchema } from './locales/vehicle-lookup';

export const ARABIC_JSON_FILE = 'ar.json';
export const ENGLISH_JSON_FILE = 'en.json';
export const KURDISH_JSON_FILE = 'ku.json';

export type LanguageKeys = 'en' | 'ar' | 'ku';

export const languageMapper = {
  ar: ARABIC_JSON_FILE,
  en: ENGLISH_JSON_FILE,
  ku: KURDISH_JSON_FILE,
};

export const localeSchema = object({
  errors: errorsSchema,
  lang: string().required(),
  language: string().required(),
  direction: string().required(),
  vehicleLookup: vehicleLookupSchema,
});

export type Locale = InferType<typeof localeSchema>;

export type ErrorKeys = keyof InferType<typeof errorsSchema> | null;

export const getLocaleLanguage = async (fileKey: string): Promise<Locale> => {
  const languageFile = languageMapper[fileKey] || languageMapper.en;

  let localeResponse;

  if (Build.isDev) localeResponse = await fetch('../../locales/' + languageFile);
  else localeResponse = await fetch('https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/locales/' + languageFile);

  const localeJson = (await localeResponse.json()) as Locale;

  return localeJson;
};
