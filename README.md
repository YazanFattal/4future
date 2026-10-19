# 4FUTURE — Roll Your Destiny

[Open the live website](https://fourfuture-destiny-r7k4.agencybyebye.chatgpt.site) · Private to your ChatGPT account.

A complete browser-local future simulation game built with React, TypeScript, Three.js / React Three Fiber, Motion, Tailwind CSS, and Vite.

## Website and mobile edition

This edition is a responsive, installable web app (PWA). Open the hosted address on a phone, tablet, or desktop. The initial Sites deployment is private to the owner account; sign in with that account when prompted.

- **iPhone / iPad:** open the site in Safari, then Share → Add to Home Screen. Enable Open as Web App if shown.
- **Android:** open the site in Chrome and choose Install app or Add to Home screen from the browser menu, or use the app's installation button.
- **Desktop:** use the browser's install icon when supported, or play directly in a tab.

The Add to Home Screen control and Settings contain installation help. The app downloads its own interface and bundled stories for offline play after the first successful online visit. Settings shows when offline play is ready. Updates are offered through an explicit Update App control, so a new release does not interrupt a roll.

The profile and timeline remain on the current device/browser; this edition does not synchronize them across devices. Offline availability depends on the browser retaining its cache. Reopen online if the browser clears it. This is a mobile web app, not an App Store or Google Play binary.

Platform installation references: [Apple](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios), [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Build a local production version

Run `npm ci`, then `npm run build`, then `node serve.mjs`. Open **http://127.0.0.1:4173**. The source repository does not commit generated build files; the downloadable delivery includes a prebuilt version.

## Run locally

Install Node.js 20.19+ or 22.12+, then open a terminal in this folder:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal (normally http://127.0.0.1:5173). On Windows, you can double-click `Start 4FUTURE.cmd` instead. If running from the source archive for the first time, the launcher installs dependencies before opening the development server.

## Build and verify

```sh
npm test
npm run build
npm run test:pwa
npm run preview
```

The production build is written to `dist/`. Serve it over HTTP; opening `index.html` directly as a file does not support module scripts reliably.

## Play

1. Enter the future and choose +10, +20, +50, or +100 years.
2. Optionally add a profile; everything is stored in the current browser.
3. Roll the real 3D die. The generated face and visible landing always use the same value.
4. Accept the chapter to save it, or change the future and make a branching decision.
5. Revisit saved chapters through My timeline. Decisions influence subsequent chapters.

Sound starts muted. The header and Settings can toggle it. Settings also offers profile editing, Start New Future (keeps the profile), and Clear All Stored Data (removes all personal and journey data and restores defaults). Clear-data confirmation prevents accidental loss. No signup or backend is necessary.

The local engine contains 18 authored scenario seeds, distinct horizon framing, profile personalization, three branching approaches, and continuity from prior choices. Stories are explicitly fictional; this app makes no evidence-based forecasts or financial, medical, or relationship claims. The 50- and 100-year horizons can explore legacy rather than assuming personal longevity.

## Static deployment / GitHub Pages

`base: './'` makes the built assets portable to a project subpath. There is no client routing requirement. Upload the contents of `dist/` to a static host, or use the included GitHub Actions workflow:

1. Put this source in your GitHub repository.
2. In repository Settings → Pages, select **GitHub Actions** as the source.
3. Run the workflow manually and enable **publish_pages**. Ordinary pushes only run validation; they do not publish or change site visibility.

The included workflow installs from the lockfile, runs the core tests, checks TypeScript, builds, and verifies the mobile/offline bundle. GitHub Pages deployment is opt-in through a manual workflow run. The separately hosted Sites edition uses the same app and its own hosting configuration.

## Optional server-side AI integration

The delivered app is fully playable with no API key and makes no AI requests by default. The local engine remains the fallback when a configured service times out, errors, or returns an invalid chapter.

The provider-neutral integration boundary is `getPrediction` in `src/engine.ts`. To connect your own secure backend, set the non-secret build setting `VITE_PREDICTION_ENDPOINT=/api/predict` and rebuild. Implement the endpoint on the same origin using the contract in `docs/AI-ENDPOINT.md`. The endpoint must call your chosen model on the server and return the validated chapter format. This delivery includes the client adapter and full contract, not a live AI service or provider credentials.

When an endpoint is configured, Settings exposes an explicit consent checkbox before any profile or story data can be sent. Without consent, stories stay local. Never place a provider key in a `VITE_*` variable; these variables become public browser code. A static host such as GitHub Pages cannot run this endpoint, so leave the default local engine enabled there or use a full-stack host with a same-origin API.

## Accessibility and resilience

- Real buttons, labeled fields, keyboard focus indicators, a skip link, modal focus trapping, Escape dismissal, and screen-reader live status updates.
- Reduced motion disables ambient dice drift and shortens roll/transition effects.
- WebGL detection and an animated CSS fallback keep the game playable on unsupported devices.
- Storage errors display a clear notice while allowing the current session to continue.
- Stored data is validated before use; unreadable saves recover to a fresh playable state.
- Cryptographic rejection sampling prevents modulo bias in dice rolls.
- Optional audio is synthesized locally; no media or font downloads are needed.

## Structure

```
src/App.tsx          Screens, controls, accessible dialogs, and game flow
src/Dice.tsx         Three.js die, physical lighting, roll animation, fallback
src/dice-math.ts     Canonical faces, pips, and landing rotations
src/engine.ts        Local stories, randomness, persistence, optional API adapter
src/engine.test.ts   Dice math, randomness, story continuity, persistence checks
src/App.test.tsx      Complete flow, consent, recovery, and data-clearing tests
src/styles.css      Responsive visual design and reduced-motion rules
src/pwa.ts           Install prompts, offline status, and safe update controls
scripts/build-pwa.mjs  Generates the exact-build offline service worker
scripts/pwa.test.mjs   Tests manifest, icons, caching, and update isolation
docs/AI-ENDPOINT.md  Optional secure backend contract
```

Browser-local storage is origin-specific. Changing the port, domain, or browser creates a separate journey. Up to 200 accepted chapters and the most recent 200 decisions are kept to bound storage use.

## Delivery verification

The production TypeScript/build checks and 22 automated tests passed (7 engine checks, 9 game and installation flow checks, and 6 mobile/offline bundle checks). The component tests cover the real screen flow with a simulated dice completion callback; separate mathematical tests verify every 3D face orientation. Screenshot and browser-interaction verification could not be completed because the browser tool blocked the local preview. Installation on a physical phone has not been verified. Live AI requests were not made; the game uses the local engine by default.
