# dsh-fmcg-index 项目记忆（工作区自动加载）

## 定位

FMCG 快消行业插件市场索引（DeepSeek Harness plugin-market index，format 1），面向快消经销商：订单、库存、门店拜访、促销、回款、报表、文档、协作、ERP 对接，以及 policy/playbook 技能、角色预设与 MCP 包。

远端：`git@github.com:yeszine/dsh-fmcg-index.git`，索引 `yeszine.github.io/dsh-fmcg-index/index.json`，落地页同源。

**交接文档（权威）：`docs/ai-handbook.md`** —— 2026-10-26 由 Trae 移交给 WorkBuddy，仓库开发以它为准。已提交至 main（commit `9fab666`）。

## 仓库结构

`data/` 数据源（market.json + plugins.json）· `bundles/` 8 个 git 来源技能包 · `scripts/` 构建与维护工具 · `site/` 落地页 · `screening/` 候选筛选记录 · `docs/` 交接文档 · 产物 `index.json`

当前 18 插件：npm 8 / git 10（8 条 git 来源在本仓库 `bundles/` 子目录，共用 commit `083d923`）。

## 常用命令

```sh
npm run build              # 生成 index.json 并跑官方校验器（exit 0 = 通过）
npm run build -- --check   # 仅校验
npm run validate index.json
npm run add <pkg> --category X --labels a,b   # npm 来源插件自动生成条目
npm run update             # 检查 npm 来源插件新版本（保留最近 3 版）
```

## 开发约定

- 提交规范：Conventional Commits（`feat:` / `data:` / `docs:` / `ci:` / `chore:`）
- 改动后必须 `npm run build` 校验通过再提交
- bundles/ 子目录 bundle 用 **两次 commit 模式**（先提交 bundle 代码取 SHA，再改 plugins.json 的 source.commit）——见 handbook §5.4/§7
- bundle 实质改动必须 bump version + publishTimestamp
- cordis.patch.yml 的 git 来源写法用 `fileURLToPath(dirname(baseUrl))`，不是 npm resolve
- Pages 部署已预先启用，push 后 GitHub Actions 自动 build + 部署

## 注意

- 索引是公开产物，避免写入内部客户信息、密钥或私有端点
- category（15）/labels（13）/sortKeys（2）必须先在 market.json 声明才能引用
