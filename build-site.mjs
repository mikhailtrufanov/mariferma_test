// Refresh only shared headers and footers. Page content and filenames stay intact.
// Run: node build-site.mjs && node check-site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const pages = ['index', 'scallop', 'seacucumber', 'driedseacucumber', 'pacificoyster', 'pacificmussel', 'scallopspat', 'marifarma', 'aboutmariferma'];
const templates = Object.fromEntries(['header', 'footer'].map(tag => [tag, fs.readFileSync(path.join(root, `${tag}.template.html`), 'utf8').trim()]));
for (const page of pages) {
  const file = path.join(root, `${page}.html`);
  let source = fs.readFileSync(file, 'utf8');
  const values = {
    products: page === 'index' ? '#products' : 'index.html#products',
    delivery: page === 'index' ? '#delivery' : 'index.html#delivery',
    contact: page === 'index' ? '#contact' : '#order',
  };
  for (const [tag, template] of Object.entries(templates)) {
    let rendered = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`Unknown template variable ${key}`);
      return values[key];
    });
    rendered = rendered.replace(/<a\b([^>]*?)href="([^"]+)"([^>]*?)>/g, (match, before, href, after) =>
      href === `${page}.html` ? `<a${before}href="${href}"${after} aria-current="page">` : match);
    const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, 'g');
    if ([...source.matchAll(pattern)].length !== 1) throw new Error(`${page}: expected one ${tag}`);
    source = source.replace(pattern, () => rendered);
  }
  if (source !== fs.readFileSync(file, 'utf8')) fs.writeFileSync(file, source);
}
console.log('Shared headers and footers refreshed in 9 existing pages.');
