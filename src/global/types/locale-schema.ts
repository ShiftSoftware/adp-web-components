import { InferType, object, string } from 'yup';

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
  lang: string().required(),
  language: string().required(),
  direction: string().required(),
});

export type Locale = InferType<typeof localeSchema>;
