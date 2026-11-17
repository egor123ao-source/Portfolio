import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve('dist');
const errors = [];
const titles = new Set();
let pages = 0;
let resources = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const path = resolve(dir,entry.name);
    if(entry.isDirectory()) { await walk(path); continue; }
    if(!entry.name.endsWith('.html')) continue;
    pages++;
    const html = await readFile(path,'utf8');
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    if(!title || titles.has(title)) errors.push(`Missing or duplicate title: ${path}`);
    titles.add(title);
    if((html.match(/<h1(?:\s|>)/g)||[]).length !== 1) errors.push(`Expected exactly one h1: ${path}`);
    if(!html.includes('<html lang="ru">')) errors.push(`Missing Russian language: ${path}`);
    if(!html.includes('name="description"')) errors.push(`Missing description: ${path}`);
    if(/начинающий|₽/.test(html)) errors.push(`Unwanted text in generated page: ${path}`);
    for(const match of html.matchAll(/(?:href|src)="(\/[^"?]*)(?:\?[^\"]*)?"/g)) {
      const [base, hash] = match[1].split('#');
      let target = resolve(root,'.'+base);
      try {
        if((await stat(target)).isDirectory()) target=resolve(target,'index.html');
        await stat(target);
        if(hash && target.endsWith('.html')) {
          const destination=await readFile(target,'utf8');
          if(!destination.includes(`id="${hash}"`)) errors.push(`Missing anchor ${match[1]} in ${path}`);
        }
        resources++;
      } catch {errors.push(`Broken resource ${match[1]} in ${path}`);}
    }
  }
}
await walk(root);
if(errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
else console.log(`PASS: ${pages} pages, ${resources} internal links/assets, unique titles, metadata, content constraints.`);
