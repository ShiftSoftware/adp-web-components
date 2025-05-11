import fs from 'fs';
import path from 'path';
import { InferType, ValidationError } from 'yup';
import yupTypeMapper from '~lib/yup-type-mapper';

const TYPE_FILE = 'type.ts';
const REQUIRED_JSON_FILES = ['en.json', 'ku.json', 'ar.json', 'ru.json'];

function getAllTypeFolders(baseDir: string): string[] {
  const result: string[] = [];

  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    const hasTypesFile = entries.some(entry => entry.isFile() && entry.name === TYPE_FILE);

    if (hasTypesFile) result.push(currentPath);

    for (const entry of entries) {
      if (entry.isDirectory()) walk(path.join(currentPath, entry.name));
    }
  }

  walk(baseDir);

  return result;
}

async function validateJsonFile(filePath: string, schema: any) {
  try {
    const json = (await import(filePath)).default as InferType<typeof schema>;

    console.log(json);

    await schema.validate(json, { abortEarly: false });

    expect(`${path.basename(filePath)} schema validation Passed`).toBe(`${path.basename(filePath)} schema validation Passed`);
  } catch (error) {
    if (error instanceof ValidationError) {
      error.inner.forEach(err => {
        console.log(`File => ${filePath}, Field => ${err.path}, Message => ${err.message}`);
      });
    } else {
      console.log(`Unexpected error at ${filePath}:`, error);
    }

    expect(`${path.basename(filePath)} schema validation Failed`).toBe(`${path.basename(filePath)} schema validation Passed`);
  }
}

describe('Localization files dynamic validation', () => {
  const folders = getAllTypeFolders(path.resolve(__dirname, '../locales'));

  folders.forEach(async folder => {
    const relativeFolder = path.relative(path.resolve(__dirname, '../'), folder);

    const typesPath = path.join(folder, TYPE_FILE);

    const schema = (await import(typesPath)).default as ReturnType<typeof yupTypeMapper>;

    describe(`Validating folder: ${relativeFolder}`, () => {
      for (const file of REQUIRED_JSON_FILES) {
        const filePath = path.join(folder, file);

        expect(fs.existsSync(filePath)).toBe(true);

        it(`should validate ${filePath}`, async () => {
          try {
            console.log(1999999999999);

            const json = (await import(filePath)).default as InferType<typeof schema>;

            console.log(json);

            await schema.validate(json, { abortEarly: false });

            expect(`${path.basename(filePath)} schema validation Passed`).toBe(`${path.basename(filePath)} schema validation Passed`);
          } catch (error) {
            if (error instanceof ValidationError) {
              error.inner.forEach(err => {
                console.log(`File => ${filePath}, Field => ${err.path}, Message => ${err.message}`);
              });
            } else {
              console.log(`Unexpected error at ${filePath}:`, error);
            }

            expect(`${path.basename(filePath)} schema validation Failed`).toBe(`${path.basename(filePath)} schema validation Passed`);
          }
        });
      }
    });
  });
});
