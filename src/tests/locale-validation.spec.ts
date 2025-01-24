import path from 'path';
import * as fs from 'fs';
import { ValidationError } from 'yup';

import { ARABIC_JSON_FILE, ENGLISH_JSON_FILE, KURDISH_JSON_FILE, Locale, localeSchema, RUSSIAN_JSON_FILE } from '~types/locales';

function getFilePath(fileName: string): string {
  const filePath = path.join(__dirname, `../locales/${fileName}`);

  return filePath;
}

function isFileExists(fileName: string) {
  const filePath = getFilePath(fileName);

  const fileExists = fs.existsSync(filePath);

  expect(fileExists).toBe(true);
}

async function isValidSchema(fileName: string) {
  try {
    const englishJson = (await import(getFilePath(fileName))).default as Locale;

    await localeSchema.validate(englishJson, { abortEarly: false });

    expect(`${fileName} schema validation Passed`).toBe(`${fileName} schema validation Passed`);
  } catch (error) {
    if (error instanceof ValidationError) {
      error.inner.forEach(err => {
        console.log(`File => ${fileName}, Field => ${err.path}, Message => ${err.message}`);
      });
    } else console.log(`At file: ${fileName}, Unexpected error:`, error);

    expect(`${fileName} schema validation Failed`).toBe(`${fileName} schema validation Passed`);
  }
}

describe('Localization files', () => {
  it('English Localization', async () => {
    isFileExists(ENGLISH_JSON_FILE);

    await isValidSchema(ENGLISH_JSON_FILE);
  });

  it('Arabic Localization', async () => {
    isFileExists(ARABIC_JSON_FILE);

    await isValidSchema(ARABIC_JSON_FILE);
  });

  it('Kurdish Localization', async () => {
    isFileExists(KURDISH_JSON_FILE);

    await isValidSchema(KURDISH_JSON_FILE);
  });

  it('Russian Localization', async () => {
    isFileExists(RUSSIAN_JSON_FILE);

    await isValidSchema(RUSSIAN_JSON_FILE);
  });
});
