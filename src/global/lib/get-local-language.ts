import { Build } from '@stencil/core';
import { version } from '../../../package.json';
import { languageMapper, Locale } from '~types/locales';

const cachedLocales = {};

export const getLocaleLanguage = async (fileKey: string): Promise<Locale> => {
  const languageFile = languageMapper[fileKey] || languageMapper.en;

  if (cachedLocales[languageFile]) return await cachedLocales[languageFile];

  let localeResponse;

  if (Build.isDev) localeResponse = fetch('../../locales/' + languageFile).then(res => res.json() as Locale);
  else localeResponse = fetch(`https://cdn.jsdelivr.net/npm/adp-web-components@${version}/dist/locales/${languageFile}`).then(res => res.json() as Locale);

  cachedLocales[languageFile] = localeResponse;

  return await localeResponse;
};
