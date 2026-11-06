import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const pkg = read('package.json');
assert.equal(pkg.name, '@magpie-community/page-claude-zh');
assert.notEqual(pkg.private, true);
assert.equal(pkg.main, './integrations/magpie/server.mjs');
assert.equal(pkg.exports, pkg.main);
assert.equal(pkg.license, 'MIT');
assert.equal(pkg.magpie.page.title, 'Claude Desktop 中文');
assert.deepEqual(pkg.magpie.permissions, []);
const icon = fs.statSync(path.join(root, pkg.magpie.page.icon));
assert(icon.isFile() && icon.size <= 1024 * 1024, 'magpie page icon must be a file within 1 MB.');
for (const file of [pkg.main, pkg.magpie.page.file, pkg.magpie.page.icon,
  'bin/claude-3p-zh.mjs', 'scripts/build-runtime-localization.mjs',
  'lib/module-exports.mjs', 'lib/vendor/js-tokens.mjs', 'lib/vendor/js-tokens.LICENSE',
  'scripts/test-runtime-autoload.ps1', 'integrations/windows-runtime/RuntimeConsoleBridge.cs',
  '.catalogs/zh-Hans/base/b08d07783eaffc9e7be9f0151b94b48d031a9231df61e987c405736f66e4c39f.json',
  '.catalogs/zh-Hans/dynamic/2e9f20581ec4a4d9af259f6fc072baea2bffb4bdd2f4cbe0b893e8d4bdc893f3.json',
  'LICENSES/claude-desktop-zh-MIT.txt', 'LICENSES/javaht-MIT.txt', 'NOTICE']) {
  assert(fs.statSync(path.join(root, file)).isFile(), 'Missing package file: ' + file);
}
assert.deepEqual(pkg.dependencies, { '@electron/asar': '^4.0.1' });
assert(!pkg.optionalDependencies, 'Unexpected optional dependency.');
assert.deepEqual(pkg.files.filter(file => file === '.catalogs'), ['.catalogs']);
console.error(`${pkg.name}@${pkg.version}: plugin entry, page, catalogs and notices verified.`);
