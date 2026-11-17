# Bumping a public demo

The installed game compares itself with `version.json` at the root of this branch. The phone reads it from:

`https://raw.githubusercontent.com/gabrielgarciaagosto-pixel/Game/cursor/cooler-hub-inbox-c0e8/version.json`

No login. If that address is down, the game says nothing.

When you ship a new demo:

1. In `src/version.ts`, raise `GAME_VERSION` and `VERSION_CODE`. `VERSION_NAME` stays `${GAME_VERSION}-demo`.
2. In `android/app/build.gradle`, set `versionName` to that same `VERSION_NAME` and `versionCode` to the same `VERSION_CODE`.
3. Build the public APK and commit it as `demo/Ossuarian-FirstUrn-v<version>-demo.apk`.
4. Edit `version.json`:
   - `versionName` and `versionCode` match the APK.
   - `apkUrl` is the commit-pinned raw link, `https://github.com/gabrielgarciaagosto-pixel/Game/raw/<sha>/demo/Ossuarian-FirstUrn-v<version>-demo.apk`.
   - `notes` is one short line, or leave it out.
5. Commit `version.json` with the APK, or in the commit right after it. The link in `apkUrl` has to be a commit that already contains the file.

The game nags only when `versionCode` in the file is higher than the one baked into that install. Same number, no popup.

If the demo branch changes, update `VERSION_FEED_URL` in `src/version.ts` to the new raw address.
