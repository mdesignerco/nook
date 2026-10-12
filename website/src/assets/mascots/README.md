# Nook mascot sprites

The current sheets have been normalized to transparent 1536 × 1536 canvases,
with consistent cell size and body baseline. Uploaded originals are preserved
in `originals/`. The original directions sheet used expressions in its bottom
row, so the three down-facing slots currently reuse neutral left/center/right
poses. Genuine down-facing artwork is needed to complete all nine directions.

Add these two files here:

- `nook-directions.webp`
- `nook-reactions.webp`

Each image must be a square 3 × 3 sprite sheet with transparent background.
Use identical canvas dimensions and character placement in both sheets.
Suggested sheet size: 1536 × 1536 px (512 × 512 px per cell).

Directions, left to right and top to bottom:

| Up-left | Up | Up-right |
| Left | Center | Right |
| Down-left | Down | Down-right |

Reactions, left to right and top to bottom:

| Blink | Heart | Sparkle |
| Surprised | Wink | Bashful |
| Sleepy | Dizzy | Delighted |

When both files exist, the website automatically uses page-mascot 0.1.0.
Until then, the existing Nook logo opens About as a placeholder.
Refresh the local demo after adding the files; production requires a new build.

Component: page-mascot, MIT, copyright Kamran Ahmed.
Source: https://github.com/mdesignerco/page-mascot
