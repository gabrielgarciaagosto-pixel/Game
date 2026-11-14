# Chapel service playlist

Drop memorial / viewing music here. The game loads `manifest.json` when a family service is underway in the Chapel.

## Quick start

1. Add audio files to this folder (`.m4a` AAC preferred on Android WebView; `.mp3` / `.ogg` also fine).
2. List each file in `manifest.json` under `tracks`.
3. Rebuild / reload the app. No code change needed.

## Current tracks (Gabriel)

| File | Notes |
| --- | --- |
| `chapel-service-1.m4a` | AAC LC 256 kbps stereo — Chapel Service I |
| `chapel-service-2.m4a` | AAC LC 256 kbps stereo — Chapel Service II |

Playback is **sequence** with a soft crossfade between the two, then repeats.

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
- Background burn ending does not kill service music; crematory beds yield while a service bed owns the bus.
