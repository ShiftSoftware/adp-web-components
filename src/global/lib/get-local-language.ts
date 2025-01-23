import { Build } from '@stencil/core';
import { languageMapper, Locale } from '~types/locales';

export const getLocaleLanguage = async (fileKey: string): Promise<Locale> => {
  const languageFile = languageMapper[fileKey] || languageMapper.en;

  let localeResponse;

  if (Build.isDev) localeResponse = await fetch('../../locales/' + languageFile);
  else localeResponse = await fetch('https://cdn.jsdelivr.net/npm/adp-web-components@latest/dist/locales/' + languageFile);

  const localeJson = (await localeResponse.json()) as Locale;

  return localeJson;
};
