# dsh-fmcg-index — AI 交接文档（给 WorkBuddy）

> 本文档给接手本仓库的 AI agent 读。读完后你应该能独立完成：新增 npm / git bundle、在 bundles/ 子目录加技能包、版本更新、发布。
>
> 根仓库：`yeszine/dsh-fmcg-index`，本地路径 `d:\GitHub\dsh-fmcg-index`，HEAD `015f7b9`，发布索引 URL `https://yeszine.github.io/dsh-fmcg-index/index.json`。

---

## 1. 仓库到底是什么

**DSH（DeepSeek Harness）插件市场的索引源（format 1）。** 本仓库只做目录，不放 bundle 代码。bundle 代码放哪里由每条 plugin entry 的 `versions[0].source.type` 决定：

| source.type | 代码位置 | DSH 安装时做什么 |
|---|---|---|
| `npm` | npm 公共仓库（npmjs.com） | `npm install <pkg>` |
| `git`（独立仓库） | 某个 GitHub 仓库 | `git clone <url> @ <40位commit>` |
| `git`（索引仓库子目录） | **本仓库 `bundles/<name>/`** | clone 本仓库，按 `source.path` 切到子目录 |

**当前 18 条：npm 8 / git 10**（其中 8 条 git 来源在本仓库子目录，2 条在别人的仓库）。

### 仓库文件一览

```
dsh-fmcg-index/
├── data/market.json     # 市场元数据：标题、15 分类、13 标签、2 排序键
├── data/plugins.json     # 收录清单（18 条），真正的目录内容
├── bundles/             # 8 个技能包（git 来源 + source.path）
│   ├── dsh-fmcg-business-ops-analysis/
│   ├── dsh-fmcg-deep-research-assistant/
│   ├── dsh-fmcg-dynamic-ui/
│   ├── dsh-fmcg-html-report-presentation/
│   ├── dsh-fmcg-iga-pages/
│   ├── dsh-fmcg-office-plugin/
│   ├── dsh-fmcg-prd-authoring/
│   └── dsh-fmcg-schedule/
├── scripts/             # 构建与维护脚本（见 §3）
├── site/index.html      # GitHub Pages 落地页
├── .github/workflows/rebuild.yml  # push 后自动 build + 部署 Pages
└── package.json         # 只有一个运行时依赖 @deepseek-ai/dsh-plugin-market-index
```

---

## 2. format 1 硬规则（会被官方校验器卡住的）

规则定义在 `scripts/lib/format.mjs`，完整约束建议读一遍。这里列出最常踩到的：

### plugins.json 每条 plugin 的约束

- `name`：必须是合法 npm 包名（kebab-case，scope 可选），**全局唯一**
- `versions`：非空数组，每版精确 SemVer（`^\d+\.\d+\.\d+$`，无 `^`/`~`，无 `workspace:` 前缀）
- `publishTimestamp`：Unix 秒整数，范围 `[0, 10^11)`
- `source` 二选一：
  - `npm`：`{ type: "npm" }`，可选 `registry`
  - `git`：`{ type: "git", url: "https://github.com/<owner>/<repo>.git", commit: "<40位小写hex>", path?: "<相对子目录>" }`
    - `url.pathname` 必须 ≥ 2 段（`/:owner/:repo`）
    - `path` 只允许 `.`、`..`、`@`、`-`、`+`、`_` 和字母数字的段
- `engines.dsh`：可选，SemVer range（**不能**以 `workspace:` 开头）
- `metadata.category`：**必须**引用 market.json 里已声明的分类
- `metadata.labels[]`：每项**必须**引用 market.json 里已声明的标签，不能重复
- `metadata.sortKeys.{priority|updated}`：数值，key 必须在 market.json 已声明

### market.json 约束

- `title.en` 必填
- `metadata.categories` / `metadata.labels` / `metadata.sortKeys`：key ↔ title.en/en 对象
- sortKeys 的 `order` 值必须是 `"asc"` 或 `"desc"`

### 一个完整的 git + source.path 条目示例（当前真实数据）

