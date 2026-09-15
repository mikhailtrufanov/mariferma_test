// Run locally with: node check-site.mjs
// Checks files without starting a server, changing them, or sending requests.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const pages = ['index', 'scallop', 'seacucumber', 'driedseacucumber', 'pacificoyster', 'pacificmussel', 'scallopspat', 'marifarma', 'aboutmariferma'].map(name => `${name}.html`);
const pendingAnchors = new Set(['personal-data-consent', 'privacy-policy']);
const documents = new Map(pages.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
const errors = [];
const ids = new Map();
let references = 0;

for (const [file, source] of documents) {
  const values = [...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(values).size !== values.length) errors.push(`${file}: duplicate id`);
  ids.set(file, new Set(values));
  for (const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    try { new vm.Script(match[1], { filename: file }); }
    catch (error) { errors.push(`${file}: ${error.message}`); }
  }
  for (const [, target] of source.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)) {
    if (!ids.get(file).has(target)) errors.push(`${file}: label refers to missing #${target}`);
  }
}

function checkReference(file, raw, checkFragment = false) {
  const value = raw.replaceAll('&amp;', '&').trim();
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return;
  if (!value || value === '#') { errors.push(`${file}: empty reference`); return; }
  const url = new URL(value, `https://local.invalid/${file}`);
  const target = decodeURIComponent(url.pathname).replace(/^\//, '');
  references++;
  if (!fs.existsSync(path.join(root, target))) { errors.push(`${file}: missing ${target}`); return; }
  if (checkFragment && url.hash && ids.has(target)) {
    const fragment = decodeURIComponent(url.hash.slice(1));
    if (!ids.get(target).has(fragment) && !pendingAnchors.has(fragment)) errors.push(`${file}: missing ${target}#${fragment}`);
  }
}

for (const [file, source] of documents) {
  for (const match of source.matchAll(/\b(?:href|src|poster|data-bg)="([^"]+)"/g)) checkReference(file, match[1], true);
  for (const match of source.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) checkReference(file, match[1]);
}
for (const file of ['site.css', 'responsive.css']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of source.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) checkReference(file, match[1]);
}
try { new vm.Script(fs.readFileSync(path.join(root, 'site.js'), 'utf8'), { filename: 'site.js' }); }
catch (error) { errors.push(error.message); }

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`OK: ${pages.length} pages, ${references} local references, JavaScript syntax and label targets.\nDeferred by owner: form delivery and the two legal-document anchors.`);
