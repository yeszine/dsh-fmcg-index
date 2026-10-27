# Trae 官方插件/技能 → DSH 商店收录交接单

> 交给本项目（dsh-fmcg-index）的 agent：按本文件把下列 Trae 官方插件/技能**打包成 DSH bundle 并收录**到本索引，使 DSH「插件 → 发现」商店可显示并安装。
>
> 前置约束（来自 README.zh.md）：本索引只做目录，**每个条目必须是真实可安装的 DSH bundle**（`package.json` 声明 `dsh.bundle.patch` 的 npm 包或钉死 40 位 commit 的 Git 仓库）。下列对象目前都是 **Trae 技能格式（SKILL.md），不是 DSH bundle，不能直接收录**，必须先打包。

## 一、收录对象（去重后 8 个打包单元，共 12 个技能）

用户原始清单含重复项（business-ops-analysis、prd-authoring 各出现两次），去重并按归属合并如下。

### A. 插件包（5 个，每个打包为一个 bundle，内含其技能）

| # | 包名（建议 npm 名加 `@dsh-fmcg/` 前缀） | 版本 | 官方说明 | 内含技能 | 本机参考路径 |
|---|---|---|---|---|---|
| A1 | business-ops-analysis | 0.1.0 | 从业务数据中提炼经营洞察，支持周期性经营汇报与管理决策 | business-ops-analysis（经营分析全链路：趋势判断、结构拆解、异常识别、经营汇报） | `C:\Users\User\.trae-cn\plugins\trae-remote-official\business-ops-analysis\0.1.0\` |
| A2 | deep-research-assistant | 0.1.0 | 面向复杂主题的深度检索、分析与研究报告整理 | research-guide（搜索、事实查询、竞品分析、来源层级与交叉验证方法） | `C:\Users\User\.trae-cn\plugins\trae-remote-official\deep-research-assistant\0.1.0\` |
| A3 | html-report-presentation | 0.1.0 | 面向 HTML 报告与演示内容的创建、编排与展示 | html-report（自包含 HTML 报告/仪表盘等交付物）、html-deck（动画 HTML 幻灯片，用户说 PPT 时转 pptx） | `C:\Users\User\.trae-cn\plugins\trae-remote-official\html-report-presentation\0.1.0\` |
| A4 | office-plugin | 0.1.0 | 面向办公文档的创建、编辑、转换与内容处理 | xlsx（表格读写/公式/图表/清洗，交付物必须是表格文件）、docx（文档创建编辑/修订/批注）、pdf（文本表格提取/合并拆分/表单）、pptx（演示文稿创建编辑/布局/备注） | `C:\Users\User\.trae-cn\plugins\trae-remote-official\office-plugin\0.1.0\` |
| A5 | prd-authoring | 0.1.0 | 将零散产品想法整理为可评审、可交付的 PRD，支持常规文档与原型优先的交互式 PRD | prd-authoring（PRD 创建/补全/重写/功能规格） | `C:\Users\User\.trae-cn\plugins\trae-remote-official\prd-authoring\0.1.0\` |

### B. 独立技能（3 个，各打包为一个技能 bundle）

| # | 名称 | 版本 | 官方说明 | 本机参考路径 |
|---|---|---|---|---|
| B1 | dynamic-ui | 0.0.1 | 在文字回答旁内联展示可视化内容（图表、架构图、交互 demo、对比）；不用于网站、应用、报告、看板或幻灯片 | `C:\Users\User\.trae-cn\builtin\scopes\a96d0c21\1be64a97\trae\default\skills\dynamic-ui\` |
| B2 | iga-pages | 1.0.13 | 部署前端、全栈、AI agent 项目到 IGA Pages（Pages Functions、日志、@iga-pages/agent、@iga-pages/blob）；不用于无关后端工作 | `C:\Users\User\.trae-cn\skills\iga-pages\` |
| B3 | schedule | 0.0.3 | 创建和管理周期性自动化任务（定时汇总/检查、任务查询/编辑/暂停/恢复/删除/复制/立即运行）；不用于一次性工作 | `C:\Users\User\.trae-cn\builtin\scopes\a96d0c21\1be64a97\trae\default\skills\schedule\` |

### 不在本次范围

`browser`、`chrome`、`computer-use`、`github`、`lark` 系列及 `skill-creator`、`TRAE-browseruse`、`TRAE-computer-use-ptc` 不在用户选定清单内，不打包。

## 二、打包方式（按 README.zh.md「四类内容的打包方式」）

以上全部属于**技能类**，打包规则：

1. 包内放 `skills/<name>/SKILL.md`（A3/A4 一包多技能，放多个子目录）；
2. `package.json` 声明 `dsh.bundle.patch`，patch 插入 `@deepseek-ai/dsh-skill-filesystem`，用 `customSkillDirs` 或 `bundledSkillDir` 指向包内 `skills/`；
3. 模板参考 DSH 自带 `cordis-plugin-development` 技能；
4. **内容处理**：参考各 SKILL.md 的功能说明**重写**技能正文，不要原样复制官方文件——office-plugin 各技能标注 `license: Proprietary`，Trae 插件包多为 `UNLICENSED`，原样搬运有版权风险；`dynamic-ui`/`schedule` 依赖 Trae 宿主能力（如 PureShowWidget、Schedule 工具），DSH 侧需评估等价实现或改写为通用说明；
5. 凭据类内容不写入索引（本批均不涉及凭据）。

## 三、收录步骤

1. 逐个完成 bundle 并发布到 npm（或推送到 Git 仓库并记录 40 位 commit）；
2. 用 `node scripts/add.mjs <npm包名> --category <分类> --labels <标签> --priority <优先级>` 生成条目，粘进 `data/plugins.json`；
3. 分类建议（均已在 `data/market.json` 声明）：A1→`reporting`，A2→`knowledge`，A3→`reporting` 或 `documents`，A4→`documents`，A5→`knowledge`，B1→`tools`，B2→`tools`，B3→`tools`；标签如实标注（如 `llm`、`fs-write`、`network`）；
4. `npm run build` 本地构建校验通过后提交 push，Actions 自动重建并用官方校验器校验后发布；
5. 验收：DSH「插件 → 发现」添加索引源 <https://yeszine.github.io/dsh-fmcg-index/index.json>，能看到 8 个条目且可安装。

## 四、审核清单（每条收录前）

- `package.json` 真的声明了 `dsh.bundle.patch`；
- 版本为精确 SemVer；Git 来源钉死 40 位 commit；
- `engines.dsh` 已确认；
- 能力/风险标签如实；
- 技能正文为重写或已获许可，未原样复制受限内容。
