# 快消插件市场（DSH 索引源）

一个面向**快消品经销商**的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件市场索引源：
订单开单、库存临期、门店拜访、促销费用、回款对账、报表、单据 OCR、协同审批、ERP 对接，
以及政策话术类**技能**、经营分析类**专家**、连接 ERP/WMS/CRM 的 **MCP**。

索引是 DSH「插件 → 发现」页读取的 **format 1** JSON；托管在 GitHub Pages，公开可访问。

> 本仓库只做「目录」。目录里的每一项都必须是真实可安装的 DSH 组合包（bundle）——
> `package.json` 声明了 `dsh.bundle.patch` 的 npm 包或 Git 仓库。技能、专家、MCP 也要先打包成 bundle 才能收录。

## 目录结构

```
data/market.json        市场标题、描述、分类/标签/排序键声明
data/plugins.json       收录清单（每个条目就是索引里的一个插件）
scripts/build.mjs       清单 → index.json（内置校验 + 官方校验器）
scripts/validate.mjs    校验磁盘文件或线上 URL
scripts/add.mjs         从 npm 生成一条可直接粘贴的收录条目
site/index.html         GitHub Pages 落地页
index.json              构建产物（不入库，由 CI 生成）
.github/workflows/rebuild.yml  构建、校验、发布到 Pages
```

## 快速开始

```sh
# 需要 Node 22.19+ 或 24+
npm install          # 安装官方校验器
npm run build        # 生成 index.json 并校验
npm run check        # 只校验，不写文件
npm run validate     # 校验已生成的 index.json
```

构建成功后，`index.json` 就是可以直接加到 DSH 的索引。

> 本机没有 Node/npm 也没关系：直接推送，GitHub Actions 会安装依赖、构建并用官方校验器校验。
> 本仓库已用内置 Node 跑通过一次构建，`index.json` 在本地已生成（被 `.gitignore` 忽略，不入库）。

## 发布到 GitHub Pages（公开）

仓库已经创建并部署上线：

- 仓库：<https://github.com/yeszine/dsh-fmcg-index>
- 索引：<https://yeszine.github.io/dsh-fmcg-index/index.json>
- 落地页：<https://yeszine.github.io/dsh-fmcg-index/>

日常更新只需：

```sh
git add .
git commit -m "data: add <plugin>"
git push origin main
```

push 后 GitHub Actions 会自动构建、用官方校验器校验并发布，约 1 分钟生效。

如果你要把它复制到自己的账号下重建：

1. 新建一个**公开**仓库，例如 `dsh-fmcg-index`；
2. `git remote add origin https://github.com/<你的用户名>/dsh-fmcg-index.git && git push -u origin main`；
3. **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**；
4. 打开 **Actions** 里的 `Build and deploy market index`，点 **Run workflow**。

> 注意：工作流里的 `actions/configure-pages` 没有开 `enablement: true`——
> GitHub 默认的 `GITHUB_TOKEN` 没有创建 Pages 站点的权限，首次必须在 Settings 里手动启用一次。

## 在 DSH 里添加

1. 打开 **插件 → 发现**。
2. 点 **添加索引源**，粘贴 <https://yeszine.github.io/dsh-fmcg-index/index.json>。
3. 之后就能搜索、按分类/标签筛选、按「推荐度 / 最近更新」排序，并一键安装。

> 国内网络提示：DSH 宿主进程读索引**不走 Windows 系统代理**（只认 `http_proxy` / `https_proxy` 环境变量或
> `~/.dsh/.env`）。如果 GitHub Pages 直连很慢导致「无法读取此索引」，在 `~/.dsh/.env` 里加：
>
> ```ini
> HTTPS_PROXY=http://127.0.0.1:7897
> HTTP_PROXY=http://127.0.0.1:7897
> NO_PROXY=localhost,127.0.0.1,::1
> ```
>
> 本索引只有几十 KB，通常不需要；但网络受限时这条最有效。

## 收录一条插件

### 方式一：从 npm 生成（推荐）

```sh
node scripts/add.mjs dsh-quick-ask --category collaboration --labels llm,network --priority 20
```

脚本会读 npm registry，核对 `dsh.bundle.patch`，然后打印一个可直接粘进 `data/plugins.json` 的对象。
**没有 `dsh.bundle.patch` 的包不要收录**——DSH 安装时会以 `not-a-bundle` 拒收。

> 需要代理时：PowerShell 里先执行
> `$env:NODE_USE_ENV_PROXY='1'; $env:HTTPS_PROXY='http://127.0.0.1:7897'`。

### 方式二：手写 Git 来源条目

Git 来源必须钉死到 **40 位小写 commit**，不要用分支或 tarball：

