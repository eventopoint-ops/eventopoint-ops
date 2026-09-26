# Google Play — listing copy and release details

Everything here is paste-ready. Character limits are Google's and are noted
where they bite.

## App details

**App name** (max 30 chars) — 15 used:
```
EVENToPOINT.ops
```

**Short description** (max 80 chars) — 74 used:
```
Run-of-show, staff check-in and vendor tracking for live event production.
```

**Full description** (max 4000 chars):
```
EVENToPOINT.ops is the operations layer for event production teams —
everything you need to run an event day, in one place.

AI RUN-OF-SHOW IMPORT
Upload your run-of-show document and EVENToPOINT.ops turns it into a
trackable task list automatically, organised by phase, with overdue
flagging built in. No retyping a schedule someone already wrote.

STAFF CHECK-IN
Send each team member a one-tap check-in link. No app to install, no
account to create, no password. See who is on site in real time from your
dashboard.

VENDOR MANAGEMENT
Track every vendor for an event alongside their contracts, insurance
certificates and other documents, in one organised place instead of
scattered across email.

POST-EVENT WRAP-UP
Capture what went wrong while it is still fresh, rate the staff and
vendors who worked the event, and get an AI-written summary and concrete
suggestions for next time.

BUILT FOR THE DAY OF
A calendar view of every event, click-to-create scheduling, and an event
view built for checking tasks off fast when you are standing in a ballroom
with five minutes before doors open.

WHO IT IS FOR
Event producers, venue and hotel event managers, production coordinators,
and the teams who work alongside them.

EVENToPOINT.ops is built by an event producer, for event producers.
```

## Closed testing — release details

**Release name:**
```
1.0 (2) — closed test
```

**Release notes** (paste inside the `<en-US>` block Play gives you):
```
First closed test build.

- Month calendar of events, click a day to create one
- Run of show with phases, overdue flagging and manual task entry
- AI import of a run-of-show document into tasks
- Staff check-in links that need no login
- Vendor records with document attachments
- Post-event wrap-up with ratings and an AI summary
- Account creation, password reset and in-app account deletion

Please report anything that looks wrong, especially on the event day
screens, since that is where the app has to hold up under pressure.
```

## Store settings answers

- **App category:** Business
- **Tags:** productivity, business, project management
- **Contact email:** e.konoshenko@eventopoint.com
- **Website:** https://eventopoint.app
- **Privacy policy URL:** https://eventopoint.app/privacy.html

## App access (this is the one that gets apps rejected)

Google needs working credentials or it cannot review past the login screen —
same trap as Apple's 2.1. Choose **All or some functionality is restricted**
and add one instruction set:

- **Name:** Signed-in access
- **Username:** e.konoshenko@eventopoint.com
- **Password:** (the account password — type it into Play Console, do not
  write it in this file)
- **Any other instructions:**
```
Sign in with the credentials above. The dashboard opens on a month calendar
of events; tap an event in the list below it to open the run of show, team,
vendors and wrap-up tabs. The account is pre-populated with events, tasks,
team members and vendors, so no setup is needed. Account deletion is under
"Account" in the top-right of the dashboard.
```

## Data safety form — what the app actually collects

Answer honestly against this; it is what the code does.

**Does your app collect or share any of the required user data types?** Yes.

Collected, NOT shared with third parties, all of it required (not optional),
all of it encrypted in transit, and users CAN request deletion (in-app,
under Account):

| Data type | Category | Why |
|---|---|---|
| Email address | Personal info | Account creation and sign-in |
| Name | Personal info | Displayed on the profile and on tasks |
| Files and docs | Files and docs | Vendor contracts and certificates the user uploads |
| Other user-generated content | App activity | Event names, task text, team and vendor records, notes |

- **Is data encrypted in transit?** Yes
- **Can users request data deletion?** Yes — in-app account deletion
- **Ads or analytics?** No. The app contains no advertising SDK and no
  third-party analytics.
- **Data shared with third parties?** No. Supabase, Netlify and Anthropic
  are service providers processing data on EVENToPOINT's behalf, not
  independent recipients — Google's form treats that as "not shared".

## Content rating questionnaire

Category: **Utility, Productivity, Communication or Other**. Answer No to
everything — violence, sexuality, language, controlled substances, gambling,
user-to-user communication, location sharing, personal information sharing.
The app has no social layer at all. Expected result: rated for everyone / PEGI 3.

## Target audience

- **Target age:** 18 and over. It is a professional tool; declaring any
  under-18 audience pulls in Families policy requirements you do not want.
- **Appeals to children?** No.

## Ads

**Does your app contain ads?** No.

## Government apps / financial features / health

No to all three.
