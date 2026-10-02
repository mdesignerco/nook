# Nook demo (website)

An interactive **simulation of the Nook desktop environment** running entirely in
the browser. It is not the app: Nook itself is a Rust + Tauri 2 desktop app that
hooks into the Windows shell. This folder is a React recreation of that shell so
it can be shown, shared and linked without installing anything.

What it recreates:

- **Notch** — the island at the top of the screen with music, quick settings,
  status and calendar modes, plus a Pomodoro timer.
- **Dock** — the bottom bar with window previews, drag reorder and context menus.
- **Windows** — About, Music, Settings, Terminal, Changelog, Performance,
  Features and a mock browser.

## Running it

```bash
bun install
bun run dev
```

```bash
bun run build      # tsc -b && vite build
bun run lint
bun run preview
```

> This folder is **not** part of the root workspace, so install from inside
> `website/` rather than from the repo root.

## How it relates to the app

The notch and dock styles here were ported from the desktop app's CSS
(`src/App.css` and `src/Dock.css`). When you change the real thing, update the
matching rules here too — `src/index.css` carries a "parity" section at the end
specifically for that.

Settings persist in `localStorage` under `nook-settings`. Demos created before
the 4.2 rebrand stored the same blob under `bloom-settings`; that key is read
once as a fallback and migrated forward.

`website/` is intentionally excluded from `release.yml` — changing files here
does not publish a new app version.

## Not deployed

There is no hosting configuration in this repository (no Vercel, Netlify or
Cloudflare config), and no workflow deploys it. If you publish it, add the
config and a deploy workflow; nothing currently serves this build.
