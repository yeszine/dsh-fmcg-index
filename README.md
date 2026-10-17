# FMCG Distributor Office Plugin Market (DSH index)

A public DeepSeek Harness plugin-market index (format 1) for FMCG distributors:
orders, inventory, store visits, promotions, receivables, reporting, documents,
collaboration, ERP integration, plus policy/playbook skills, role presets and MCP
bundles.

Read the full guide in [README.zh.md](README.zh.md).

## Build

```sh
npm install
npm run build      # writes index.json and validates it
npm run check      # validate only
```

## Publish

This repository is already deployed:

- Repository: <https://github.com/yeszine/fmcg-dsh-index>
- Index: <https://yeszine.github.io/fmcg-dsh-index/index.json>
- Landing page: <https://yeszine.github.io/fmcg-dsh-index/>

Push to `main` and GitHub Actions rebuilds, validates and deploys automatically.

To rebuild it under another account: push to a public repo, then set
**Settings → Pages → Source** to **GitHub Actions** and run the workflow once.
(`GITHUB_TOKEN` cannot create the Pages site, so enable it manually first.)

Add the index URL in DSH under **Plugins → Discover → Add index source**.
