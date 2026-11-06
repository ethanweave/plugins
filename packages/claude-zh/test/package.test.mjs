import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { nodeExecutable } from './node-path.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));

test('published tarball installs and loads by package name with its runtime and page intact', { timeout: 60000 }, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-zh-package-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const npm = (...args) => execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    cwd: project, encoding: 'utf8', windowsHide: true, timeout: 45000,
    env: { ...process.env, npm_config_cache: path.join(root, 'npm-cache') },
    shell: process.platform === 'win32'
  });
  const result = JSON.parse(npm('pack', '--json', '--ignore-scripts', '--pack-destination', root));
  const packed = Array.isArray(result) ? result[0] : Object.values(result)[0];
  const files = packed.files.map(file => file.path);
  for (const required of ['integrations/magpie/server.mjs', 'integrations/magpie/page/index.html',
    'integrations/magpie/page/icon.png', 'integrations/windows-runtime/RuntimeConsoleBridge.cs',
    'scripts/test-runtime-autoload.ps1', 'scripts/build-runtime-localization.mjs',
    'lib/module-exports.mjs', 'lib/vendor/js-tokens.mjs', 'lib/vendor/js-tokens.LICENSE',
    'NOTICE', 'LICENSES/javaht-MIT.txt', 'LICENSES/claude-desktop-zh-MIT.txt',
    '.catalogs/zh-Hans/base/b08d07783eaffc9e7be9f0151b94b48d031a9231df61e987c405736f66e4c39f.json',
    '.catalogs/zh-Hans/dynamic/2e9f20581ec4a4d9af259f6fc072baea2bffb4bdd2f4cbe0b893e8d4bdc893f3.json']) {
    assert(files.includes(required), 'Missing runtime asset: ' + required);
  }
  assert(!files.some(file => /^(?:\.handoff|node_modules|test)\//.test(file)));
  assert(!files.some(file => /(?:^|\/)(?:HANDOFF\.md|next-agent\.md|\.env(?:\..*)?|.*\.(?:pem|key|log))$/.test(file)));
  const staging = path.join(root, 'install');
  fs.mkdirSync(staging);
  fs.writeFileSync(path.join(staging, 'package.json'), '{"private":true,"type":"module"}\n');
  npm('install', '--prefix', staging, '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', path.join(root, packed.filename));
  const installed = path.join(staging, 'node_modules/@magpie-community/page-claude-zh');
  const run = file => execFileSync(nodeExecutable, [file, 'help'], { cwd: staging, encoding: 'utf8', windowsHide: true });
  const version = JSON.parse(fs.readFileSync(path.join(project, 'package.json'))).version;
  assert(run(path.join(installed, 'bin/claude-3p-zh.mjs')).startsWith('claude-desktop-zh ' + version + ' '));
  run(path.join(installed, 'scripts/check-package.mjs'));
  const smoke = path.join(staging, 'smoke.mjs');
  fs.writeFileSync(smoke, `
    import plugin from '@magpie-community/page-claude-zh';
    const hooks = await plugin.server({}, { runtimeAutoLoad: false });
    console.log(JSON.stringify({ id: plugin.id, hooks }));
  `);
  assert.deepEqual(JSON.parse(run(smoke)), { id: 'claude-desktop-zh', hooks: {} });
  const { createController } = await import(pathToFileURL(path.join(installed, 'integrations/magpie/controller.mjs')));
  assert.equal(createController().runtimeConfiguration().cwd, installed);
  const pkg = JSON.parse(fs.readFileSync(path.join(installed, 'package.json')));
  assert(fs.existsSync(path.join(installed, pkg.magpie.page.file)));
  assert(fs.existsSync(path.join(installed, pkg.magpie.page.icon)));
  const { registrySnapshot } = await import(pathToFileURL(path.join(installed, 'integrations/magpie/runtime-host.mjs')));
  for (const spec of [installed, '@magpie-community/page-claude-zh@0.1.0',
    'github:ethanweave/magpie-claude-zh#v0.1.0']) {
    fs.writeFileSync(path.join(staging, 'plugins.json'), JSON.stringify({ plugins: [{ spec }] }));
    assert.equal(registrySnapshot(staging, {}).hash.length, 64);
  }
});
