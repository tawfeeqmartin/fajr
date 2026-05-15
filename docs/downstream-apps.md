# Downstream App Integration Notes

Last refreshed: 2026-05-15

This guide captures integration patterns learned from
[A Gift of Time](https://agiftoftime.app), fajr's reference downstream app.
The goal is to help app builders use fajr's provenance and safety signals
without re-discovering the same edge cases.

For API-level wiring, see
[`examples/agiftoftime/INTEGRATION.md`](../examples/agiftoftime/INTEGRATION.md).
This page is the product/QA playbook that sits beside that implementation
guide.

## Load Once

If an app uses several fajr APIs, load the module once and share the promise.
This matters for browser and PWA consumers because fajr is intentionally
offline-capable and includes city, Hijri, hilal, and astronomy data.

```js
window._loadFajr = (function () {
  let promise = null
  return function loadFajr() {
    if (promise) return promise
    promise = import('https://esm.sh/@tawfeeqmartin/fajr@1.9.2')
      .catch(err => {
        promise = null
        throw err
      })
    return promise
  }
})()
```

If the first import fails, clear the cached promise so a later retry can
succeed. Do not import fajr separately for city labels, prayer times, qibla,
and hilal.

## Trust Provenance

Use fajr's source fields to decide how prominent verification UI should be.
A practical rule from agiftoftime:

```js
const locationTrusted = ['gps', 'manual'].includes(appLocationConfidence)
const methodTrusted = times.location?.methodSource !== 'fallback'
const satisfied = locationTrusted && methodTrusted
```

When `satisfied` is false, keep the location/method affordance visible and ask
the user to verify. When it is true, let the UI become quieter. The important
fields are:

- `location.methodSource`
- `location.elevationSource`
- `location.source`
- `location.asrConvention`
- `applied.asrSchool`
- `notes[]`
- `warnings[]`

Do not render deprecated `location.madhab` / `applied.madhab` as legal-madhhab
labels. Use `location.asrConvention` and `applied.asrSchool`.

## Respect Null

`detectLocation()` returns `city: null` when it cannot identify a city
confidently. Treat that as a feature, not as a failure.

```js
function displayCity(loc) {
  return loc?.city?.name || 'Current Location'
}
```

Avoid replacing `null` with a guessed distant city from a generic
reverse-geocoder. A rural user is better served by an honest "Current Location"
label than by a false city name.

## Write For Users

When exposing advanced prayer-time options, pair scholarly citations with
plain language. A useful row has three layers:

- Citation: `AABED 2015 - FASTING YAQEEN`
- Technical label: `Tayakkun - 5-min Fajr safety`
- Layman copy: `Stops eating 5 minutes before calculated Fajr during Ramadan.`

The citation helps reviewers and scholars; the layman copy helps normal users.
Do not show only paper names or internal feature names.

## Validate Before Shipping

Every downstream app should keep its own smoke tests for the fajr surfaces it
uses. At minimum:

- A few representative home locations.
- Border or metro locations your users are likely to hit.
- Ramadan dates.
- DST transition dates for countries with clock changes.
- Qibla bearings for known cities.
- Hijri dates around Eid boundaries.

For agiftoftime-style release validation, run these before bumping fajr:

```bash
npm test
node tests-fajr.mjs
```

Then inspect the app UI for:

- city/country/timezone provenance
- Asr convention copy
- elevation notes
- imsak and night-thirds display
- qibla direction
- hilal/Eid messaging

When a downstream app catches a fajr bug, upstream fajr should add a permanent
regression assertion. Downstream validation is a safety net, not a substitute
for upstream tests.

## Bundle Permissions

Islamic time/orientation apps often need GPS, device orientation, motion, and
notifications. On mobile browsers, especially iOS Safari, permission requests
must be attached to a clear user gesture.

Recommended pattern:

- Ask during one explicit interaction, not silently on page load.
- Fire related permission requests from the same gesture.
- Provide manual location entry as a privacy-preserving fallback.
- Explain platform-specific recovery steps after denial.

Do not make GPS mandatory for prayer times if manual city/coordinate entry can
serve the user.

## Release Handoff

When fajr publishes a release that changes provenance, location routing,
default methods, Hijri output, or return-shape semantics, the fajr maintainer
should open a downstream issue with concrete probes. A useful handoff includes:

- package version and release link
- exact coordinates or dates to test
- expected `location`, `applied`, `notes[]`, and `warnings[]` changes
- explicit "no app code change expected" or "app code change required" wording
- screenshots or provenance-panel checks when UI copy may be affected

This keeps cross-repo knowledge durable and lets downstream agents validate
against the same contract fajr intended to ship.
