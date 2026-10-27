# dsh-fmcg-index — WorkBuddy → Trae 交接文档

> 本文档记录 WorkBuddy 接管期间的改动与决策，供 Trae（最新版）接手时快速恢复上下文。
> 开发规范请继续以 **`docs/ai-handbook.md`** 为权威（由 Trae 生成、WorkBuddy 通读并核验通过，未做修改）。
>
> - 交接日期：2026-10-27
> - 仓库 HEAD：`494e2d8`（与 `origin/main` 同步，工作区干净）
> - 索引 URL：https://yeszine.github.io/dsh-fmcg-index/index.json

---

## 1. 时间线

| 时间 | 宿主 | 事件 |
|---|---|---|
| 2026-10-18 ~ 10-26 | Trae | 完成市场搭建、18 条插件收录、8 个技能包 bundle 化（HEAD `015f7b9`） |
| 2026-10-26 | WorkBuddy | 接收交接，核验通过，将 handbook 固化入库（`9fab666`） |
| 2026-10-27 | WorkBuddy | 将 Trae 官方插件打包规格单与项目记忆入库（`494e2d8`） |
| 2026-10-27 起 | Trae | **当前**，继续开发 |

## 2. WorkBuddy 期间的改动（仅文档，无代码/数据变更）

WorkBuddy 接管约 1.5 天，**没有改动 `data/`、`bundles/`、`scripts/`、`site/` 的任何内容**，只做了交接与知识固化：

| Commit | 内容 |
|---|---|
| `9fab666` | 把 `docs/ai-handbook.md`（原 Trae 留在本地的交接文档，400 行）提交入库，使其随仓库版本化 |
| `494e2d8` | ① `docs/trae-official-plugins-handoff.md`：Trae 官方插件/技能 → DSH 收录的打包规格单（8 个打包单元 / 12 个技能）；② `.workbuddy/memory/`：WorkBuddy 侧项目记忆（MEMORY.md + 日志）随仓库入库 |

两个 commit 均已推送并通过 GitHub Actions 校验，Pages 索引未变化（数据源无改动）。

### 交接核验记录（2026-10-26，WorkBuddy 执行）

- 本地 HEAD = 远端 main = handbook 记录值 `015f7b9` ✅
- `npm run build` 官方校验器 exit 0 ✅
- 18 插件（npm 8 / git 10）、分类 15 / 标签 13 / 排序键 2，与 market.json 一致 ✅
- 8 个 `bundles/` 技能包共用 commit `083d923`，在 HEAD 祖先链上 ✅

（2026-10-27 复验：`npm run build -- --check` 仍通过，18 个插件无变化。）

## 3. Trae 接手后必读的文档地图

| 文档 | 作用 | 何时读 |
|---|---|---|
| `docs/ai-handbook.md` | **开发权威规范**：format 1 硬规则、bundle 骨架、两次 commit 模式、发布链路、常见坑 | 做任何收录/更新前 |
| `docs/trae-official-plugins-handoff.md` | 8 个技能包的来源规格单：收录对象、本机参考路径、打包方式、分类/标签建议、审核清单 | 迭代某个 bundle 内容时 |
| `.workbuddy/memory/MEMORY.md` | WorkBuddy 侧项目记忆（速查版约定），已入库可作参考 | 快速回忆约定时 |
| `README.zh.md` | 四类内容打包方式的总说明 | 新增来源类型时 |

## 4. 关键约定速查（从 handbook 提炼，改数据前先看）

1. **两次 commit 模式**（新增 bundles/ 子目录 bundle）：C1 提交 bundle 代码 + plugins.json（占位 SHA）→ `git rev-parse HEAD` 取 C1 的 40 位 SHA 替换占位 → C2 只提交 plugins.json。C1 必须在 C2 祖先链上。
2. **bundle 实质改动必须 bump**：`packages.json` 条目的 `version`（精确 SemVer，无 `^`）+ `publishTimestamp`（Unix 秒）。
3. **改已有 bundle 代码**：bundle 改动 + plugins.json 的 SHA/version/timestamp 放同一个 commit 即可自洽，无需两次 commit。
4. **category / labels 先声明后引用**：必须已在 `data/market.json` 声明（现有 15 分类 / 13 标签），否则校验器报错。
5. **cordis.patch.yml 的 git 来源写法**：用 `fileURLToPath(dirname(baseUrl))` 拼 `bundledSkillDir`，不要用 npm resolve（那是 npm 来源的写法）。
6. **`exports["./package.json"]` 和 `files: ["skills"]`**：bundle 的 package.json 容易漏的两个必填项。
7. **SKILL.md frontmatter 的 `name` 必须等于所在目录名**（kebab-case）；skill-filesystem 只扫 `skills/` 一级子目录。
8. **公开产物红线**：不写内部客户信息、密钥、私有端点；技能正文重写而非原样复制 Trae 官方受限内容（多为 Proprietary/UNLICENSED）。
9. **提交规范**：Conventional Commits（`feat:` / `data:` / `docs:` / `ci:` / `chore:`），改动后 `npm run build` 通过再提交。
10. **发布链路**：本地 build → push → Actions（rebuild.yml）自动 build + 部署 Pages，1-2 分钟生效。

## 5. WorkBuddy 环境差异备忘（Trae 无需复刻，仅供对照）

- WorkBuddy 通过「工作空间」直接挂载 `D:/GitHub/dsh-fmcg-index`，源路径未搬动；项目记忆写在 `.workbuddy/memory/`（已随 `494e2d8` 入库，建议 Trae 保留，别删）。
- WorkBuddy 侧 `.workbuddy/` 未加入 `.gitignore`（当前被追踪是有意为之——让记忆随仓库走）。如 Trae 侧不想让它进 diff，可自行决定是否 gitignore，**不影响构建**。
- 本机 npm 全局 CLI 在 bash 下需 `export PATH="/usr/bin:/bin:/usr/local/bin:$PATH"` 才能正常执行（WorkBuddy 环境现象，供排障参考）。

## 6. 验收命令（Trae 接手后先跑一遍确认状态）

```bash
git rev-parse HEAD          # 应为 494e2d8，且 status 与 origin/main 同步
npm install                 # 若 node_modules 不在
npm run build -- --check    # exit 0，应输出 18 个插件（npm 8 / git 10）
git ls-remote origin main   # 远端连通
```

## 7. 建议的后续方向（WorkBuddy 观察到，未实施）

- **bundle 运行时验证**：8 个 git 来源 bundle 只过了格式校验，尚未在 DSH 客户端真实安装验证（handbook §8 明确这不是发布硬阻塞，但值得补）。
- **npm run update 例行执行**：8 条 npm 来源插件自 10-18 后未查过新版本。
- **dynamic-ui / schedule 的宿主改写评估**：这两个技能原本依赖 Trae 宿主能力（PureShowWidget、Schedule 工具），打包时是否已充分去宿主化，建议在 DSH 侧装一次确认。
