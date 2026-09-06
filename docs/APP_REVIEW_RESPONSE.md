# Responding to Apple — Guideline 2.1, Information Needed (2026-08-30)

Apple didn't find anything broken. They couldn't get into the app and see
what it does, because the App Review Information section was left thin.
Everything below is written to be pasted straight into App Store Connect.

Two code changes shipped alongside this response, because they would have
caused a second rejection on the next round:

1. **In-app account deletion** (Guideline 5.1.1(v) — mandatory for any app
   with account creation). New `Account` button in the dashboard header →
   Account modal → Delete my account → type `DELETE` to confirm. Backed by
   the `delete-account` edge function, which cancels any Stripe
   subscription, removes the org's events/tasks/team/vendors/uploaded
   files if you're the last member, then deletes the auth user.
2. **Password reset flow** — the app had none at all: no "Forgot
   password?" link, no `resetPasswordForEmail` call anywhere. Any user who
   forgot their password was permanently locked out with no self-service
   recovery. Added a Forgot password link on the login screen, a
   reset-request screen, and the set-a-new-password screen the email link
   lands on. In the native builds the recovery email points at
   https://eventopoint.app, because a capacitor:// origin isn't openable
   from a mail client.
3. **Stripe subscribe button hidden on iOS** (Guideline 3.1.1). The native
   iOS build now shows subscription *status* but no button into an
   external purchase flow. Subscribing happens on eventopoint.app in a
   browser. The banner was already advisory, so nothing stops working.

---

## FILL IN BEFORE SUBMITTING

| Placeholder | What to put |
|---|---|
| `<DEMO_EMAIL>` | The account you're handing Apple |
| `<DEMO_PASSWORD>` | Its password |
| `<DEVICE>` / `<IOS_VERSION>` | The iPhone and iOS version you record on |

---

## 1. App Review Information → Sign-In Required

Check **Sign-in required**, then:

- **User name:** `<DEMO_EMAIL>`
- **Password:** `<DEMO_PASSWORD>`

This account already contains events, run-of-show tasks, team members and
vendors, so the reviewer sees a working product rather than an empty state.

## 2. App Review Information → Notes (paste this whole block)

```
EVENToPOINT.ops is a business tool for professional event production teams
— event producers, venue and hotel event managers, and production
coordinators. It is the operations layer for running an event: the
run-of-show, the people working it, and the vendors supplying it, in one
place. There is no consumer-facing or user-to-user social component.

DEMO ACCOUNT
Username: <DEMO_EMAIL>
Password: <DEMO_PASSWORD>
This account is pre-populated with sample events, tasks, team members and
vendors. No additional setup, hardware, or sample file is required to
review any feature.

HOW TO REACH THE MAIN FEATURES
1. Launch the app and sign in with the credentials above.
2. The dashboard opens on a month calendar of events. Tap any event in the
   list below the calendar to open it. Tapping an empty day opens the
   create-event form.
3. Inside an event there are tabs: Run of Show, Team, Vendors, Wrap-Up.
   - Run of Show: the event's task list grouped by phase (setup, event,
     post-event). Tasks can be added manually and marked done; tasks past
     their time show an overdue badge.
   - AI Import (button in the event header): upload a run-of-show document
     in .docx format and it is parsed into tasks automatically. This is
     optional — the demo event already has imported tasks visible.
   - Team: the people working the event. Each has a shareable check-in
     link. Opening that link in a browser lets that person mark themselves
     on-site without creating an account or logging in.
   - Vendors: vendors for the event, with contracts and certificates
     attached as files.
   - Wrap-Up: post-event notes and an AI-generated summary of how the
     event went.
4. ACCOUNT DELETION: tap "Account" in the top-right of the dashboard, then
   "Delete my account", then type DELETE to confirm. This permanently
   deletes the account and, if the user is the last member of their
   organization, all of that organization's data. Please use a
   throwaway-registered account rather than the demo account above if you
   wish to exercise this, so the demo account remains available.

ACCOUNT REGISTRATION AND PASSWORD RECOVERY
Sign-up is by email and password, or Google sign-in, on the first screen.
A new account is asked for an organization name once, then lands on an
empty dashboard. A "Forgot password?" link on the login screen sends a
recovery email; opening that link leads to a screen for setting a new
password.

IN-APP PURCHASES
There are none. The app contains no purchase flow, no paid unlock, and no
link or call-to-action to an external purchase. EVENToPOINT.ops is a
multiplatform business service; organizations subscribe on our website at
https://eventopoint.app using a regular browser. The iOS app displays
subscription status only and remains fully functional regardless of that
status.

USER-GENERATED CONTENT
Content is created only by members of a single organization for their own
internal operational use — event names, task descriptions, team member
names, vendor details, and uploaded vendor documents. There is no public
feed, no discovery, no messaging between users, and no way for a user to
see content belonging to another organization. Every table is row-level
scoped to the signed-in user's organization at the database level.

DEVICE PERMISSION PROMPTS
The app requests no device permissions. It does not use location,
contacts, camera, microphone, notifications, or App Tracking Transparency.
Vendor file uploads use the standard iOS document picker.

DEVICES AND OS TESTED BEFORE SUBMISSION
- <DEVICE> running iOS <IOS_VERSION> (physical device)
- iPhone 16 Pro simulator, iOS <IOS_VERSION> (Xcode)

EXTERNAL SERVICES USED
- Supabase (supabase.com) — authentication, PostgreSQL database, file
  storage, and serverless functions. All application data lives here.
- Anthropic Claude API (anthropic.com) — parses uploaded run-of-show
  documents into structured tasks, and generates the post-event summary.
  Called server-side from a Supabase Edge Function; no API key is present
  in the app binary.
- Netlify (netlify.com) — hosts eventopoint.app, which serves the public
  staff check-in page and the privacy policy.
- Stripe (stripe.com) — subscription billing. Web only; not reachable from
  the iOS app.

REGIONAL DIFFERENCES
There are none. The app has one feature set, in English, and behaves
identically in every region and storefront. No content is geo-restricted,
and no functionality is enabled or disabled based on location.

REGULATED INDUSTRY / THIRD-PARTY MATERIAL
EVENToPOINT.ops does not operate in a regulated industry. It handles no
health, financial, banking, gambling, or government data. It contains no
third-party copyrighted or trademarked material — all branding, copy and
design are original and owned by EVENToPOINT.
```

## 3. Attach the screen recording

Record it per `docs/APP_REVIEW_RECORDING.md`, then attach the video in the
same App Review Information section (the "Attachment" field), and paste a
one-line pointer at the top of your reply in Resolution Center:

> Screen recording attached in App Review Information. Full details,
> demo credentials and feature walkthrough are in the Notes field.

---

## Supabase config to check before testing the reset flow

Supabase dashboard -> Authentication -> URL Configuration -> Redirect URLs
must include both `http://localhost:5173` (local dev) and
`https://eventopoint.app`. Without the localhost entry the recovery email
bounces to the Site URL instead and the new screen never appears.

## Known issue to fix before the Android build (not blocking iOS)

`package.json` has `@capacitor/android@^8.5.0` pinned against
`@capacitor/core@^7.4.4`. Those are different major versions and npm
refuses the combination on a clean install. It works on your machine only
because the existing `node_modules` predates the mismatch. Fix by moving
everything to the same major before you cut an Android release.
