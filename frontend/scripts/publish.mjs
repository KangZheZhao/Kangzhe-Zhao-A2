import { readFile, readdir, copyFile, mkdir, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
for (const [app, folder] of [
  ['site', 'clientside'],
  ['staff', 'adminside'],
]) {
  const build = path.join(root, 'frontend/dist', app, 'browser');
  const target = path.join(root, folder);
  await mkdir(target, { recursive: true });
  const generated = await readdir(build);
  const licenses = await readFile(path.join(root, 'frontend/dist', app, '3rdpartylicenses.txt'), 'utf8');
  await writeFile(path.join(target, '3rdpartylicenses.txt'), licenses.replace(/[ \t]+$/gm, ''));
  for (const file of await readdir(target)) {
    if (/^(main|polyfills|chunk)-[A-Z0-9]+\.js$/.test(file) && !generated.includes(file))
      await unlink(path.join(target, file));
  }
  const index = await readFile(path.join(build, 'index.html'), 'utf8');
  const scripts = [...index.matchAll(/<script[^>]*src="[^"]+"[^>]*><\/script>/g)]
    .map((m) => m[0])
    .join('\n');
  for (const file of generated)
    if (file !== 'index.html') await copyFile(path.join(build, file), path.join(target, file));
  for (const file of await readdir(path.join(root, 'frontend/entry-pages', app))) {
    const shell = await readFile(path.join(root, 'frontend/entry-pages', app, file), 'utf8');
    await writeFile(path.join(target, file), shell.replace('</body>', scripts + '\n</body>'));
  }
  const manifest = generated.filter((file) => file !== 'index.html');
  await writeFile(
    path.join(target, 'build-manifest.json'),
    JSON.stringify({ version: '3.0.0', angular: '22.2.2', files: manifest }, null, 2) + '\n',
  );
  console.log(app + ': Angular 22.2.2 production files published.');
}
