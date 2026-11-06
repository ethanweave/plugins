import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as asar from '@electron/asar';
import { frontendResources } from '../lib/frontend.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zh-frontend-'));
  const source = path.join(root, 'source');
  const resources = path.join(source, 'resources');
  const frontend = path.join(root, 'frontend');
  fs.mkdirSync(path.join(frontend, 'i18n', 'dynamic'), { recursive: true });
  fs.mkdirSync(path.join(frontend, 'assets'), { recursive: true });
  fs.mkdirSync(resources, { recursive: true });
  fs.writeFileSync(path.join(frontend, 'i18n', 'en-US.json'), '{"hello":"Hello"}');
  fs.writeFileSync(path.join(frontend, 'i18n', 'dynamic', 'en-US.json'), '{"greeting":"Hello"}');
  fs.writeFileSync(path.join(frontend, 'assets', 'runtime.js'), 'export const ready = true;\n');
  fs.writeFileSync(path.join(resources, 'app.asar'), 'inert app archive fixture');
  const previous = process.env.CLAUDE_ZH_CACHE_ROOT;
  process.env.CLAUDE_ZH_CACHE_ROOT = path.join(root, 'cache');
  t.after(() => {
    if (previous === undefined) delete process.env.CLAUDE_ZH_CACHE_ROOT;
    else process.env.CLAUDE_ZH_CACHE_ROOT = previous;
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, resources };
}

test('packed ion-dist is version-keyed, extracted once and reused from the cache', async t => {
  const f = fixture(t);
  await asar.createPackage(path.join(f.root, 'frontend'), path.join(f.resources, 'ion-dist.asar'));
  const first = frontendResources(f.resources);
  assert.equal(path.basename(path.dirname(first)), crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(f.resources, 'ion-dist.asar'))).digest('hex'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(first, 'ion-dist', 'i18n', 'en-US.json'))).hello, 'Hello');
  assert.equal(fs.readFileSync(path.join(first, 'ion-dist', 'assets', 'runtime.js'), 'utf8'), 'export const ready = true;\n');
  assert.equal(fs.readFileSync(path.join(first, 'app.asar'), 'utf8'), 'inert app archive fixture');
  assert.equal(JSON.parse(fs.readFileSync(path.join(first, '.ready'))).version, 1);
  const marker = fs.statSync(path.join(first, '.ready')).mtimeMs;
  assert.equal(frontendResources(f.resources), first);
  assert.equal(fs.statSync(path.join(first, '.ready')).mtimeMs, marker);
});

test('external frontend directories are used directly and unsupported layouts fail closed', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zh-frontend-direct-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const external = path.join(root, 'resources');
  fs.mkdirSync(path.join(external, 'ion-dist', 'i18n'), { recursive: true });
  fs.writeFileSync(path.join(external, 'ion-dist', 'i18n', 'en-US.json'), '{}');
  assert.equal(frontendResources(external), external);
  assert.throws(() => frontendResources(root), /No external or packed ion-dist frontend/);
});
