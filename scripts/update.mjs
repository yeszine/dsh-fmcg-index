#!/usr/bin/env node
// Check (and optionally apply) npm version updates for the entries in
// data/plugins.json.
//
//   node scripts/update.mjs            # report only
//   node scripts/update.mjs --write    # rewrite data/plugins.json
//
// Git-sourced entries are reported as "manual": their commit must be bumped by
// hand after reviewing the upstream release.
//
// Behind a proxy, Node does not read the Windows system proxy by default:
//   PowerShell: $env:NODE_USE_ENV_PROXY='1'; $env:HTTPS_PROXY='http://127.0.0.1:7897'

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argv = process.argv.slice(2);
const apply = argv.includes('--write');
const dataFlag = argv.indexOf('--data');
const dataPath = path.resolve(
  root,
  dataFlag === -1 ? 'data/plugins.json' : argv[dataFlag + 1],
);
// Keep a short rollback window: the newest version plus the previous two.
const KEEP_VERSIONS = 3;

async function fetchJson(url, tries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'error',
        headers: { accept: 'application/json', 'user-agent': 'dsh-fmcg-index' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    }
  }
  throw lastError;
}

function pad(value, width) {
  const text = String(value ?? '');
  return text + ' '.repeat(Math.max(0, width - text.length));
}

function dateOf(timestamp) {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

const plugins = JSON.parse(
  (await readFile(dataPath, 'utf8')).replace(/^\uFEFF/u, ''),
);
if (!Array.isArray(plugins)) {
  console.error('[error] data/plugins.json 必须是数组');
  process.exit(1);
}

const rows = [];
let changes = 0;

for (const plugin of plugins) {
  const current = plugin.versions?.[0];
  if (!current) {
    rows.push({ name: plugin.name, current: '-', latest: '-', status: 'no-versions' });
    continue;
  }

  if (current.source?.type === 'git') {
    rows.push({
      name: plugin.name,
      current: current.version,
      latest: '(git)',
      status: 'manual: 检查上游 release 后更新 commit',
    });
    continue;
  }

  const registry = (current.source?.registry ?? 'https://registry.npmjs.org/').replace(/\/+$/u, '');
  const url = `${registry}/${encodeURIComponent(plugin.name)}`;

  try {
    const document = await fetchJson(url);
    const latest = document['dist-tags']?.latest;
    if (!latest) throw new Error('registry 没有 dist-tags.latest');

    if (latest === current.version) {
      rows.push({ name: plugin.name, current: current.version, latest, status: 'up-to-date' });
      continue;
    }

    const manifest = document.versions?.[latest];
    if (!manifest) throw new Error(`registry 里没有 ${latest} 的 manifest`);

    const timestamp = Math.floor(new Date(document.time?.[latest]).getTime() / 1000);
    if (!Number.isFinite(timestamp)) throw new Error(`无法解析 ${latest} 的发布时间`);

    const enginesDsh = manifest.engines?.dsh;
    const isBundle = Boolean(manifest.dsh?.bundle?.patch);

    rows.push({
      name: plugin.name,
      current: current.version,
      latest,
      status: isBundle ? `update (${dateOf(timestamp)})` : 'skip: 新版本没有 dsh.bundle',
    });

    if (apply && isBundle) {
      const nextVersion = {
        version: latest,
        publishTimestamp: timestamp,
        source: {
          type: 'npm',
          ...(current.source.registry === undefined ? {} : { registry: current.source.registry }),
        },
        ...(enginesDsh === undefined ? {} : { engines: { dsh: enginesDsh } }),
      };
      plugin.versions = [
        nextVersion,
        ...plugin.versions.filter((version) => version.version !== latest),
      ].slice(0, KEEP_VERSIONS);
      if (plugin.metadata?.sortKeys) plugin.metadata.sortKeys.updated = timestamp;
      changes += 1;
    }
  } catch (error) {
    rows.push({
      name: plugin.name,
      current: current.version,
      latest: '-',
      status: `error: ${error.message}`,
    });
  }
}

const widths = {
  name: Math.max(4, ...rows.map((row) => row.name.length)) + 2,
  current: 10,
  latest: 10,
};
console.log(
  pad('插件', widths.name) + pad('当前', widths.current) + pad('最新', widths.latest) + '状态',
);
for (const row of rows) {
  console.log(
    pad(row.name, widths.name) +
      pad(row.current, widths.current) +
      pad(row.latest, widths.latest) +
      row.status,
  );
}

if (apply) {
  if (changes === 0) {
    console.log('\n没有需要写入的更新。');
  } else {
    await writeFile(dataPath, `${JSON.stringify(plugins, null, 2)}\n`, 'utf8');
    console.log(`\n已更新 ${changes} 个插件，写入 ${path.relative(root, dataPath)}`);
    console.log('下一步：node scripts/build.mjs && git add -A && git commit -m "data: update plugin versions" && git push');
  }
} else if (rows.some((row) => row.status.startsWith('update'))) {
  console.log('\n加 --write 应用更新；应用后再执行 node scripts/build.mjs 并提交。');
}