```jsonc
{
  "name": "@dsh-fmcg/schedule",
  "title": { "en": "Recurring Automation", "zh": "周期自动化规范" },
  "description": {
    "en": "Skill: host-agnostic recurring automation...",
    "zh": "技能：宿主无关的周期自动化规范..."
  },
  "homepage": "https://github.com/yeszine/dsh-fmcg-index",
  "repository": {
    "url": "https://github.com/yeszine/dsh-fmcg-index",
    "directory": "bundles/dsh-fmcg-schedule"
  },
  "metadata": {
    "category": "tools",
    "labels": ["llm", "shell"],
    "sortKeys": { "priority": 45, "updated": 1792948584 }
  },
  "versions": [
    {
      "version": "0.1.0",
      "publishTimestamp": 1792948584,
      "source": {
        "type": "git",
        "url": "https://github.com/yeszine/dsh-fmcg-index.git",
        "commit": "083d9234a1b8acb4099fd95d703735e2240ea110",
        "path": "bundles/dsh-fmcg-schedule"
      },
      "engines": { "dsh": ">=0.2.0-rc.2 <0.3.0" }
    }
  ]
}
```

### npm 条目示例

```jsonc
{
  "name": "dsh-plugin-scout",
  "versions": [{ "version": "0.1.3", "publishTimestamp": 1792069214, "source": { "type": "npm" } }]
}
```

---

## 3. npm 脚本（全部在仓库根执行）

```bash
npm run build              # data/*.json → index.json（官方校验器兜底，exit 0 = 通过）
npm run build -- --check   # 只跑校验，不写 index.json
npm run validate index.json # 对已生成的 index.json 再跑一次官方校验
npm run add <npm包名> --category X --labels a,b,c  # 自动从 npm 生成一条插件条目
npm run update             # 检查所有 npm 来源插件是否有新版本（保留最近 3 版）
npm run screen             # 从 npm / GitHub topic 筛查 FMCG 候选
```

---

## 4. bundles/ 子目录里的技能包长什么样

每个 bundle 是一个可被 DSH `cordis-plugin-loader` 加载的 bundle。当前 8 个**纯技能 bundle**（无 runtime 代码）的骨架：

```
bundles/dsh-fmcg-schedule/
├── package.json          # 声明 dsh.bundle.patch + exports + files
├── cordis.patch.yml      # 插入 @deepseek-ai/dsh-skill-filesystem
├── lib/index.js          # 空壳（export const name = '...'）
├── LICENSE               # MIT
├── README.md
└── skills/
    └── schedule/
        ├── SKILL.md      # 主技能文件（YAML frontmatter + 正文）
        └── references/   # 可选的参考文件（通常 1-4 个）
```

### package.json 必填字段

```json
{
  "name": "@dsh-fmcg/schedule",
  "version": "0.1.0",
  "type": "module",
  "main": "./lib/index.js",
  "exports": { ".": "./lib/index.js", "./package.json": "./package.json" },
  "files": ["lib", "cordis.patch.yml", "skills", "README.md", "LICENSE"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

**两个容易忘的：** `exports["./package.json"]` 必须有（patch 的路径解析会查）；`files` 必须包含 `skills`（npm publish 时才会打进去）。

### cordis.patch.yml 两种写法

**git 来源 bundle（当前 8 个）**——bundle 根目录就是 Loader 的 baseUrl dirname，不需要 npm resolve：

```yaml
- insert:
    - id: dsh-fmcg-schedule-skills
      name: '@deepseek-ai/dsh-skill-filesystem'
      config:
        providerName: dsh-fmcg-schedule
        includeDefaultRoots: false
        bundledSkillDir: !!js process.getBuiltinModule('node:path').join(process.getBuiltinModule('node:url').fileURLToPath(process.getBuiltinModule('node:path').dirname(baseUrl)), 'skills')
```

**npm 包来源 bundle**（例如 archify-dsh 的真实写法）——用 createRequire resolve 包自己的 package.json 位置：

```yaml
        bundledSkillDir: !!js process.getBuiltinModule('node:path').join(process.getBuiltinModule('node:path').dirname(process.getBuiltinModule('node:module').createRequire(baseUrl).resolve('@scope/name/package.json')), 'skills')
```

两种写法都能跑在 `createRequire(baseUrl)` 里执行的 YAML `!!js` 表达式。**当前 8 个 bundle 用的是第一种（fileURLToPath(dirname(baseUrl))）**，因为它们在 git 来源下不是 npm 包。

### SKILL.md 规范

```yaml
---
name: schedule              # 必须 = 所在目录名（kebab-case）
description: Recurring automation skill...
whenToUse: 可选，说明何时触发
# 以下字段 skill-filesystem 会解析但不是必填：
# disable-model-invocation: false
# user-invocable: true
---

