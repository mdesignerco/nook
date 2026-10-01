# Nook Settings Reference

All settings are stored in `settings.json` in the app config directory (`%APPDATA%/com.mdesignerco.nook/`). The file is a flat JSON object with `nook-` prefixed keys. Nook watches this file for external changes and applies them in real-time.

## Quick Start

Edit `settings.json` with any text editor while Nook is running. Changes are applied immediately — no restart required.

```json
{
	"nook-dock-enabled": "true",
	"nook-dock-mode": "smart",
	"nook-theme-mode": "dark",
	"nook-scale": "1.0"
}
```

## Settings Keys

### Dock

| Key                            | Type                             | Default   | Description                                                                                                                                                                      |
| ------------------------------ | -------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nook-dock-enabled`            | `"true"` / `"false"`             | `"true"`  | Show or hide the Nook Dock (taskbar replacement).                                                                                                                                |
| `nook-dock-mode`               | `"fixed"` / `"smart"` / `"peek"` | `"fixed"` | Dock visibility behavior. **fixed** = always visible as AppBar. **smart** = auto-hide when overlapped by fullscreen apps. **peek** = hidden until cursor approaches bottom edge. |
| `nook-dock-preview-enabled`    | `"true"` / `"false"`             | `"true"`  | Show window thumbnail previews when hovering dock icons.                                                                                                                         |
| `nook-dock-icon-only`          | `"true"` / `"false"`             | `"false"` | Minimal icon-only style (no background/padding around icons).                                                                                                                    |
| `nook-dock-adaptive`           | `"true"` / `"false"`             | `"false"` | Fixed dock only. Stretch the dock to full width like a traditional taskbar while a window is maximized, and contract back when it's restored.                                    |
| `nook-dock-win-number-enabled` | `"true"` / `"false"`             | `"true"`  | When the taskbar is replaced, Win+1 through Win+9 activate the matching pinned dock app (focus/minimize if running, launch otherwise) instead of the native taskbar slots.       |

### Notch

| Key               | Type                             | Default   | Description                                                                                                                  |
| ----------------- | -------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `nook-notch-mode` | `"fixed"` / `"smart"` / `"peek"` | `"fixed"` | Notch (top bar) visibility behavior. Same modes as dock. **peek** shows the notch briefly on media events and notifications. |

### Weather

| Key                             | Type                         | Default     | Description                                                                        |
| ------------------------------- | ---------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `nook-weather-enabled`          | `"true"` / `"false"`         | `"true"`    | Show weather widget in the notch status bar.                                       |
| `nook-weather-city`             | string                       | `""`        | Manually set city name for weather. Empty string = auto-detect via IP geolocation. |
| `nook-weather-lat`              | number string                | (auto)      | Latitude coordinate for weather. Set automatically when a city is selected.        |
| `nook-weather-lon`              | number string                | (auto)      | Longitude coordinate for weather. Set automatically when a city is selected.       |
| `nook-weather-cached-temp`      | number string                | (none)      | Cached temperature value shown before next API fetch.                              |
| `nook-weather-cached-condition` | string                       | (none)      | Cached weather condition text (e.g. "Partly Cloudy").                              |
| `nook-temp-unit`                | `"celsius"` / `"fahrenheit"` | `"celsius"` | Temperature display unit.                                                          |

### Modules

| Key                        | Type                 | Default  | Description                                                           |
| -------------------------- | -------------------- | -------- | --------------------------------------------------------------------- |
| `nook-calendar-enabled`    | `"true"` / `"false"` | `"true"` | Enable calendar/timer mode in the notch.                              |
| `nook-music-mode-enabled`  | `"true"` / `"false"` | `"true"` | Enable interactive music media widget.                                |
| `nook-music-compact-notch` | `"true"` / `"false"` | `"true"` | Show compact music display (visualizer + artwork) in collapsed notch. |

### Music Appearance

| Key                               | Type                      | Default     | Description                                                                                     |
| --------------------------------- | ------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `nook-media-layout`               | `"classic"` / `"compact"` | `"classic"` | Expanded player style. **classic** = large album art. **compact** = small thumbnail + controls. |
| `nook-media-ambience-enabled`     | `"true"` / `"false"`      | `"true"`    | Colored ambient glow behind expanded album art.                                                 |
| `nook-media-compact-glow-enabled` | `"true"` / `"false"`      | `"true"`    | Glow effect around the collapsed compact thumbnail.                                             |
| `nook-media-visualizer-enabled`   | `"true"` / `"false"`      | `"true"`    | Audio visualizer bars in music mode. Also accepts `nook-visualizer-enabled` (legacy alias).     |
| `nook-media-album-art-enabled`    | `"true"` / `"false"`      | `"true"`    | Show album artwork in the notch music display.                                                  |

### Overlays

| Key                               | Type                 | Default  | Description                                                             |
| --------------------------------- | -------------------- | -------- | ----------------------------------------------------------------------- |
| `nook-volume-overlay-enabled`     | `"true"` / `"false"` | `"true"` | Show Nook volume HUD when volume changes (replaces native Windows OSD). |
| `nook-volume-edge-enabled`        | `"true"` / `"false"` | `"true"` | Trigger volume HUD by hovering the left screen edge.                    |
| `nook-brightness-overlay-enabled` | `"true"` / `"false"` | `"true"` | Show Nook brightness HUD when brightness changes.                       |
| `nook-brightness-edge-enabled`    | `"true"` / `"false"` | `"true"` | Trigger brightness HUD by hovering the right screen edge.               |

### Appearance

| Key                     | Type                                             | Default     | Description                                                                                                                                                 |
| ----------------------- | ------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nook-theme-mode`       | `"dark"` / `"light"` / `"custom"` / `"adaptive"` | `"dark"`    | Theme mode. **dark** = dark translucent. **light** = light translucent. **custom** = user-picked color. **adaptive** = follows Windows system accent color. |
| `nook-theme-color`      | hex string                                       | `"#007aff"` | Custom theme color (used in `custom` and `adaptive` modes).                                                                                                 |
| `nook-theme-opacity`    | float string                                     | `"0.80"`    | Background opacity (0.1 to 1.0).                                                                                                                            |
| `nook-theme-saturation` | float string                                     | `"0.50"`    | Color saturation for custom/adaptive themes (0.0 to 1.0).                                                                                                   |
| `nook-theme-brightness` | float string                                     | `"0.15"`    | Background brightness for custom/adaptive themes (0.0 to 1.0).                                                                                              |
| `nook-corners-enabled`  | `"true"` / `"false"`                             | `"false"`   | Render rounded screen corner overlays on top edges.                                                                                                         |

