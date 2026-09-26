# Roles, scoped access, and location — spec

Requested 2026-09-13. NOT part of the launch; this is the next build.

## The problem

Today the app has one kind of person: an org member who signs in and sees
everything in the organization. Real events have three, and they should
not see the same things.

| Who | Signs in? | Sees |
|---|---|---|
| **Admin / Manager** | Yes, full account | Everything in the org — all events, all tasks, all people, all vendors. Creates events, assigns work, sends links. |
| **Worker / Crew** | No account — token link | Only the events they are assigned to, and within those, only their own tasks. Can mark their tasks done and check in. |
| **Vendor / Third party** | No account — token link | Only their own tasks for the one event they were hired for. Can mark them ready. Sees nothing about other vendors, the crew, or the rest of the run of show. |

## Why tokens, not accounts, for crew and vendors

The check-in flow already works this way: `team_members.token` plus a
public `/checkin/:token` route and two SECURITY DEFINER RPCs
(`get_checkin_info`, `check_in_team_member`). It needs no login, which is
the entire point — a banquet captain on a loading dock will not create an
account, and a florist will not either.

Extending that same mechanism is much less work than building a real
multi-role auth system, and it fails safe: a token grants exactly the rows
the RPC returns and nothing else, so there is no RLS surface to get wrong.

## What needs building

**Crew task links**
- `/crew/:token` — resolves `team_members.token`, lists that member's
  assigned tasks (`tasks.assigned_team_member_id`) for that event only.
- RPCs: `get_crew_tasks(token)`, `set_crew_task_status(token, task_id, status)`.
- TeamTab gains a "Copy task link" alongside the existing check-in link.
- A member assigned to several events gets one link per event row, since
  `team_members` rows are already per-event.

**Vendor task links**
- `vendors` has no token column and no tasks of its own yet. Needs
  `vendors.token` (same default as team_members) and a way to assign a
  task to a vendor — either `tasks.assigned_vendor_id` or a small
  `vendor_tasks` table. The first is simpler and keeps one task list.
- `/vendor/:token` — that vendor's tasks for that event, mark-ready only.
- VendorsTab gains "Copy vendor link".

**Roles for signed-in users**
- `profiles.role` exists and defaults to `admin`, but the
  `lock_profile_org_and_role` trigger blocks any role change, so today
  everyone is an admin. Needs: an admin-only path to set another member's
  role (service-role RPC, since the trigger correctly refuses client
  writes), and RLS that distinguishes admin from manager from member.
- Worth deciding whether "manager" is a real role or just an admin who
  didn't create the org. Two roles may be enough: admin and member.

## Location — read this before building it

"Tracking location" is two completely different products and only one of
them is a good idea.

**Check-in location (recommended).** When a crew member taps their
check-in link, capture coordinates once, at that moment, with the browser
permission prompt. Answers "did they actually arrive at the venue" —
which is the real operational question, and what a producer needs when
someone claims they are on site. One reading, one moment, tied to an
action the person deliberately took.

**Continuous tracking (do not).** Following staff on a map through the
day is employee surveillance. It carries real legal exposure — several
US states, New York included, require written notice for electronic
monitoring of employees, and consent rules differ by state. It also
changes the app's character: crew will notice, and it damages the trust
the check-in link depends on. Clients would have to be told too, since
their venue is the location being recorded.

**Store consequences either way.** Both app listings currently declare
that the app requests no device permissions and does not use location —
that is what was submitted to Apple in the review notes and what the
Google Play data safety form says. Adding any location capture means:
- an `NSLocationWhenInUseUsageDescription` string in the iOS build,
- updating the App Store privacy nutrition label,
- updating the Play data safety declaration,
- updating `public/privacy.html`,
- a new build and a new review for both stores.

Not a blocker, but it is not a small change either, and it should ship
deliberately rather than slipped into a patch release.

## Suggested order

1. Crew task links — reuses the existing token machinery, highest value
   for the least new surface.
2. Vendor tokens and vendor-assigned tasks.
3. Roles for signed-in users.
4. Check-in location, with the store paperwork done properly alongside it.
