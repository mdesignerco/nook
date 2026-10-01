# AGENTS.md

Guía para agentes que trabajan en esta base de código (Tauri 2 + React + Vite).

## Build y verificación

- **Build release correcto (raíz del repo):**

  ```
  bun tauri build --no-bundle
  ```

  Usa `--no-bundle` para el binario de desarrollo/verificación rápida; emite un
  `.exe` "desnudo" que no instala ni reinicia el equipo.

- **NUNCA compiles con `cargo build --release` plano para probar.** El crate de
  Tauri no activa el protocolo `custom-protocol` salvo que el build pase por
  `tauri build`; un binario plano intentará cargar `http://localhost:1420` y
  fallará con `ERR_CONNECTION_REFUSED` (ventana en blanco).

- **Verificación en orden** (todo desde la raíz del repo):

  ```
  bun run build          # tsc && vite build (frontend)
  cargo clippy --release # backend: no warnings nuevos
  cargo test --release --bin nook --manifest-path src-tauri/Cargo.toml
  ```

- **Formato:** `bun run format` (oxfmt para frontend + `cargo fmt` para backend).

## Comandos útiles

| Comando             | Qué hace                                        |
| ------------------- | ----------------------------------------------- |
| `bun run dev`       | Vite dev server                                 |
| `bun run tauri dev` | App en modo desarrollo                          |
| `bun run bump`      | Incrementa versión (`scripts/bump-version.mjs`) |
| `bun run release`   | Release completo (`scripts/release.mjs`)        |

## Gotchas específicos

- **`get_now_ms()`** (`src-tauri/src/utils.rs`) usa un `Instant` monotónico
  estático con `OnceLock` (inmune a cambios de reloj de pared). No vuelvas a
  `SystemTime` ni definas relojes locales duplicados.
- **La isla (línea) sobre el monitor** mide `NOTCH_HEIGHT_CSS_PX` (420 CSS px)
  escalado por `get_nook_scale` y el factor DPI del monitor. Cambios de
  posicionamiento pasan por `reposition_island_and_overlays` en `services.rs`.
- **Fade de ventanas** se hace vía Win32 (`SetLayeredWindowAttributes` +
  `WS_EX_LAYERED`) porque Tauri 2.11 no expone `set_opacity`; ver
  `set_window_opacity` en `src-tauri/src/services.rs`.
- **Windows/resolución de monitores**: la app es Windows-only (imports Win32 en
  backend). No añadas código de macOS/Linux en rutas críticas.

## Canal de actualizaciones (fork)

- El endpoint y la clave pública de actualización apuntan al **fork**
  (`mdesignerco/nook`), no a upstream. La clave privada de firma vive en
  `C:\Users\jmcgr\.tauri\bloom.key` (gitignored) con su password; en GitHub
  Actions se inyecta como `TAURI_SIGNING_PRIVATE_KEY` (+ `TAURI_SIGNING_PASSWORD`).
- **`update-channel.json`** (raíz, servido por `raw.githubusercontent.com` desde
  `island-only`) es el gate de "qué sí / qué no": solo se ofrece la versión en
  `approved` (salvo que esté en `blocked`). Si no se puede alcanzar el
  maniestrable, no se ofrece nada. Edítalo y haz commit para aprobar/vetar una
  release sin republicar.
- Para publicar una actualización del fork: `bun run bump <version>` (o
  `bun run release <version>` desde `main`/`island-only`), push tag `v<version>`
  → `release.yml` firma y sube `latest.json`. Sin los secrets de firma el
  workflow de release falla.
