# Screen recording for Apple — shot list

Apple asked for one recording, captured on a **physical device** running
the latest iOS, that starts at app launch and walks the typical user
through the core features. Simulator footage does not satisfy this.

**Target length: 3–4 minutes.** Do it in one take. It does not need to be
pretty — no narration, no editing, no music. It is evidence, not marketing.

## Before you press record

- Install the new build on your iPhone from Xcode or TestFlight.
- Update your iPhone to the latest iOS.
- Register a throwaway account you're willing to destroy on camera — e.g.
  `review-demo+1@eventopoint.com`. You will delete it at the end. Do not
  use the demo account you gave Apple.
- Have the demo account's email and password ready to type.
- Settings → Control Centre → add Screen Recording if it isn't there.
- Turn on Do Not Disturb so no notification banner lands mid-take.

## The take

Go slowly. Pause about two seconds on each screen so the reviewer can read
it. Every numbered step must be visible in the recording.

1. **Launch from the home screen.** Start the recording on your home
   screen, tap the EVENToPOINT icon, and let the app open. Apple
   explicitly requires the recording to begin with launching the app.

2. **Registration.** On the sign-in screen, switch to sign-up. Register the
   throwaway account: type the email, type the password, submit. Let it
   land on the organization-name step, type an org name, continue through
   to the empty dashboard. Pause there — the empty state is fine, it shows
   registration genuinely worked.

3. **Sign out**, using the Sign out button in the header.

4. **Sign in** with the demo account (`<DEMO_EMAIL>`). Type it out on
   camera. Land on the dashboard with real events on the calendar.

5. **Dashboard.** Swipe the calendar back and forward one month. Tap an
   event from the list to open it.

6. **Run of Show.** Scroll the task list. Show a task in each phase. Tap a
   task to mark it done, then untap it. Make sure an overdue badge is
   visible on screen at some point.

7. **Add a task manually.** Type a task name and time, add it, show it
   appearing in the list.

8. **AI Import.** Open the AI Import modal so the reviewer sees the
   feature exists. You do not have to complete an upload — if you have a
   .docx run-of-show in Files on the phone, running it end to end is
   better, but opening the modal and closing it is acceptable.

9. **Team tab.** Show the team members. Show the check-in link being
   copied for one member, and a "checked in" badge on another.

10. **Vendors tab.** Show a vendor with a file attached. Tap the file to
    open it.

11. **Wrap-Up tab.** Show the post-event notes and summary.

12. **Subscription state.** Go back to the dashboard. If the billing
    banner is showing, pause on it for two seconds. It should read as a
    status message with **no Subscribe button** — that is the 3.1.1 fix
    and it is worth having on tape.

13. **Sign out, then sign back in as the throwaway account** from step 2.

14. **Account deletion — do not skip this.** Tap **Account** in the header.
    Show the Account screen. Tap **Delete my account**. Show the warning
    text. Type `DELETE` in the confirm box. Tap **Permanently delete my
    account**. Let it complete and drop you back to the sign-in screen.

15. **Prove it's gone.** Try to sign in with the throwaway account's
    credentials again and show the failure. Then stop recording.

## After

- Trim nothing except dead air at the very start and end.
- Upload it in App Store Connect → your app version → App Review
  Information → Attachment.
- Then reply in Resolution Center pointing at the notes and the video.
