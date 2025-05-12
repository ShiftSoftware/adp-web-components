import { Build } from '@stencil/core';
import { version } from '../../../package.json';
import localeNetworkMapper from '../../locale-mapper';
import { Locale } from '~types/a';
import { LanguageKeys, languageMapper } from '~types/locale';

const fileMapper = {
  ...localeNetworkMapper.parents,
  ...localeNetworkMapper.targetFolders,
};

type LocaleParentKeys = keyof typeof localeNetworkMapper.parents;
type LocaleTargetFolderKeys = keyof typeof localeNetworkMapper.targetFolders;

const cachedLocales = {};

// Overloads
export function getLocaleLanguage(component: LocaleParentKeys, fileKey: LanguageKeys): string;
export function getLocaleLanguage(component: LocaleTargetFolderKeys, fileKey: LanguageKeys): number;
export function getLocaleLanguage(component: LocaleParentKeys | LocaleTargetFolderKeys, fileKey: LanguageKeys): string | number {
  const languageFile = languageMapper[fileKey] || languageMapper.en;

  // if (cachedLocales[languageFile]) return await cachedLocales[languageFile];

  // let localeResponse;

  // if (Build.isDev) localeResponse = fetch('../../locales/' + languageFile).then(res => res.json() as Locale);
  // else localeResponse = fetch(`https://cdn.jsdelivr.net/npm/adp-web-components@${version}/dist/locales/${languageFile}`).then(res => res.json() as Locale);

  // cachedLocales[languageFile] = localeResponse;

  // return await localeResponse;
  return 99;
}

const gg = getLocaleLanguage('partLookup', 'en');
