# Store listing content

## Privacy policy URL

Once deployed: `https://eventopoint.app/privacy.html`

Both Google Play and Apple require this URL during submission. I drafted
the page (`public/privacy.html`) based on what the app actually collects
and who it's shared with (Supabase, Netlify, Anthropic for AI Import). **I'm
not a lawyer and this isn't legal advice** — it's accurate to how the app
works today, but if you'll be handling data for clients in the EU (GDPR)
or California (CCPA) at any real volume, it's worth a quick pass by an
actual lawyer before you lean on it for compliance purposes. Fine as a
starting point for store submission either way.

## App name

- **Google Play title** (max 30 chars): `EVENToPOINT.ops`
- **Apple App Store name** (max 30 chars): `EVENToPOINT.ops`
- **Subtitle (Apple, max 30 chars):** `Event Operations, Live`

## Short description

**Google Play short description (max 80 chars):**
> Run-of-show, team check-in, and vendor tracking for live event production.

## Full description

> EVENToPOINT.ops is the operations layer for event production teams —
> everything you need to run an event day, in one place.
>
> AI RUN-OF-SHOW IMPORT
> Upload your run-of-show document and EVENToPOINT.ops turns it into a
> trackable task list automatically, organized by phase with overdue
> flagging built in.
>
> STAFF CHECK-IN
> Send each team member a one-tap check-in link — no login required. See
> who's on-site in real time from your dashboard.
>
> VENDOR MANAGEMENT
> Track every vendor for an event alongside their contracts, insurance
> certificates, and other files in one organized place.
>
> BUILT FOR THE DAY OF
> A calendar view of every event, click-to-create scheduling, and a clean
> event-detail view built for checking off tasks fast when you're standing
> in a ballroom with five minutes before doors open.
>
> EVENToPOINT.ops is built by an event producer, for event producers.

## Keywords (Apple allows a 100-character keyword field; Google Play infers from description)

`event planning,event production,run of show,event staff,check in,event management,event ops,BEO,event coordinator`

## Category

- **Google Play:** Business
- **Apple App Store:** Business (secondary: Productivity)

## Screenshots — what to capture and at what size

Neither store lets me generate these — they have to come from the real
app running on a real device or simulator, showing real (or realistic
placeholder) data. Once either the Android TWA or iOS build is running,
capture these five screens:

1. **Dashboard** — month calendar view with a few events on it
2. **Event detail — Run of Show tab** — task list with phases and at
   least one overdue badge visible
3. **AI Import in progress** — the import modal, to show off the
   headline feature
4. **Team tab** — a couple of team members, one showing a "Checked in"
   badge
5. **Staff check-in page** — the public check-in screen itself (this one
   you can screenshot straight from a regular browser, no app build
   needed — just open a real check-in link on your phone)

**Required sizes:**

| Store | Requirement |
|---|---|
| Google Play | At least 2 screenshots, 16:9 or 9:16, min 320px, max 3840px on the long edge. Phone screenshots are enough to start — no tablet set required. |
| Apple App Store | Needs screenshots sized for each device family you support. If you only support iPhone, you need the 6.7" display size (1290×2796). Apple will let you skip iPad/other sizes if the app is iPhone-only. |

Before you're ready to shoot these, seed the account with a couple of
realistic-looking demo events so the screenshots look like a real,
in-use product rather than an empty state.

## App icon

Already done — `public/pwa-512.png` and `public/pwa-maskable-512.png`
cover the web/Android icon requirements. Apple's App Store icon (1024×1024,
no transparency, no rounded corners — Apple applies its own mask) still
needs to be generated once you're setting up the Xcode project; it's a
five-minute job from the same source mark, I'll do it when you get there.
