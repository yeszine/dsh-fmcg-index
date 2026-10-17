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

Push to GitHub, then set **Settings → Pages → Source** to **GitHub Actions**.
The index becomes available at:

```
https://<owner>.github.io/<repo>/index.json
```

Add that URL in DSH under **Plugins → Discover → Add index source**.
