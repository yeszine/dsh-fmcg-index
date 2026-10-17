#!/usr/bin/env node
// Validate a generated index.json either from disk or from a published URL.
//
//   node scripts/validate.mjs index.json
//   node scripts/validate.mjs https://<owner>.github.io/<repo>/index.json
//
// Behind a proxy, Node does not read the Windows system proxy by default:
//   PowerShell: $env:NODE_USE_ENV_PROXY='1'; $env:HTTPS_PROXY='http://127.0.0.1:7897'

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { validateMarketIndex } from './lib/format.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const input = process.argv[2] ?? 'index.json';

let officialParse;
try {
  ({ parseMarketIndex: officialParse } = await import('@deepseek-ai/dsh-plugin-market-index'));
} catch {
  console.warn('[warn] 未安装官方校验器，使用内置近似校验');
}

let text;
if (/^https?:\/\//u.test(input)) {
  const response = await fetch(input, { redirect: 'error' });
  if (!response.ok) {
    console.error(`[error] 读取失败：HTTP ${response.status} ${input}`);
    process.exit(1);
  }
  text = await response.text();
  console.log(`[ok] 已读取 ${input}（${response.status}，${(Buffer.byteLength(text) / 1024).toFixed(1)} KiB）`);
} else {
  text = await readFile(path.resolve(root, input), 'utf8');
}

let index;
try {
  index = JSON.parse(text);
} catch (error) {
  console.error(`[error] 不是合法 JSON：${error.message}`);
  process.exit(1);
}

// The official reader resolves relative icon references against the index URL,
// so it needs an absolute URL even when we validate a local file.
const indexUrl = /^https?:\/\//u.test(input)
  ? input
  : 'https://example.github.io/dsh-fmcg-index/index.json';

try {
  const stats = validateMarketIndex(index, indexUrl);
  if (officialParse) {
    officialParse(index, indexUrl);
    console.log('[ok] 官方校验器通过');
  }
  console.log(`[ok] format 1 校验通过：${stats.plugins} 个插件`);
  console.log(`     title：${JSON.stringify(index.title)}`);
  console.log(`     分类：${stats.categoriesUsed.join(', ') || '（无）'}`);
  console.log(`     标签：${stats.labelsUsed.join(', ') || '（无）'}`);
  console.log(`     版本：npm ${stats.versionsTotal.npm} / git ${stats.versionsTotal.git}`);
} catch (error) {
  console.error(`[error] 校验失败：${error.message}`);
  if (error.path) console.error(`        位置：${error.path}`);
  process.exit(1);
}
