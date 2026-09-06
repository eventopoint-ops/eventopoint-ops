// Which shell is the app running inside?
//
// Capacitor injects a global `Capacitor` object into the webview of the
// native builds. Reading the global rather than importing from
// '@capacitor/core' keeps the plain web bundle free of any Capacitor
// runtime code -- on eventopoint.app this simply evaluates to undefined.

function cap() {
  return typeof globalThis !== 'undefined' ? globalThis.Capacitor : undefined
}

export function isNativePlatform() {
  const c = cap()
  return Boolean(c?.isNativePlatform?.())
}

export function getPlatform() {
  const c = cap()
  if (typeof c?.getPlatform === 'function') return c.getPlatform()
  return 'web'
}

// True only inside the native iOS app.
//
// Used to suppress the external Stripe checkout call-to-action there.
// App Store Review Guideline 3.1.1 governs how (and whether) an iOS app
// may point users at an outside purchase flow for digital content used in
// the app; the safe position for review is to not surface the CTA at all
// and let people subscribe on the web. The billing banner is advisory
// rather than a hard paywall, so nothing about the app stops working.
export function isNativeIOS() {
  return isNativePlatform() && getPlatform() === 'ios'
}
