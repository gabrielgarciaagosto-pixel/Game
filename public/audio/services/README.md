# Chapel service playlist

Drop memorial / viewing music here. The game loads `manifest.json` when a family service is underway in the Chapel.

## Quick start

1. Add audio files to this folder (`.m4a` **AAC LC** preferred on Android WebView; Opus-in-m4a will not play reliably — re-encode first).
2. List each file in `manifest.json` under `tracks`.
3. Rebuild / reload the app. No code change needed.

## Current tracks (Gabriel)

| File | Notes |
| --- | --- |
| `chapel-service-1.m4a` | AAC LC 256 kbps stereo — Chapel Service I (~3:08) |
| `chapel-service-2.m4a` | AAC LC 256 kbps stereo — Chapel Service II (~3:18) |
| `chapel-service-3.m4a` | AAC LC 256 kbps stereo — Chapel Service III (~3:02) |
| `chapel-service-4.m4a` | AAC LC 256 kbps stereo — Chapel Service IV (~2:33) |
| `chapel-service-5.m4a` | AAC LC 256 kbps stereo — Chapel Service V (~3:30) |
| `chapel-service-6.m4a` | AAC LC 256 kbps stereo — Chapel Service VI (~3:29) |

Sources for III–VI arrived as Opus-in-m4a and were re-encoded to AAC LC for Capacitor WebView.

Playback is **sequence**: the tracks play in order with the same soft crossfade, then the sequence repeats. Chapel Service I and II stay first.

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
- Music volume and Music mute in Settings scale and silence this bed the same way as the menu playlist.

## Re-encode Opus → AAC LC (if needed)

```bash
ffmpeg -y -i source.m4a -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart chapel-service-N.m4a
```
