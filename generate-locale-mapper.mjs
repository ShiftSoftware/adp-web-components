import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const TYPE_FILE = 'type.ts';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_DIR = path.resolve(__dirname, './src/locales');

const OUTPUT_FILE = path.join(BASE_DIR, '../locale-mapper.json');

function walk(folderName, parents, map, preFixPath, currentPath) {
  const folderPath = path.join(currentPath, folderName);

  const reqPath = folderPath.replace(preFixPath, '') + '/';

  if (fs.existsSync(path.join(folderPath, TYPE_FILE))) {
    map[[...parents, folderName].join('.')] = [reqPath];
    parents.forEach(parent => {
      if (map[parent]) map[parent].push(reqPath);
      else map[parent] = [reqPath];
    });
  }

  const folders = fs.readdirSync(folderPath, { withFileTypes: true }).filter(entry => entry.isDirectory());

  folders.forEach(folder => {
    walk(folder.name, [...parents, folderName], map, preFixPath, folderPath);
  });
}

function generateLocaleMap() {
  const map = {
    '-': ['locales/'],
  };

  const folders = fs.readdirSync(BASE_DIR, { withFileTypes: true }).filter(entry => entry.isDirectory());

  const preFixPath = path.join(BASE_DIR, '../');

  folders.forEach(folder => {
    walk(folder.name, [], map, preFixPath, BASE_DIR);
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(map, null, 2), 'utf-8');
  console.log(`✅ Generated: ${OUTPUT_FILE}`);
}

generateLocaleMap();
