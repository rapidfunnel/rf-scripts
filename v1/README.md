# RF Scripts v1 — Documentation

This directory contains client-side jQuery scripts for RapidFunnel-powered Webflow pages. All scripts read URL query parameters (`userId`, `resourceId`, `contactId`) to personalize page behavior and interact with the RapidFunnel API.

---

## Table of Contents

1. [analyticsDetails.js](#analyticsdetailsjs)
2. [bookMe.js](#bookmejs)
3. [branding.js](#brandingjs)
4. [contactForm.js](#contactformjs)
5. [contactFormGdpr.js](#contactformgdprjs)
6. [contactFormv2.js](#contactformv2js)
7. [ctaButton.js](#ctabuttonjs)
8. [ctaConversion.js](#ctaconversionjs)
9. [ctaResourceButton.js](#ctaresourcebuttonjs)
10. [placeholderScript.js](#placeholderscriptjs)
11. [requestCallForm.js](#requestcallformjs)
12. [userDetails.js](#userdetailsjs)
13. [videoScript.js](#videoscriptjs)

---

## analyticsDetails.js

**Purpose:** Dynamically injects third-party analytics tracking codes (Google Analytics, Facebook Pixel, Google Tag Manager) fetched from the RapidFunnel API based on the current user.

**How it works:**
1. Reads `userId` from the URL query string.
2. Calls `GET https://apiv2.rapidfunnel.com/v2/analytics/{userId}`.
3. The response contains `userData` and `accountData` objects, each potentially having:
   - `googleTrackingCode` — injects a GA4 `gtag.js` script.
   - `fbTrackingCode` — injects the Facebook Pixel snippet.
   - `gtmTrackingCode` — injects Google Tag Manager.
4. Deduplication is enforced per tracking code type using `Set` objects, so the same code is never injected twice.

**Dependencies:** jQuery, URL query param `userId`.

**Required HTML:** None (runs on DOM ready).

---

## bookMe.js

**Purpose:** Controls the visibility of a "Book Me" button based on whether it has a valid booking link.

**How it works:**
1. Finds `#bookMeBtn` and hides it on load.
2. Calls `checkAndShowButton()` immediately and also whenever the custom event `customBookingLinkUpdated` is fired (dispatched by `userDetails.js`).
3. Shows the button only if its `href` attribute is set to a non-empty, non-`#` value.

**Dependencies:** jQuery, `userDetails.js` (for the `customBookingLinkUpdated` event).

**Required HTML:**
```html
<a id="bookMeBtn" href="...">Book Me</a>
```

---

## branding.js

**Purpose:** Fetches a user's branding settings and applies their custom colors to designated page elements. Also controls the "Powered by RF" logo visibility.

**How it works:**
1. Reads `userId` from the URL.
2. Calls `GET https://app.rapidfunnel.com/api/branding/user/{userId}`.
3. Applies the following branding fields to elements by CSS class:

| API Field | CSS Class |
|---|---|
| `primaryColor` | `.rf_primaryColor` |
| `primaryColorOffset` | `.rf_primaryColorOff` |
| `secondaryColor` | `.rf_secondaryColor` |
| `secondaryColorOffset` | `.rf_secondaryColorOff` |
| `tertiaryColor` | `.rf_tertiaryColor` |
| `tertiaryColorOffset` | `.rf_tertiaryColorOff` |

4. Shows `#pbrf_logo` by default; hides it if `hidePoweredByRFLogoOnResources` is `true`.

**Dependencies:** jQuery, URL query param `userId`.

**Required HTML:** Elements with the CSS classes listed above, and optionally `#pbrf_logo`.

---

## contactForm.js

**Purpose:** Handles a contact capture form — pre-populates fields for known contacts, validates input, and submits to the RapidFunnel API.

**How it works:**
1. Reads `userId`, `resourceId`, and `contactId` from the URL.
2. If `contactId` exists, pre-populates form fields by calling `GET https://apiv2.rapidfunnel.com/v2/contact-details/{contactId}`.
3. On submit button click (`#contactFormSubmitBtn`):
   - Validates that First Name, Last Name, Email, and Phone are filled.
   - Posts to `https://my.rapidfunnel.com/landing/resource/create-custom-contact`.
   - Campaign ID and label ID are read from global variables `assignCampaignId` and `labelId` (must be defined on the page).
   - On success, redirects to the URL in `data-redirect` on `#contactFormSubmitContainer`, with `[user-id]`, `[resourceID]`, and `[contactId]` placeholders replaced.

**Dependencies:** jQuery, URL query params (`userId`, `resourceId`, `contactId`), global variables `assignCampaignId` and `labelId`.

**Required HTML:**
```html
<div id="contactFormSubmitContainer" data-redirect="https://example.com?userId=[user-id]&contactId=[contactId]">
  <input id="contactFirstName" type="text">
  <input id="contactLastName" type="text">
  <input id="contactEmail" type="email">
  <input id="contactPhone" type="tel">
  <button id="contactFormSubmitBtn">Submit</button>
</div>
```

---

## contactFormGdpr.js

**Purpose:** A two-part script that handles GDPR-compliant contact form submission. Part 1 validates the form and consent fields; Part 2 creates the RapidFunnel contact via API. Both parts are defined in the same file and communicate through shared global flags on `window`.

---

### Part 1 — Validation

**How it works:**
1. Listens for the click event on `#contactFormSubmitBtn`.
2. Sets `window.isValidating = true` to prevent duplicate triggers.
3. Validates that First Name, Last Name, Email, and Phone are all filled.
4. Validates that the `#gdprConsent` checkbox is checked.
5. If validation fails: shows inline error messages and resets `window.isValidating = false`.
6. If validation passes:
   - Sets `window.validationComplete = true`.
   - Calls `window.createContactAfterValidation()` (defined in Part 2).

---

### Part 2 — Contact Creation

**How it works:**
- Checks `window.validationComplete` on load; exits immediately if `false`.
- Exposes `window.createContactAfterValidation()` globally, invoked by Part 1.
- On invocation:
  1. Reads `userId` and `resourceId` from the URL.
  2. Reads `data-campaign` and `data-label` from `#contactFormContainer`.
  3. Disables the submit button and shows the spinner.
  4. Posts form data to `https://my.rapidfunnel.com/landing/resource/create-custom-contact`.
  5. On success, redirects to `data-redirect` with `userId`, `resourceId`, and the new `contactId` appended.
  6. If no redirect URL, clears the form (including `#gdprConsent` and `#marketingConsent` checkboxes) and shows a success alert.
- Prevents double submission via an `isSubmitting` flag.
- Resets `window.validationComplete` and `window.isValidating` after each attempt.

**Dependencies:** jQuery, URL query params (`userId`, `resourceId`).

**Required HTML:**
```html
<div id="contactFormContainer" data-campaign="CAMPAIGN_ID" data-label="LABEL_ID" data-redirect="https://example.com">
  <input id="contactFirstName">
  <input id="contactLastName">
  <input id="contactEmail">
  <input id="contactPhone">
  <input id="gdprConsent" type="checkbox">
  <input id="marketingConsent" type="checkbox">
  <button id="contactFormSubmitBtn">
    <span class="btn-text">Submit</span>
    <span class="spinner" style="display:none"></span>
  </button>
</div>
```

---

## contactFormv2.js

**Purpose:** An updated version of `contactFormGdpr.js`, also a two-part script. Adds a stricter second validation flag (`window.VALIDATION_PASSED`) and uses a more generic submit button selector instead of a hard-coded ID.

---

### Part 1 — Validation

**How it works:**
1. Listens for the submit event on the form inside `.form-container`.
2. Sets `window.isValidating = true` to prevent duplicate triggers.
3. Validates that First Name, Last Name, Email, and Phone are all filled.
4. Validates that the `#gdprConsent` checkbox is checked.
5. If validation fails: shows inline error messages and resets `window.isValidating = false`.
6. If validation passes:
   - Sets both `window.validationComplete = true` and `window.VALIDATION_PASSED = true`.
   - Calls `window.createContactAfterValidation()` (defined in Part 2).

---

### Part 2 — Contact Creation

Behaves the same as `contactFormGdpr.js` Part 2 with the following differences:

| Feature | contactFormGdpr.js | contactFormv2.js |
|---|---|---|
| Validation gate | `window.validationComplete` only | `window.validationComplete` **AND** `window.VALIDATION_PASSED` |
| Submit button selector | `#contactFormSubmitBtn` (by ID) | `.form-container form button[type="submit"]` (generic) |
| GDPR fields cleared on success | Yes | No |
| VALIDATION_PASSED reset after submit | Not applicable | Yes — `window.VALIDATION_PASSED = false` |

**Dependencies:** jQuery, URL query params (`userId`, `resourceId`).

**Required HTML:** Same as `contactFormGdpr.js`, except the submit button does not require a specific ID — it only needs to be a `button[type="submit"]` or `input[type="submit"]` inside `.form-container form`.

---

## ctaButton.js

**Purpose:** Intercepts clicks on CTA buttons, sends a notification email to the user, and then redirects the visitor to the button's linked URL.

**How it works:**
1. Reads `userId`, `resourceId`, and `contactId` from the URL.
2. Attaches a click handler to all elements with an ID starting with `ctaButton`.
3. On click:
   - If `contactId` is present: fetches contact details from the API, then POSTs to `https://app.rapidfunnel.com/api/mail/send-cta-email` with contact info, button description (`data-description`), and page name.
   - Redirects to the button's `href` (in a new tab if `target="_blank"`), regardless of whether the email succeeded.

**Dependencies:** jQuery, URL query params (`userId`, `contactId`).

**Required HTML:**
```html
<a id="ctaButton1" href="https://example.com" target="_blank" data-description="Main CTA">Click Here</a>
```

---

## ctaConversion.js

**Purpose:** Similar to `ctaButton.js` but uses a separate conversion email endpoint, intended for conversion-tracked buttons.

**How it works:**
1. Reads `userId` and `contactId` from the URL.
2. Listens for clicks on elements with IDs starting with `ctaConversionButton`.
3. On click:
   - If `contactId` is present: fetches contact details, then POSTs to `https://app.rapidfunnel.com/api/mail/send-cta-conversion-email`.
   - If no `contactId` or if the contact fetch fails, sends the email with placeholder values (`"No contact ID found"` or `"System failed to answer"`).
   - Redirects to the button's `href` after the email attempt (success or failure).

**Dependencies:** jQuery, URL query params (`userId`, `contactId`).

**Required HTML:**
```html
<a id="ctaConversionButton1" href="https://example.com" data-description="Download PDF">Download</a>
```

---

## ctaResourceButton.js

**Purpose:** Handles CTA buttons that link to RapidFunnel resources. Dynamically sets the button href from the API on page load, then sends a tracking email on click before redirecting.

**How it works:**
1. Reads `userId`, `contactId` from the URL.
2. On load, iterates all elements with IDs starting with `ctaResourceButton` and calls `GET https://app.rapidfunnel.com/api/api/resources/resource-details/` using `data-cta-resource-id` as the resource ID. Sets the resolved URL (appended with `userId` and optional `contactId`) as the button's `href`.
3. On click:
   - If `contactId` is present: fetches contact details, then POSTs to `https://app.rapidfunnel.com/api/mail/send-cta-email`.
   - Redirects to the button's `href` after the email attempt (or immediately if no `contactId`).

**Dependencies:** jQuery, URL query params (`userId`, `contactId`).

**Required HTML:**
```html
<a id="ctaResourceButton1" data-cta-resource-id="123" data-cta-res-location="Hero Section">View Resource</a>
```

---

## placeholderScript.js

**Purpose:** A general-purpose utility that replaces URL placeholder tokens in all `<a>` tag `href` attributes across the page.

**How it works:**
1. Reads `userId`, `resourceId`, and `contactId` from the URL.
2. Iterates every `<a>` on the page and replaces the following tokens in `href` values:
   - `[user-id]` → `userId`
   - `[userId]` → `userId`
   - `[contactId]` → `contactId`
3. If a param is absent, the placeholder is replaced with an empty string.

**Dependencies:** jQuery.

**Usage:** Add this script to any page where links contain `[user-id]`, `[userId]`, or `[contactId]` tokens that need to be resolved from the URL.

---

## requestCallForm.js

**Purpose:** Handles a "Request a Call" interaction. Displays either a pre-filled button (for known contacts) or a form (for anonymous visitors), and sends an email notification to the user.

**How it works:**
1. Reads `userId`, `resourceId`, and `contactId` from the URL.
2. Display logic:
   - If `contactId` exists: hides `#requestCallForm`, shows `#requestCallBtn`.
   - If no `contactId`: hides `#requestCallBtn`, shows `#requestCallForm`.
3. `#requestCallBtn` click (known contact):
   - Fetches contact details from the API.
   - POSTs to `https://app.rapidfunnel.com/api/mail/send-request-call-email` with the contact's name and phone.
4. `#requestForm form` submit (anonymous visitor):
   - Reads First Name, Last Name, and Phone from `#contactFirstNameRequestForm`, `#contactLastNameRequestForm`, `#contactPhoneRequestForm`.
   - POSTs to the same email endpoint.
   - Shows `.w-form-done` on success or `.w-form-fail` on error.

**Dependencies:** jQuery, URL query params (`userId`, `contactId`), global variable `resourceDescriptionForRequestCall` (must be defined on the page).

**Required HTML:**
```html
<div id="requestForm">
  <form>
    <input id="contactFirstNameRequestForm">
    <input id="contactLastNameRequestForm">
    <input id="contactPhoneRequestForm">
  </form>
  <div class="w-form-done" style="display:none">Success</div>
  <div class="w-form-fail" style="display:none">Error</div>
</div>
<button id="requestCallBtn">Request a Call</button>
<div id="requestCallForm">...</div>
```

---

## userDetails.js

**Purpose:** Fetches the assigned user's profile data and populates page elements dynamically. Also manages booking link visibility and social media links.

**How it works:**
1. Reads `userId` from the URL.
2. Calls `GET https://apiv2.rapidfunnel.com/v2/users-details/{userId}`.
3. For each key in the returned `userData` object:
   - Profile images (`profileImage*`): sets the `src` of matching `[id^=key]` elements (falls back to a default avatar).
   - `email`: sets `href="mailto:..."` and text content on `#email`.
   - `phoneNumber`: sets `href="tel:..."` and text; hides parent if empty.
   - `customBookingLink`: sets `href` on `#customBookingLink` and `.custom_custombookinglink`; hides the element if empty; fires the `customBookingLinkUpdated` custom event.
   - All other fields: sets text content on the element with a matching `id`.
4. Populates `.firstName` and `.lastName` by class.
5. Handles `.footer-social-links a` elements: sets `href` if the matching key exists in user data, otherwise hides the link.
6. Removes Font Awesome icon pseudo-content for email/phone icons to prevent duplicate rendering.
7. Stores `customBookingLink` in `window.sharedData.customBookingLink` for cross-script access.

**Dependencies:** jQuery, URL query param `userId`.

**Required HTML:** Elements with IDs matching RapidFunnel user data field names (e.g., `#firstName`, `#lastName`, `#email`, `#phoneNumber`, `#customBookingLink`, `#facebookUrl`, etc.).

---

## videoScript.js

**Purpose:** Integrates Wistia video analytics with RapidFunnel tracking. Sends play events to the RapidFunnel SQS queue and controls the "Book Me" container visibility based on watch time.

**How it works:**
1. Adds Wistia embed classes to any `<iframe>` elements whose `src` contains `"wistia"`.
2. Listens to `customBookingLinkUpdated` event: shows or hides `#requestCallContainer` based on whether `#customBookingLink` has a valid href.
3. If `showBookMeAfterTimeInSecondsPassedInVideo > 0` (global variable), hides `#bookMeContainer` on load.
4. Uses the Wistia `_wq` API to bind to all videos:
   - **`play` event:** Captures `percentWatched`, `hashedId`, `duration`, `visitorKey`, and `eventKey`, then pushes to SQS via `POST https://my.rapidfunnel.com/landing/resource/push-to-sqs`.
   - **`secondchange` event:** Shows `#bookMeContainer` once `secondsWatched >= showBookMeAfterTimeInSecondsPassedInVideo`.
5. Only tracks if `contactId`, `resourceId`, and `userId` are all valid numerics.

**Dependencies:** jQuery, Wistia embed script, URL query params (`userId`, `resourceId`, `contactId`), global variable `showBookMeAfterTimeInSecondsPassedInVideo`.

**Required HTML:** Wistia `<iframe>` embeds, `#bookMeContainer`, `#requestCallContainer`, `#customBookingLink`, optionally `#webinar` (hidden input) and `#contactEmail`.
