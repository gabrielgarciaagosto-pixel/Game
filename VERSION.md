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

The game nags only when `versionCode` in the file is higher than the one baked into that install. Same number, no popup. The check does not look at the signing certificate. A higher code still shows the card after a key change.

Public APKs are signed with the house demo key. The keystore and its password stay on the build machine, in gitignored `android/demo-signing.properties`. Do not commit them, and do not fall back to the platform debug certificate.

The house key changed for v0.9.67. Current certificate SHA-256: `61b3c07d3e81f3c5408816f43fc54b060fcb05677f0ea7918f6a0460b0511e4e`. The retired certificate is `3fbb9b330afbb0b82e92f3b8d84352c88f122551ae7467b0d85f0d8a7422515f`. Do not sign a new public build with the retired key.

Latest public demo on this branch: v0.9.81-demo, versionCode 99. Same certificate as v0.9.80, so it installs on top of that build.

A phone that already has this package signed by a different certificate cannot install the new APK on top. Android rejects the update. The player uninstalls the old app first, then installs. When the key changes, the `version.json` note should say so.

If the demo branch changes, update `VERSION_FEED_URL` in `src/version.ts` to the new raw address.