### Status Widgets

| Key                   | Type        | Default                                    | Description                                                                                                 |
| --------------------- | ----------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `nook-status-widgets` | JSON string | `{"left":["weather"],"right":["battery"]}` | Widget layout in collapsed notch. Available: `"weather"`, `"battery"`, `"cpu"`, `"ram"`, `"disk"`, `"net"`. |

Example:

```json
{
	"nook-status-widgets": "{\"left\":[\"cpu\",\"ram\"],\"right\":[\"battery\",\"net\"]}"
}
```

### System

| Key                          | Type                 | Default   | Description                                                                                          |
| ---------------------------- | -------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `nook-scale`                 | float string         | `"1.0"`   | UI scale factor (0.8 to 1.3). Changing this re-registers AppBars to resize the reserved screen area. |
| `nook-low-battery-threshold` | integer string       | `"20"`    | Battery percentage that triggers the low-battery alert pulse (5 to 50, step 5).                      |
| `nook-auto-update`           | `"true"` / `"false"` | `"false"` | Check for and download updates automatically on startup.                                             |
| `nook-show-update-indicator` | `"true"` / `"false"` | `"true"`  | Show a green dot on the notch when an update is available.                                           |
| `nook-time-format-24h`       | `"true"` / `"false"` | `"false"` | Use 24-hour clock format in the notch. When `"false"`, displays 12-hour format with AM/PM.           |

### Internal (Do Not Edit Manually)

| Key                | Type     | Description                                                                           |
| ------------------ | -------- | ------------------------------------------------------------------------------------- |
| `nook-first-run`   | sentinel | Set to `"done"` after first launch. Triggers splash screen if absent.                 |
| `nook-app-version` | string   | Last known app version. If it differs from current, splash screen is shown on update. |

## Event System

Nook uses two Tauri events for settings synchronization:

### `settings-changed`

- **Emitted by:** `save_setting` command (frontend or backend)
- **Payload:** `{ "key": "nook-...", "value": ... }`
- **Purpose:** Broadcasts changes made through the Nook UI to all windows
- **Key format:** Nook-prefixed keys as-is (e.g. `"nook-dock-mode"`)

### `settings-external-changed`

- **Emitted by:** File watcher (detects external edits to `settings.json`)
- **Payload:** `{ "key": "nook-...", "value": ... }` or `{ "key": "nook-...", "value": null }` for removed keys
- **Purpose:** Broadcasts changes made by external editors (VS Code, notepad, scripts)
- **Key format:** Nook-prefixed keys as-is
- **Behavior:** Also syncs values to `localStorage` for instant frontend reads

### Flow

```
External editor saves settings.json
    ↓
File watcher detects change (ReadDirectoryChangesW)
    ↓
Diffs against SETTINGS_CACHE
    ↓
Emits settings-external-changed for each changed/removed key
    ↓
useSettingsSync hook updates React state + localStorage
    ↓
useSettingsSync hook updates React state
    ↓
UI re-renders with new values
```

## Example: Changing Dock Mode via Script

```powershell
# PowerShell: switch dock to smart mode
$json = Get-Content "$env:APPDATA\com.mdesignerco.nook\settings.json" | ConvertFrom-Json
$json.'nook-dock-mode' = 'smart'
$json | ConvertTo-Json | Set-Content "$env:APPDATA\com.mdesignerco.nook\settings.json"
```

```python
# Python: disable dock
import json, os
path = os.path.join(os.environ['APPDATA'], 'com.mdesignerco.nook', 'settings.json')
with open(path) as f: settings = json.load(f)
settings['nook-dock-enabled'] = 'false'
with open(path, 'w') as f: json.dump(settings, f)
```

## Notes

- All boolean values are strings (`"true"` / `"false"`) for consistency with `localStorage`.
- The `useSettingsSync` hook auto-converts `"true"` / `"false"` strings to booleans.
- `auto-hide` mode values in `nook-dock-mode` and `nook-notch-mode` are legacy aliases for `smart` — they are mapped automatically.
- Changing `nook-scale` triggers AppBar re-registration to adjust reserved screen space.
- Theme changes (`nook-theme-*`) are applied by reading all theme values from `localStorage` and calling `applyTheme()` — the theme system depends on all five theme keys being in sync.
