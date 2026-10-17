#!/usr/bin/env node
// Screen public DSH plugin marketplaces and MCP registries for entries relevant
// to FMCG / supply chain / food distribution, then write a ranked report.
//
//   node scripts/screen.mjs
//   node scripts/screen.mjs --out-dir screening --limit 100
//
// Sources:
//   - dshmarketplace.dev  (install-checked DSH plugins, bilingual summaries)
//   - MCP official registry + Smithery (candidates to wrap as config-only bundles)
//
// Behind a proxy: NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:7897

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(name);
  return at === -1 ? fallback : argv[at + 1];
};
const outDir = path.resolve(root, flag('--out-dir', 'screening'));
const pageLimit = Math.min(100, Number(flag('--limit', '100')) || 100);

// Strong matches are the core FMCG / distribution words; medium and weak terms
// pull in adjacent office, document and integration tools.
const QUERIES = [
  ['进销存', 3], ['库存', 3], ['订单', 3], ['供应链', 3], ['采购', 3],
  ['仓储', 3], ['物流', 3], ['配送', 3], ['门店', 3], ['陈列', 3],
  ['促销', 3], ['回款', 3], ['对账', 3], ['经销商', 3], ['快消', 3],
  ['食品', 3], ['冷链', 3], ['保质期', 3], ['业务员', 2], ['铺货', 2],
  ['补货', 2], ['批次', 2], ['条码', 2], ['发票', 2], ['单据', 2],
  ['报表', 2], ['Excel', 2], ['ERP', 3], ['WMS', 3], ['TMS', 2],
  ['POS', 2], ['CRM', 2], ['barcode', 2], ['invoice', 2], ['inventory', 3],
  ['warehouse', 3], ['supply chain', 3], ['procurement', 3], ['logistics', 3],
  ['distribution', 3], ['retail', 2], ['FMCG', 3], ['CPG', 3],
  ['order management', 2], ['purchase order', 2], ['replenishment', 2],
  ['field sales', 3], ['merchandising', 3], ['store visit', 3],
  ['promotion', 2], ['reconciliation', 2], ['receivable', 2],
  ['food', 2], ['beverage', 2], ['cold chain', 3], ['Odoo', 2],
  ['SAP', 2], ['NetSuite', 2], ['Shopify', 2], ['WooCommerce', 2],
  ['企业微信', 1], ['钉钉', 1], ['电商', 1], ['订单履约', 1],
];

const MCP_QUERIES = ['erp', 'supply chain', 'inventory', 'warehouse', 'logistics', 'food', 'ecommerce', 'crm'];

async function getJson(url, { tries = 3, headers = {} } = {}) {
  let last;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'error',
        headers: { accept: 'application/json', 'user-agent': 'dsh-fmcg-index-screen', ...headers },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      last = error;
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  throw last;
}

const startedAt = new Date();
const dsh = new Map();
const queryErrors = [];

for (const [query, weight] of QUERIES) {
  const url =
    'https://dshmarketplace.dev/api/v1/plugins?limit=' +
    pageLimit +
    '&installCheck=passed&q=' +
    encodeURIComponent(query);
  try {
    const payload = await getJson(url);
    for (const item of payload.results ?? []) {
      const existing = dsh.get(item.fullName) ?? {
        ...item,
        matched: [],
        score: 0,
      };
      existing.matched.push({ query, weight });
      existing.score += weight;
      dsh.set(item.fullName, existing);
    }
  } catch (error) {
    queryErrors.push({ query, error: error.message });
  }
}

for (const item of dsh.values()) {
  const popularity = Math.log10((item.stars ?? 0) + 1) * 2;
  item.score = Number((item.score + popularity).toFixed(2));
  item.matchedQueries = [...new Set(item.matched.map((m) => m.query))];
  delete item.matched;
}

const ranked = [...dsh.values()].sort((a, b) => b.score - a.score);

