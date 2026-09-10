import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const indexPath = path.join(dist, 'index.html');
const failures = [];

if (!fs.existsSync(indexPath)) failures.push('DIST_INDEX_MISSING');
const index = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
const references = [
  ...[...index.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]),
  ...[...index.matchAll(/<link[^>]+href="([^"]+)"/g)].map((match) => match[1]),
];
if (new Set(references).size !== references.length) failures.push('DUPLICATE_INDEX_ASSET_REFERENCE');
for (const reference of references) {
  if (!reference.startsWith('/')) continue;
  const target = path.join(dist, reference.slice(1));
  if (!fs.existsSync(target)) failures.push(`BROKEN_ASSET_REFERENCE:${reference}`);
}
const assetDirectory = path.join(dist, 'assets');
const assets = fs.existsSync(assetDirectory)
  ? fs.readdirSync(assetDirectory).filter((entry) => /\.(?:js|css)$/i.test(entry))
  : [];
if (!assets.some((entry) => entry.endsWith('.js'))) failures.push('DIST_JS_ASSET_MISSING');
if (!assets.some((entry) => entry.endsWith('.css'))) failures.push('DIST_CSS_ASSET_MISSING');

const result = { success: failures.length === 0, index: fs.existsSync(indexPath), assetCount: assets.length, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.success) process.exitCode = 1;
