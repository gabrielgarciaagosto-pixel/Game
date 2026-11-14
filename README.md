# Ossuarian: First Urn

Portrait Android mortuary management game built with React, TypeScript, Vite, Zustand, and Capacitor.

Progress is saved in the WebView (`localStorage` key `ossuarian-first-urn-v1`) so cash, cases, retort state, and your urn collection survive an app restart.

## Scripts

- `npm run dev` — local web preview
- `npm run build` — production web build
- `npx cap sync android` — sync web assets into the Android project
- `cd android && ./gradlew assembleDebug` — debug APK

## Stations

- **Cooler** — toe-tag intake bays and case routing
- **Embalming** — proximity pour fluid mixing with S+–F ranking
- **Crematory** — Millennium retort (~5 min burns), hold-to-jog door, tools drawer, set-point dial; keeps running after Back
- **Urn Processing** — crush, magnet, hatch, cremulator
- **Chapel** — bier, floral sprays, offer catalog urns to families, finalize service
- **Funerary Emporium** — browse/inspect/buy detailed urns and other merchandise
- **Urn Vault** — sealed cremains plus your purchased vessel collection
