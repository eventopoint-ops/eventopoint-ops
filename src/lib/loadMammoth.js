// Loads mammoth.js on demand, the first time someone actually opens AI
// Import.
//
// It used to sit in index.html as a plain <script> in the <head>, with no
// defer: a ~500KB render-blocking request to a CDN on every single launch,
// for a library most sessions never use. Nothing in the app could paint
// until that request finished, which on a phone on cellular was most of
// the perceived start-up time.
//
// Resolves with window.mammoth. Repeat calls share one promise, so opening
// the import modal twice doesn't fetch it twice.

const SRC = "https://cdn.jsdelivr.net/npm/mammoth@1.12.0/mammoth.browser.min.js";

let pending = null;

export function loadMammoth() {
  if (window.mammoth) return Promise.resolve(window.mammoth);
  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => {
      if (window.mammoth) {
        resolve(window.mammoth);
      } else {
        pending = null;
        reject(new Error("Document reader loaded but did not initialise."));
      }
    };
    script.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever —
      // this is usually a dead network on site, not a permanent problem.
      pending = null;
      reject(new Error("Could not load the document reader. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });

  return pending;
}
