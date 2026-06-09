# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A YouTrack **dashboard widget** app ("Real Quick Notes") packaged for the JetBrains Marketplace. Users add the widget to a YouTrack dashboard and type notes directly into it; every change auto-saves. There is **no backend** — the app is a single client-side React widget loaded into a sandboxed iframe by the YouTrack host.

## Commands

```bash
npm install            # install deps (Node 22, see .nvmrc)
npm run build          # tsc typecheck -> vite build -> youtrack-app validate dist
npm run lint           # eslint, --max-warnings 0 (zero-warning gate)
npm run pack           # zip dist/ into youtrack-real-quick-notes-app.zip for upload
npm run upload         # youtrack-app upload dist (push to a YouTrack instance)
```

There is **no test runner and no dev server**. `npm run build` is the primary verification step — CI (`.github/workflows/npm-test.yml`) runs exactly `npm run build` on every PR, and the build embeds a `youtrack-app validate` step, so a passing build is the build-and-validate gate. To verify changes, run `npm run build` and `npm run lint`. Iterating on the running widget requires `npm run upload` to a real YouTrack instance (2024.3+) since the widget only functions inside the YouTrack host.

## Architecture

All app code lives under `src/widgets/quick-note/`. The build is multi-page-app shaped (one HTML entry per widget via `vite.config.ts` `rollupOptions.input`), so adding a widget means a new folder + new manifest entry, not restructuring.

**Host bridge (`@types/globals.d.ts`).** The widget talks to YouTrack only through the global `YTApp` object and the `EmbeddableWidgetAPI` host handle returned by `YTApp.register(...)`. These types are hand-maintained ambient declarations, not an installed SDK. The API split matters: `readConfig`/`storeConfig` persist the **configuration** (the widget title, editable only in config mode), while `readCache`/`storeCache` persist the **cache** (the note body). Treat cache as the note's storage even though the name suggests transience — that's the app's design.

**Lifecycle and state (`app.tsx`).** This single component drives everything:
- `register()` runs once, awaits `YTApp.register`, then loads config + cache in parallel and seeds React state. `hydratedRef` guards against the auto-save effect firing during this initial load.
- **Auto-save** is a `useEffect` on `body` with a 500ms debounce (`SAVE_DEBOUNCE_MS`). It skips when not hydrated, when in config mode, or when `body` already equals `lastSavedBodyRef` (no-op guard). The "Saved" indicator clears after 1500ms (`SAVED_INDICATOR_MS`). `SaveStatus` is `idle | saving | saved`.
- **Config mode** is toggled by the host calling the `onConfigure` callback passed into `register`. Rendering swaps to `<Configuration>`; `doneConfiguring` stores the new title, updates the host title, and exits config mode. Note: saving title goes through `storeConfig`, not `storeCache`.

**i18n (`i18n.ts`).** Locale comes from `YTApp.locale`; `resolveLocale` normalizes it and falls back to `en`. Only `en` and `de` exist. UI strings are **not** hardcoded in components — always add a key to the `Messages` type and both locale records, then read via `getMessages()`. The German vendor (J&J Ideenschmiede) means `de` parity is expected.

**Manifest (`manifest.json`) is the source of truth for app identity** — name, version, `minYouTrackVersion`, and the `widgets[]` registry that maps `indexPath`/`settingsSchemaPath` to files. Keep `version` here in sync with `package.json`. `widget-settings.json` is the JSON Schema for the config form; if you add a config field, update both that schema and `WidgetConfiguration` in `types.ts`.

## Conventions

- **TypeScript strict mode**; explicit return types and explicit `MutableRefObject<...>` annotations are used throughout `app.tsx` — match that verbosity rather than relying on inference.
- **2-space indentation** for code (`.editorconfig`), but note several config/source files use **tabs** (e.g. `i18n.ts`, `types.ts`, `globals.d.ts`); follow the existing file's style when editing it.
- UI is built from **JetBrains Ring UI** (`@jetbrains/ring-ui-built`) components (`Input`, `Button`, `ButtonSet`) — prefer these over raw elements for config UI. `index.tsx` wraps the app in `ControlsHeightContext` at size `S`; keep new Ring UI controls consistent with that.
- Styling is SCSS (`app.scss`), imported via `<link rel="stylesheet" href="app.scss">` in the widget's `index.html`; `*.css`/`*.scss` modules are declared ambient in `@types/`.
- Lint extends the JetBrains config (`@jetbrains/eslint-config`) plus react-hooks rules. The build fails on **any** warning — keep hook dependency arrays and the react-refresh rule satisfied. Components are exported as `memo(...)` named exotic components.

## Git workflow

Develop on the designated feature branch and push there; do **not** push to `main`. Do not open a PR unless explicitly asked. CI on PRs is `npm run build` (NPM Test) plus Qodana and label workflows; releases are cut via tags and deployed to the JetBrains Marketplace through `.github/workflows/jetbrains-marketplace-deploy.yml`.