正文是中文 Markdown。方法说明、示例、约束、交付物清单。
不依赖特定宿主专有工具（不说 Trae / PureShowWidget / AgentScope 等）。
```

### skill-filesystem 发现规则

- 只扫 bundle 自己的 `skills/` 根下一级子目录（`<bundle>/skills/<name>/SKILL.md`）
- 不扫嵌套 `**/SKILL.md`
- frontmatter 必须有 `name`（kebab-case）和 `description`
- `whenToUse` 可选

---

## 5. 新增一个 bundle 的标准流程

假设要在 `bundles/` 下加一个叫 `foo-bar` 的技能包。

### 5.1 创建骨架

```bash
mkdir bundles/dsh-fmcg-foo-bar/{lib,skills/foo-bar}
```

写 5 个文件：

| 文件 | 模板 |
|---|---|
| `package.json` | 拷贝 bundles/dsh-fmcg-schedule/package.json，改 name / description |
| `cordis.patch.yml` | 拷贝 bundles/dsh-fmcg-schedule/cordis.patch.yml，改 `providerName` 和 `id` |
| `lib/index.js` | 空壳：`export const name = 'dsh-fmcg-foo-bar';` |
| `README.md` | 拷贝 schedule 的，改标题和描述 |
| `LICENSE` | MIT，内容固定 |

### 5.2 写技能正文

`skills/foo-bar/SKILL.md` + 可选 `references/*.md`。frontmatter `name` 必须等于 `foo-bar`。

### 5.3 写入 plugins.json

在 `data/plugins.json` 里加一条：

```jsonc
{
  "name": "@dsh-fmcg/foo-bar",
  "title": { "en": "...", "zh": "..." },
  "description": { "en": "...", "zh": "..." },
  "homepage": "https://github.com/yeszine/dsh-fmcg-index",
  "repository": {
    "url": "https://github.com/yeszine/dsh-fmcg-index",
    "directory": "bundles/dsh-fmcg-foo-bar"
  },
  "metadata": {
    "category": "xxx",    // 必须在 market.json 已声明
    "labels": ["xxx"],    // 必须在 market.json 已声明
    "keywords": ["..."],
    "sortKeys": { "priority": 45, "updated": <unix秒时间戳> }
  },
  "versions": [{
    "version": "0.1.0",
    "publishTimestamp": <unix秒时间戳>,
    "source": {
      "type": "git",
      "url": "https://github.com/yeszine/dsh-fmcg-index.git",
      "commit": "0000000000000000000000000000000000000000",   // 先占位
      "path": "bundles/dsh-fmcg-foo-bar"
    },
    "engines": { "dsh": ">=0.2.0-rc.2 <0.3.0" }
  }]
}
```

如果要加 npm 来源，跳过 bundles/，用 `npm run add <pkg>` 自动生成。

### 5.4 提交并填充 SHA

```bash
# 第 1 次 commit：提交 bundle 代码 + plugins.json（commit 里的 plugins.json 还指向占位 SHA）
git add bundles/dsh-fmcg-foo-bar data/plugins.json
git commit -m "feat: add foo-bar skill bundle"

# 取刚生成的 commit SHA，替换 plugins.json 里的占位
git rev-parse HEAD                    # 拿到 <SHA_A>
# 把 plugins.json 里的 0000... 替换成 <SHA_A>

# 第 2 次 commit：SHA 替换（这个 commit 会成为 plugins.json 实际指向的）
git add data/plugins.json
git commit -m "data: point foo-bar at <SHA_A>"

# 验证
npm run build                         # 官方校验器通过 → 成功
git log --oneline -2                  # 确认两条 commit 都在
```

**为什么要两次 commit？** 第 1 次 commit（SHA_A）里 bundle 文件完整存在，DSH 客户端 clone SHA_A 能拿到完整 bundle。第 2 次 commit（SHA_B）只改了 plugins.json 的 SHA 字段，plugins.json 现在指向 SHA_A。SHA_A 在 SHA_B 的祖先链上，所以任何 clone SHA_B 的客户端都能回溯到 SHA_A 并拿到完整 bundle。

### 5.5 push

```bash
git push origin main
# GitHub Actions 自动 build + 部署 Pages
# index.json 更新时间 ≈ push 后 1-2 分钟
```

---

## 6. 已知分类、标签、排序键（改 market.json 时先查这里）

分类（15 个）：order, inventory, store-visit, promotion, receivables, logistics, master-data, reporting, documents, collaboration, workforce, integration, knowledge, tools, other

标签（13 个）：fs-read, fs-write, shell, network, llm, credentials, dynamic-code, subagent, erp-read, erp-write, wecom, offline

排序键（2 个）：priority (降序), updated (降序)

---

## 7. 鸡生蛋问题的通用解法（git + source.path 的 SHA 依赖）

当 plugins.json 里的 `source.commit` 必须指向一个包含该 bundle 的 commit，但 plugins.json 本身又会被 git 追踪——这就出现循环依赖。

通用解法是 **两次 commit 模式**：

```
C1 (bundle 代码完整)  ←  source.commit 指向这里（bundle 文件在 C1）
  │
C2 (plugins.json 改 SHA) ←  HEAD，C1 的祖先
```

**关键约束**：
- C1 的 tree 里 bundle 文件完整
- C2 的 tree 里 plugins.json 的 source.commit = C1 的 SHA
- C1 必须在 C2 的祖先链上（HEAD → ... → C2 → ... → C1）
- 任何客户端 clone HEAD 都能通过祖先回溯拿到 C1 的完整 tree

如果新 bundle 只是改已有 bundle 的代码，一次 commit 就够——改 bundle + 改 plugins.json 的 SHA，同一 commit 里两者自洽。

---

## 8. 发布链路

```
改 bundles/<name>/ + 改 data/plugins.json
        │
   npm run build        ← 本地构建 + 官方校验器（exit 0 = 通过）
        │
   git add .
   git commit -m "..."
   git push origin main
        │
   GitHub Actions rebuild.yml
        │
   Pages 部署 index.json   ← https://yeszine.github.io/dsh-fmcg-index/index.json
        │
   DSH 客户端从索引源拉到新 bundle
```

**不需要 DSH 客户端验证就能放心 push 的原因**：官方校验器 `@deepseek-ai/dsh-plugin-market-index` 是 CI 里兜底的，本地 exit 0 = 格式没问题。bundle 运行时行为需要 DSH 客户端安装才能验证，但那是后续迭代的事，不是发布的硬阻塞。

---

## 9. 版本更新操作清单

### npm 来源插件（索引原有 8 条里的 8 条 + 未来加的）

```bash
npm run update          # 自动查 npm registry 上的新版本
# 它会把新版本追加到 versions[]，保留最近 3 版
# 然后手动检查 data/plugins.json 变更，build，commit，push
```

### bundles/ 子目录里的技能包（当前 8 条 + 未来加的）

没有自动化脚本（因为 git + source.path 的 SHA 逻辑 npm 脚本不支持）。手动做：

```
1. 改 bundles/<name>/ 下的技能文件
2. 把 plugins.json 里那个条目的 version 从 0.1.0 改成 0.1.1
3. 改 publishTimestamp
4. commit（两次 commit 模式，见 §5.4）
5. build，校验，push
```

---

## 10. 常见坑

| 坑 | 原因 | 解法 |
|---|---|---|
| npm run build 报 commit 不是 40 位 hex | plugins.json 里填了 tag 或短 SHA | `git rev-parse HEAD` 拿完整 40 位 |
| npm run build 报 version 不是精确 SemVer | 写了 `^0.2.0` 或 `workspace:*` | 精确 `0.2.0` |
| npm run build 报 category/labels 未声明 | market.json 里没有 | 先在 market.json 加，或改用已有的 |
| git bundle cordis.patch.yml 报包找不到 | patch 用了 npm resolve 但这是 git 来源包 | 改成 `fileURLToPath(dirname(baseUrl))` |
| 加 bundles/ 后 npm run add 更新时被误操作 | add.mjs 只处理 npm 来源 | 对 bundles/ 子目录的 bundle 手动改 plugins.json |
| push 后 Pages 没更新 | Actions 可能失败 | 到 GitHub Actions 看 rebuild.yml 的日志 |
| 改了 bundle 但没改 plugins.json 的 version/publishTimestamp | 客户端不感知版本变化 | 每次实质改动都 bump patch version |
| 多个 bundle 共用同一个 HEAD SHA 没问题 | 是的，格式校验器不要求不同 | 但每次改动 bundle 代码 + 对应 plugins.json 时，要更新 SHA 指向包含新 bundle 的那个 commit |

---

## 11. 当前 HEAD 摘要（方便 AI agent 校验）

- HEAD: `015f7b92e381d705f5943f360b764426a17321ca`
- 工作区：干净（只有 `.workbuddy/` 和 `docs/` 未跟踪，不影响）
- 18 插件：npm 8 / git 10
- 8 个 git 来源 bundle 在 `bundles/` 子目录，共用 commit `083d9234a1b8acb4099fd95d703735e2240ea110`（在 HEAD 的祖先链上）
- 分类 15 / 标签 13 / 排序键 2
