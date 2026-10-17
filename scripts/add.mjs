#!/usr/bin/env node
// Turn an npm package into a ready-to-paste entry for data/plugins.json.
//
//   node scripts/add.mjs dsh-quick-ask --category collaboration --labels llm,network --priority 20
//
// It reads the npm registry directly (no npm CLI needed). Behind a proxy:
//   PowerShell: $env:NODE_USE_ENV_PROXY='1'; $env:HTTPS_PROXY='http://127.0.0.1:7897'

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0].startsWith('--')) {
  console.error('用法: node scripts/add.mjs <npm 包名> [--category <id>] [--labels a,b] [--priority <n>]');
  process.exit(2);
}

const name = argv[0];
const option = (flag, fallback) => {
  const at = argv.indexOf(flag);
  return at === -1 ? fallback : argv[at + 1];
};
const category = option('--category', 'tools');
const labels = String(option('--labels', ''))
  .split(',')
  .map((label) => label.trim())
  .filter(Boolean);
const priority = Number(option('--priority', '50'));

const market = JSON.parse(
  (await readFile(path.join(root, 'data/market.json'), 'utf8')).replace(/^\uFEFF/u, ''),
);
if (!Object.hasOwn(market.metadata.categories, category)) {
  console.error(`[error] 分类 ${category} 未在 data/market.json 中声明`);
  process.exit(1);
}
for (const label of labels) {
  if (!Object.hasOwn(market.metadata.labels, label)) {
    console.error(`[error] 标签 ${label} 未在 data/market.json 中声明`);
    process.exit(1);
  }
}

const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
  headers: { accept: 'application/json' },
});
if (!response.ok) {
  console.error(`[error] npm registry 返回 HTTP ${response.status}：${name}`);
  process.exit(1);
}
const document = await response.json();

const latest = document['dist-tags']?.latest;
if (!latest) {
  console.error(`[error] ${name} 没有 dist-tags.latest`);
  process.exit(1);
}
const manifest = document.versions?.[latest];
if (!manifest) {
  console.error(`[error] registry 里找不到 ${name}@${latest}`);
  process.exit(1);
}

const publishTimestamp = Math.floor(new Date(document.time[latest]).getTime() / 1000);
if (!Number.isFinite(publishTimestamp)) {
  console.error(`[error] 无法解析 ${name}@${latest} 的发布时间`);
  process.exit(1);
}

const patch = manifest.dsh?.bundle?.patch;
if (!patch) {
  console.warn(
    '[warn] 该包没有声明 dsh.bundle.patch，DSH 会以 not-a-bundle 拒收，不要收进索引。',
  );
}

const enginesDsh = manifest.engines?.dsh;
const repository =
  typeof manifest.repository === 'string'
    ? manifest.repository
    : manifest.repository?.url;

const entry = {
  name,
  title: { en: name },
  ...(manifest.description ? { description: { en: manifest.description } } : {}),
  ...(manifest.homepage ? { homepage: manifest.homepage } : {}),
  ...(repository
    ? { repository: { url: repository.replace(/^git\+/, '').replace(/\.git$/u, '') } }
    : {}),
  metadata: {
    category,
    ...(labels.length > 0 ? { labels } : {}),
    ...(Array.isArray(manifest.keywords) && manifest.keywords.length > 0
      ? { keywords: manifest.keywords.slice(0, 10) }
      : {}),
    sortKeys: { priority, updated: publishTimestamp },
  },
  versions: [
    {
      version: latest,
      publishTimestamp,
      source: { type: 'npm' },
      ...(enginesDsh ? { engines: { dsh: enginesDsh } } : {}),
    },
  ],
};

console.log(`# ${name}@${latest}  发布 ${new Date(publishTimestamp * 1000).toISOString()}`);
console.log(`# bundle patch: ${patch ?? '（未声明，不要收录）'}`);
if (!enginesDsh) {
  console.log('# 未声明 engines.dsh：DSH 会按 @deepseek-ai/dsh* peer 判定，建议手动补一个验证过的范围。');
}
console.log('# 把下面的对象粘进 data/plugins.json 的数组里，再执行 npm run build：');
console.log(JSON.stringify(entry, null, 2));