const mcp = [];
for (const query of MCP_QUERIES) {
  try {
    const official = await getJson(
      'https://registry.modelcontextprotocol.io/v0/servers?search=' +
        encodeURIComponent(query) +
        '&limit=10',
    );
    for (const entry of official.servers ?? []) {
      const server = entry.server ?? entry;
      mcp.push({
        source: 'official-mcp',
        name: server.name,
        title: server.title ?? server.name,
        description: server.description ?? '',
        repository: server.repository?.url ?? '',
        query,
      });
    }
  } catch (error) {
    queryErrors.push({ query: `mcp-official:${query}`, error: error.message });
  }
  try {
    const smithery = await getJson(
      'https://registry.smithery.ai/servers?q=' + encodeURIComponent(query) + '&pageSize=10',
    );
    for (const server of smithery.servers ?? []) {
      mcp.push({
        source: 'smithery',
        name: server.qualifiedName ?? server.displayName,
        title: server.displayName ?? server.qualifiedName,
        description: server.description ?? '',
        repository: server.homepage ?? '',
        query,
      });
    }
  } catch (error) {
    queryErrors.push({ query: `mcp-smithery:${query}`, error: error.message });
  }
}

await mkdir(outDir, { recursive: true });
const stamp = startedAt.toISOString().slice(0, 10);
const jsonPath = path.join(outDir, `screen-${stamp}.json`);
const mdPath = path.join(outDir, `screen-${stamp}.md`);

const report = {
  generatedAt: startedAt.toISOString(),
  sources: {
    dshMarketplace: 'https://dshmarketplace.dev/api/v1/plugins (installCheck=passed)',
    mcpOfficial: 'https://registry.modelcontextprotocol.io/v0/servers',
    smithery: 'https://registry.smithery.ai/servers',
  },
  queries: QUERIES.map(([query, weight]) => ({ query, weight })),
  errors: queryErrors,
  dshPlugins: ranked,
  mcpServers: mcp,
};
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const cell = (text, max = 90) => {
  const value = String(text ?? '').replace(/\s+/gu, ' ').replace(/\|/gu, '\\|');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};
const lines = [];
lines.push(`# 快消 / 供应链 / 食品行业插件筛查（${stamp}）`, '');
lines.push(`- 生成时间：${report.generatedAt}`);
lines.push(`- 数据源：DSH Marketplace（installCheck=passed，共 ${ranked.length} 个去重候选）；MCP 候选 ${mcp.length} 条`);
lines.push(`- 原始数据：\`${path.relative(root, jsonPath)}\``, '');
lines.push('> 自动筛查只按关键词与热度排序，**是否真正适配业务需要人工复核**。', '');
lines.push('## DSH 插件候选（按相关度 + 热度）', '');
lines.push('| # | 插件 | 仓库 | 星标 | 匹配词 | 风险标记 | 说明 |');
lines.push('|---:|---|---|---:|---|---|---|');
ranked.slice(0, 60).forEach((item, index) => {
  const summary = item.summaryZh || item.summary || '';
  lines.push(
    `| ${index + 1} | \`${item.fullName}\` | ${item.repoUrl ?? ''} | ${item.stars ?? 0} | ${cell(item.matchedQueries.join('、'), 40)} | ${cell((item.riskFlags ?? []).join('、'), 24)} | ${cell(summary, 110)} |`,
  );
});
lines.push('', '## MCP 候选（需封装成配置型 bundle 才能装进 DSH）', '');
lines.push('| 来源 | 名称 | 说明 | 查询词 |');
lines.push('|---|---|---|---|');
mcp.slice(0, 60).forEach((item) => {
  lines.push(
    `| ${item.source} | ${cell(item.name, 40)} | ${cell(item.description, 100)} | ${item.query} |`,
  );
});
if (queryErrors.length > 0) {
  lines.push('', '## 查询失败', '');
  for (const error of queryErrors) lines.push(`- \`${error.query}\`: ${error.error}`);
}
await writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`[ok] DSH 候选 ${ranked.length} 个，MCP 候选 ${mcp.length} 条`);
console.log(`[ok] 报告：${path.relative(root, mdPath)}`);
console.log(`[ok] 原始数据：${path.relative(root, jsonPath)}`);
if (queryErrors.length > 0) console.warn(`[warn] ${queryErrors.length} 个查询失败`);
for (const item of ranked.slice(0, 25)) {
  console.log(`  ${String(item.score).padStart(5)}  ★${String(item.stars ?? 0).padStart(5)}  ${item.fullName}`);
}
