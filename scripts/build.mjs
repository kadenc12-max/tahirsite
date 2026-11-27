// Rebuilds index.html from content.json.
// Run after editing content.json or lib/render.js by hand:
//   node scripts/build.mjs
// (Edits made in the online editor do this automatically when they save.)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { render, validate } from '../lib/render.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = JSON.parse(await readFile(join(root, 'content.json'), 'utf8'));
const errors = validate(content);
if (errors.length) {
  for (const e of errors) console.error(`content.json: ${e.path} ${e.message}`);
  process.exit(1);
}
await writeFile(join(root, 'index.html'), render(content));
console.log('index.html rebuilt from content.json');
