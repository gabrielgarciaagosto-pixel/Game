# Chapel service playlist

Drop memorial / viewing music here. The game loads `manifest.json` when a family service is underway in the Chapel.

## Quick start

1. Add audio files to this folder (`.m4a`, `.mp3`, or `.ogg` — AAC/m4a preferred on Android WebView).
2. List each file in `manifest.json` under `tracks`.
3. Rebuild / reload the app. No code change needed.

## `manifest.json` fields

| Field | Meaning |
| --- | --- |
| `playback` | `"shuffle"` or `"sequence"` |
| `volume` | Soft bed level, typically `0.2`–`0.35` |
| `crossfadeMs` | Overlap between tracks (and when leaving Chapel) |
| `tracks[].id` | Stable id used by the audio bus |
| `tracks[].file` | Absolute path (`/audio/...`) or filename in this folder |
| `tracks[].title` | Optional label for debugging |

## Playback rules

- Plays only while the player is in **Chapel** during an active viewing service (Burial Viewing, Viewing→Cremation, or Ossuary Memorial).
- Soft volume; crossfades between tracks via the shared `audioManager` (no hard cuts).
- Leaving Chapel fades the playlist out.
- Crematory beds still own the bus if a burn is audible.

## Placeholder

Until Gabriel supplies dedicated tracks, the manifest points at the soft Ossuarian theme so the system is testable. Replace that entry when real service music arrives.
