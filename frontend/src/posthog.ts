import posthog from "posthog-js";

// Free-tier PostHog allows a single project, so prod / dev / preview all
// share the same event bucket. Two guards keep the noise contained:
//
//   1. We only initialize when the current build is prod (or when the
//      author explicitly flips `VITE_POSTHOG_DEBUG=true` to smoke-test
//      instrumentation on a preview). Local `npm run dev` and the auto
//      dev-deploy stay silent, so we don't burn the event quota on
//      traffic nobody's going to look at.
//
//   2. Whenever we DO initialize, every event carries an `environment`
//      super-property (`production` / `development`). That lets the
//      project-level "test-account filters" carve `environment !=
//      production` out of every dashboard by default, so debug builds
//      that make it into the pipe don't get mixed into prod numbers.
//
// Both env vars keep their existing `VITE_PUBLIC_*` names for
// continuity with the original init.
const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
const environment = import.meta.env.VITE_ENVIRONMENT ?? "development";
const debug = import.meta.env.VITE_POSTHOG_DEBUG === "true";
const shouldCapture = environment === "production" || debug;

if (shouldCapture && apiKey && apiHost) {
  posthog.init(apiKey, {
    api_host: apiHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: import.meta.env.DEV,
    // Session replay privacy defaults: CVH's UI shows workspace names,
    // dataset descriptions, viz titles, and pasted Vitessce/Gosling
    // configs — plenty of surfaces where a user might have unpublished
    // or embargoed metadata visible. Mask all input values by default so
    // form fields (Add Dataset URL/name, the Monaco code editor, the
    // Quick Dataset ID Lookup) don't stream verbatim into recordings.
    // To un-mask a specific field, add `data-ph-capture-attribute-...`
    // or the `ph-no-mask` class per PostHog's recording API.
    session_recording: {
      maskAllInputs: true,
    },
    loaded: (ph) => {
      // Register as a super-property so every subsequent capture (and
      // autocapture) attaches it automatically.
      ph.register({ environment });
    },
  });
} else if (shouldCapture && import.meta.env.DEV) {
  // We're in the debug-capture branch but missing config — noisy fail
  // so the missing var is obvious, otherwise events would silently stop
  // landing.
  const missingVariable = apiKey
    ? "VITE_PUBLIC_POSTHOG_HOST"
    : "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN";
  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

export default posthog;