```json
{
  "name": "@your-scope/dsh-order-entry",
  "title": { "en": "Order entry", "zh": "订单录入" },
  "description": { "en": "...", "zh": "..." },
  "metadata": {
    "category": "order",
    "labels": ["erp-write", "credentials"],
    "sortKeys": { "priority": 80, "updated": 1792200000 }
  },
  "versions": [
    {
      "version": "1.2.3",
      "publishTimestamp": 1792200000,
      "source": {
        "type": "git",
        "url": "https://github.com/your-org/dsh-order-entry",
        "commit": "0123456789abcdef0123456789abcdef01234567"
      },
      "engines": { "dsh": ">=0.2.0-rc.2 <0.3.0" }
    }
  ]
}
```

改完 `data/plugins.json` 后执行 `npm run build`，提交，Actions 会自动重建并部署。

## 四类内容的打包方式

索引里的条目本质都是 plugin（bundle），技能/专家/MCP 只是打包方式不同：

| 内容 | 打包方式 |
|---|---|
| 功能插件 / 界面插件 | bundle 的 `package.json` 声明 `dsh.bundle.patch`，patch 插入插件行；Host/Client 各一个入口 |
| 技能（SOP、话术、政策、产品知识） | 包内放 `skills/<name>/SKILL.md`，patch 插入 `@deepseek-ai/dsh-skill-filesystem`，用 `customSkillDirs` 或 `bundledSkillDir` 指向包内 `skills/` |
| 专家 / 角色（如「经营分析专家」） | patch 插入 `@deepseek-ai/dsh-agent-preset` 行：`config.id` + `config.plugins[]`（persona + 技能 + 工具） |
| MCP（ERP/WMS/CRM/企微） | 配置型 bundle（无需入口代码），patch 插入 `@deepseek-ai/dsh-mcp-client`：`serverName`、`transport`、`url`/`command`；凭据用 `!!js` 引用，不要写进索引 |

对应官方模板见 DSH 自带的 `cordis-plugin-development` 技能（`templates/host`、`templates/ui`、`templates/mcp`）。

## 分类与标签

分类、标签、排序键都在 `data/market.json` 里声明。**索引条目引用未声明的 id 会导致整份索引校验失败**，
「发现」页会直接读不出来——新增分类/标签时先改 `market.json`。

- 分类（15 个）：`order` `inventory` `store-visit` `promotion` `receivables` `logistics`
  `master-data` `reporting` `documents` `collaboration` `workforce` `integration` `knowledge` `tools` `other`
- 标签（13 个）：`fs-read` `fs-write` `shell` `network` `llm` `credentials` `dynamic-code`
  `subagent` `erp-read` `erp-write` `wecom` `offline` `internal-only`
- 排序键：`priority`（内部推荐度）、`updated`（最近更新，Unix 秒）

## 校验与常见坑

- **版本必须是精确 SemVer**（`1.2.3`，不能是 `^1.2.3` 或 `latest`）。
- **Git 来源必须是完整 40 位 commit**；用分支会随上游变化，索引就不稳定了。
- **插件名全索引唯一**（npm 包名唯一）；同名的多个实现只能收一个。
- **`engines.dsh` 写错会导致安装按钮变灰**；没写则回落到 `@deepseek-ai/dsh*` peer 判定，可能误判不兼容。
- **索引文件必须能直连读取**：不能 302 跳转，Host 默认 15 秒超时、上限 128 MB。本索引很小，通常无压力。
- 发布到 Pages 后若 `index.json` 仍是旧内容：Pages 缓存 `max-age=600`，约 10 分钟。
- `node scripts/validate.mjs https://.../index.json` 可以验证线上地址（注意 Node 需设置代理环境变量）。

## 后续可扩展

- **自动跟踪版本**：给条目加一个 `track: "npm"` 字段，让 CI 定时查 registry，自动更新 `version` 与
  `publishTimestamp`（realguan 的 `convert.mjs` 就是这么做的）。
- **私有 registry**：企业内网发布时，在每个 npm 版本写 `"registry": "https://npm.example.com/"`。
- **内网托管**：把 `site/` 放到任意静态站（Nginx/OSS），索引地址换成内网 URL；自签证书需给 DSH 进程设
  `NODE_EXTRA_CA_CERTS`。
- **规模**：几十到几百条最舒服；超过几千条时索引体积和首次查询开销都会明显上升。

## 安全说明

- 索引**没有签名**，内容只是「声明」；实际安装什么由 bundle 自己的 manifest 决定。
- 插件以 agent 的权限运行。**不要收录未经审查的第三方包**；企业内部插件建议只收内部 registry 的包，
  并在 `source.registry` 写清私有 registry 地址。
- 收录前至少确认：包真的声明了 `dsh.bundle`、版本已锁定、来源可信、有明确的权限说明（标签里的
  `fs-write` / `shell` / `credentials` 等要如实标注）。

## 许可证

MIT
