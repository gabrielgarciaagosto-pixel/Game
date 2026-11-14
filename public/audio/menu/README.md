# Title / main menu playlist

Drop title-screen and hub menu beds here. The game loads `manifest.json` on the splash and while the player is on the main hub (`OVERVIEW`).

## Quick start

1. Add audio files to this folder (`.m4a` **AAC LC** preferred on Android WebView; Opus-in-m4a will not play reliably — re-encode first).
2. List each file in `manifest.json` under `tracks`.
3. Rebuild / reload the app. No code change needed.

## Current tracks (Gabriel)

| File | Notes |
| --- | --- |
| `menu-music-1.m4a` | AAC LC ~256 kbps stereo — Main Menu I (~3:34) |
| `menu-music-2.m4a` | AAC LC ~256 kbps stereo — Main Menu II (~3:59) |

Sources arrived as Opus-in-m4a and were re-encoded to AAC LC for Capacitor WebView.

Playback is **random**: one track is chosen when the menu opens; when it ends, another random track plays (immediate repeat avoided when 2+ tracks exist). Soft crossfade into/out of gameplay beds.

## `manifest.json` fields

| Field | Meaning |
| --- | --- |
| `playback` | `"random"` (default) — pick at open + after each track |
| `volume` | Soft bed level, typically `0.35`–`0.5` |
| `crossfadeMs` | Overlap between tracks and when leaving the menu |
| `tracks[].id` | Stable id used by the audio bus (`menu:<id>`) |
| `tracks[].file` | Absolute path (`/audio/...`) or filename in this folder |
| `tracks[].title` | Optional label for debugging |

## Playback rules

- Plays on the **title screen** and the **main hub** after Start.
- Fades out when entering a gameplay room (Cooler, Crematory, Chapel, etc.).
- Respects Dev Tools mute / unmute (re-asserts the current menu bed).
- Shares the `audioManager` bus with chapel service + crematory beds (crossfade, never hard-cut).

## Re-encode Opus → AAC LC (if needed)

```bash
ffmpeg -y -i source.m4a -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart menu-music-N.m4a
```
