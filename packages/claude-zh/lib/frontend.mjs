import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as asar from '@electron/asar';

const CACHE_VERSION = 1;

function cacheRoot() {
  if (process.env.CLAUDE_ZH_CACHE_ROOT) return path.resolve(process.env.CLAUDE_ZH_CACHE_ROOT);
  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(local, 'claude-desktop-3p-zh', 'original', 'frontends');
}

function digest(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}

export function frontendResources(resources) {
  const root = path.resolve(resources);
  if (fs.existsSync(path.join(root, 'ion-dist', 'i18n', 'en-US.json'))) return root;

  const archive = path.join(root, 'ion-dist.asar');
  if (!fs.existsSync(archive)) throw new Error('No external or packed ion-dist frontend found. This build layout is unsupported.');

  const key = digest(archive);
  const base = path.join(cacheRoot(), key);
  const staging = path.join(base, 'resources');
  const marker = path.join(staging, '.ready');
  if (fs.existsSync(marker)) return staging;

  fs.mkdirSync(base, { recursive: true });
  const temporary = path.join(base, `tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(temporary, { recursive: true });
  try {
    asar.extractAll(archive, path.join(temporary, 'ion-dist'));
    fs.copyFileSync(path.join(root, 'app.asar'), path.join(temporary, 'app.asar'));
    fs.writeFileSync(path.join(temporary, '.ready'), JSON.stringify({ version: CACHE_VERSION, archive: key, createdAt: new Date().toISOString() }));
    try {
      fs.renameSync(temporary, staging);
    } catch (error) {
      if (!fs.existsSync(marker)) throw error;
    }
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { recursive: true, force: true });
  }
  return staging;
}
