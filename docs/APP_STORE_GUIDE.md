# Getting EVENToPOINT.ops into Google Play + the Apple App Store

Where things stand: the app is now a real installable PWA (manifest, icons,
service worker — see `vite.config.js` and `public/`). That's the foundation
both store paths build on. From here the two platforms genuinely diverge —
Android reuses the live web app almost as-is, iOS needs a proper native
build. Everything below that requires an account, a payment, or a Mac with
Xcode is something only you can do; I've marked those clearly.

## 1. Developer accounts (you need to do this)

| | Google Play | Apple App Store |
|---|---|---|
| Cost | $25 one-time | $99/year |
| Sign up at | play.google.com/console/signup | developer.apple.com/programs |
| Identity check | Government ID, usually fast | Can take 24-48h, sometimes longer for organizations |
| Choose | "Individual" is simplest to start; you can add an org later | If enrolling as EVENToPOINT (an org), you'll need a D-U-N-S number — free, but can take a few days. Enrolling as yourself individually is faster if you want to move quickly, then transfer later |

**My recommendation:** start both signups now, since Apple's org
verification is the long pole. Individual accounts on both are fine for a
first release — you can always add a business account later.

## 2. Android — Trusted Web Activity (Google Play)

This is the well-supported, low-friction path: Google Play explicitly
expects PWAs to ship this way. A TWA is a thin wrapper that opens your
already-live web app full-screen (no browser address bar) inside a real
Android app shell. You keep shipping updates to Netlify like you do today —
the Play Store app just points at the live URL, so most updates need no
new Play Store submission at all.

**Prerequisites on your Mac:** Node.js (you already have this) and a JDK
(Java 17 — `brew install openjdk@17` if you don't have one).

**Steps (run these yourself in Terminal, in this repo folder):**

```
npx @bubblewrap/cli init --manifest=https://eventopoint.app/manifest.webmanifest
```

This asks a few questions (package name — use `app.eventopoint.ops`,
matches the domain), then generates an Android Studio project and a
signing keystore for you. **Back up that keystore file somewhere safe** —
if you lose it, you can never update the app again under the same
listing, you'd have to publish a new one from scratch.

```
npx @bubblewrap/cli build
```

This produces an `.aab` file — that's what you upload to Play Console
under "Production" (or "Internal testing" first, which I'd recommend for
your first pass).

**One extra step Android requires:** you need to prove you own the
domain, via a file at `https://eventopoint.app/.well-known/assetlinks.json`
containing your app's package name and the SHA-256 fingerprint of the
keystore bubblewrap just generated. Bubblewrap prints this fingerprint for
you at the end of the `init` step — send it to me (or paste the whole
`assetlinks.json` bubblewrap suggests) and I'll add that file to the repo
and get it deployed. Without this file, the app opens but keeps a browser
address bar visible, which looks unfinished.

## 3. iOS — Capacitor (Apple App Store)

Apple is stricter than Google about "is this actually an app, or just a
website in a frame" (App Store Review Guideline 4.2) — a live-URL wrapper
like the Android TWA risks rejection here. So the iOS build instead
bundles the app's compiled files directly into the native app (no live
URL loaded) using Capacitor. I've already added Capacitor to this repo
(`capacitor.config.json`, dependencies in `package.json`) — the remaining
steps need Xcode, which only runs on your Mac.

**Prerequisites:** Xcode (free, from the Mac App Store — this is a large
download, do it ahead of time) and a paid Apple Developer account (see
above).

**Steps (run in Terminal, in this repo folder):**

```
npm install
npm run build
npm run ios:add      # generates the native ios/ project (first time only)
npm run ios:sync      # rebuilds the web app and copies it into the native shell -- run this every time you want to ship an update
npm run ios:open      # opens the project in Xcode
```

From Xcode: set your Team (your Apple Developer account) under Signing &
Capabilities, plug in the app icon (I can generate the full iOS icon set
once you're at this step — Apple wants many exact sizes), then use
Product → Archive to build a release, and upload it to App Store Connect
from the Organizer window that opens afterward.

**Important difference from Android:** because iOS bundles the code
locally instead of loading a live URL, every update needs a new
`ios:sync` + Xcode archive + App Store Connect submission + Apple review
(typically 1-3 days) — not just a Netlify deploy like you're used to.

## 4. What I still owe you before either submission is ready

- Store listing content: privacy policy page, app description, keyword
  ideas (see the companion doc — I'll draft these next)
- Screenshots: both stores require real device/simulator screenshots at
  specific sizes — I can't capture these myself since it needs the app
  actually running on a phone or simulator; once you have either
  bubblewrap or Xcode running locally, I can tell you exactly which
  screens to screenshot and at what size
- Full iOS icon set (Xcode wants ~15 exact sizes) — quick for me to
  generate once you confirm you're moving forward with the Capacitor build

## Suggested order

1. Start both developer account signups today (Apple's the slow one)
2. Deploy the PWA changes already made (new manifest/icons/service worker)
   to Netlify so `eventopoint.app` is serving them
3. Run the Android/bubblewrap steps — fastest path to a first submission
4. Once Apple account is approved, do the iOS/Capacitor steps
