/**
 * rf-wire.js
 * RapidFunnel universal wiring script — vanilla JS, no dependencies.
 *
 * Replaces: userDetails.js, analyticsDetails.js, placeholderScript.js,
 *           contactFormUnified.js, ctaButtonUnified.js, bookMe.js, videoScript.js
 *
 * ── Three-layer data model ────────────────────────────────────────────────────
 *
 *   URL params (runtime, never in HTML)
 *     ?userId=      — who the rep is; drives all API calls
 *     ?contactId=   — who the visitor is; drives tracking and form pre-fill
 *     ?resourceId=  — which page resource this is; drives form and video tracking
 *
 *   HTML meta / data attributes (page-generation time, baked into the file)
 *     data-rf-campaign-id on #contactFormContainer — campaign to enrol contacts into (optional)
 *     data-rf-label-id    on #contactFormContainer — optional label/tag
 *     data-redirect       on #contactFormContainer — post-submit redirect URL
 *
 *   APIs (runtime, fetched by this script using URL params)
 *     GET  https://apiv2.rapidfunnel.com/v2/users-details/{userId}
 *     GET  https://apiv2.rapidfunnel.com/v2/analytics/{userId}
 *     GET  https://app.rapidfunnel.com/api/branding/user/{userId}
 *     GET  https://apiv2.rapidfunnel.com/v2/contact-details/{contactId}
 *     GET  https://app.rapidfunnel.com/api/api/resources/resource-details/
 *     POST https://my.rapidfunnel.com/landing/resource/create-custom-contact
 *     POST https://my.rapidfunnel.com/landing/resource/push-to-sqs
 *     POST https://app.rapidfunnel.com/api/mail/send-cta-email
 *     POST https://app.rapidfunnel.com/api/mail/send-cta-conversion-email
 *
 * ── DOM contract (data-rf-* attributes) ──────────────────────────────────────
 *   data-rf-block="blockName"       — container hidden by default; shown when API returns data
 *   data-rf-slot="key.subkey"       — text content injected from API response
 *   data-rf-attr="attrName"         — inject into HTML attribute instead of text
 *   data-rf-prefix="value"          — prepend to injected href values (mailto: / tel:)
 *   data-rf-src="key.subkey"        — inject into img src
 *   data-rf-repeat="arrayKey"       — template element cloned once per array item
 *   data-rf-form="contactForm"      — marks the form container div
 *   data-button-type="cta|conversion|resource"  — CTA button tracking type
 *   data-location="..."             — button location label for tracking emails
 *   data-resource-id="..."          — optional per-video resource ID override
 */

(function () {
  'use strict';

  const LOG = '[rf-wire]';

  // ═══════════════════════════════════════════════════════════════════════════
  // URL PARAMETERS
  // ═══════════════════════════════════════════════════════════════════════════

  const _params = (function () {
    try {
      const p = new URL(window.location.href).searchParams;
      return {
        userId:     p.get('userId')     || '',
        contactId:  p.get('contactId')  || '',
        resourceId: p.get('resourceId') || ''
      };
    } catch (e) {
      console.error(LOG, 'Could not parse URL params:', e);
      return { userId: '', contactId: '', resourceId: '' };
    }
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED STATE
  // ═══════════════════════════════════════════════════════════════════════════

  window.rfShared = window.rfShared || {};

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function get(url, params) {
    const u = new URL(url);
    if (params) Object.keys(params).forEach(k => u.searchParams.set(k, params[k]));
    return fetch(u.toString()).then(r => r.ok ? r.json() : Promise.reject(r.status));
  }

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString()
    }).then(r => r.ok ? r.json() : Promise.reject(r.status));
  }

  function postJSON(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(r => r.ok ? r.json() : Promise.reject(r.status));
  }

  // Resolve a dot-notation key against an object: "rep.firstName" → obj.rep.firstName
  function resolve(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  function injectScript(src, async) {
    const s = document.createElement('script');
    s.src = src;
    if (async) s.async = true;
    document.head.appendChild(s);
    return s;
  }

  function getPageName() {
    return document.querySelector('meta[name="page-name"]')?.content ||
           document.querySelector('meta[property="og:title"]')?.content ||
           document.title || 'Unknown Page';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCK VISIBILITY
  // ═══════════════════════════════════════════════════════════════════════════

  function showBlock(blockName) {
    document.querySelectorAll(`[data-rf-block="${blockName}"]`)
      .forEach(el => el.style.display = '');
  }

  function hideBlock(blockName) {
    document.querySelectorAll(`[data-rf-block="${blockName}"]`)
      .forEach(el => el.style.display = 'none');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLOT INJECTION
  // Populates all [data-rf-slot] elements from a flat or nested data object.
  // ═══════════════════════════════════════════════════════════════════════════

  function injectSlots(data, context) {
    const root = context || document;

    root.querySelectorAll('[data-rf-slot]').forEach(el => {
      const key    = el.getAttribute('data-rf-slot');
      const attr   = el.getAttribute('data-rf-attr');
      const prefix = el.getAttribute('data-rf-prefix') || '';
      const value  = resolve(data, key);

      if (value === undefined || value === null || value === '') return;

      const str = String(value);

      if (attr) {
        el.setAttribute(attr, prefix + str);
        // Set text content only for link elements displaying their own value as text
        // (e.g. email and phone links). Skip elements that:
        //   - already have static text content (e.g. "Book Me", icon elements)
        //   - are icon elements (<i>, <span> used as icons)
        //   - are injecting a class attribute (social icon class injection)
        const tag = el.tagName.toLowerCase();
        const isIconEl = tag === 'i' || attr === 'class';
        const hasStaticText = el.textContent.trim() !== '';
        if (!isIconEl && !hasStaticText && !el.getAttribute('data-rf-src')) {
          el.textContent = str;
        }
      } else {
        el.textContent = str;
      }
    });

    root.querySelectorAll('[data-rf-src]').forEach(el => {
      const key   = el.getAttribute('data-rf-src');
      const value = resolve(data, key);
      if (value) el.src = value;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPEAT INJECTION
  // Clones a [data-rf-repeat] template element once per array item.
  // ═══════════════════════════════════════════════════════════════════════════

  function injectRepeat(arrayKey, items, context) {
    const root = context || document;
    root.querySelectorAll(`[data-rf-repeat="${arrayKey}"]`).forEach(template => {
      const parent = template.parentNode;
      items.forEach(item => {
        const clone = template.cloneNode(true);
        clone.removeAttribute('data-rf-repeat');
        // Inject top-level slot on the clone itself
        const topSlot   = clone.getAttribute('data-rf-slot');
        const topAttr   = clone.getAttribute('data-rf-attr');
        const topPrefix = clone.getAttribute('data-rf-prefix') || '';
        if (topSlot && topAttr) {
          const val = item[topSlot];
          if (val) clone.setAttribute(topAttr, topPrefix + val);
        }
        injectSlots(item, clone);
        parent.insertBefore(clone, template);
      });
      template.remove();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CSS VARIABLE INJECTION (Branding)
  // ═══════════════════════════════════════════════════════════════════════════

  function injectBranding(brandingData) {
    if (!brandingData || typeof brandingData !== 'object') return;

    // Confirmed field mapping from GET https://app.rapidfunnel.com/api/branding/user/{userId}
    // API returns: primaryColor, primaryColorOffset, secondaryColor, secondaryColorOffset,
    //              tertiaryColor, tertiaryColorOffset, dashboardLogo, favIcon, accountName
    // The API does not return font or border-radius values — those stay as :root defaults.
    const cssMap = {
      primaryColor:       '--rf-primary',
      primaryColorOffset: '--rf-primary-dark',   // closest semantic match: dark/offset of primary
      secondaryColor:     '--rf-secondary',
      secondaryColorOffset: '--rf-secondary-dark',
      tertiaryColor:      '--rf-tertiary',
      tertiaryColorOffset: '--rf-tertiary-dark'
    };

    const root = document.documentElement;
    Object.keys(cssMap).forEach(apiKey => {
      const val = brandingData[apiKey];
      if (val) root.style.setProperty(cssMap[apiKey], val);
    });

    // Dashboard logo — inject into any element tagged data-rf-src="branding.dashboardLogo"
    // or into a [data-rf-block="brandLogo"] container's img
    if (brandingData.dashboardLogo) {
      document.querySelectorAll(
        '[data-rf-src="branding.dashboardLogo"], [data-rf-block="brandLogo"] img'
      ).forEach(img => { img.src = brandingData.dashboardLogo; });
      showBlock('brandLogo');
    }

    // Favicon
    if (brandingData.favIcon) {
      let link = document.querySelector('link[rel="icon"]') ||
                 document.querySelector('link[rel="shortcut icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = brandingData.favIcon;
    }

    // Account / brand name — populate any slot tagged branding.accountName
    if (brandingData.accountName) {
      document.querySelectorAll('[data-rf-slot="branding.accountName"]')
        .forEach(el => { el.textContent = brandingData.accountName; });
    }

    // RF logo visibility — hide "Powered by RapidFunnel" if account has opted out
    if (brandingData.hidePoweredByRFLogoOnResources === true) {
      document.querySelectorAll('[data-rf-block="rfPoweredBy"], .rf-footer-logo')
        .forEach(el => { el.style.display = 'none'; });
    }

    console.log(LOG, 'Branding applied — primary:', brandingData.primaryColor);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS INJECTION
  // ═══════════════════════════════════════════════════════════════════════════

  const _injected = { ga: new Set(), fb: new Set(), gtm: new Set() };

  function injectGA4(id) {
    if (!id || _injected.ga.has(id)) return;
    _injected.ga.add(id);
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${id}`, true);
    const s = document.createElement('script');
    s.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`;
    document.head.appendChild(s);
    console.log(LOG, 'GA4 injected:', id);
  }

  function injectFBPixel(id) {
    if (!id || typeof id !== 'string' || !id.trim() || _injected.fb.has(id)) return;
    id = id.trim();
    _injected.fb.add(id);
    const s = document.createElement('script');
    s.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
    document.head.appendChild(s);
    console.log(LOG, 'FB Pixel injected:', id);
  }

  function injectGTM(id) {
    if (!id || _injected.gtm.has(id)) return;
    _injected.gtm.add(id);
    const s = document.createElement('script');
    s.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
    document.head.appendChild(s);
    console.log(LOG, 'GTM injected:', id);
  }

  function processAnalyticsPayload(data) {
    if (!data || typeof data !== 'object') return;
    if (data.googleTrackingCode) injectGA4(data.googleTrackingCode);
    if (data.fbTrackingCode)     injectFBPixel(data.fbTrackingCode);
    if (data.gtmTrackingCode)    injectGTM(data.gtmTrackingCode);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER DETAILS
  // ═══════════════════════════════════════════════════════════════════════════

  function applyUserDetails(userData) {
    if (!userData || typeof userData !== 'object') return;

    // Wrap data under a "rep" namespace for slot resolution ("rep.firstName", etc.)
    const slotData = { rep: userData };

    // Profile image — hide the element entirely when no photo was returned.
    // Never show a generic placeholder icon; a rep with no photo on file simply
    // gets no image in the footer, rather than a fake/generic avatar.
    document.querySelectorAll('[data-rf-src^="rep.profileImage"], [id^="profileImage"]').forEach(img => {
      const key = img.getAttribute('data-rf-src')
        ? img.getAttribute('data-rf-src').replace(/^rep\./, '')
        : img.id;
      const val = userData[key] && String(userData[key]).trim();
      if (val) {
        img.src = val;
        img.style.display = '';
      } else {
        img.style.display = 'none';
      }
    });

    // Inject all data-rf-slot elements
    // Format phone number for display before injecting
    if (userData.phoneNumber) {
      const digits = userData.phoneNumber.replace(/\D/g, '');
      if (digits.length === 10) {
        userData.phoneNumber = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
      } else if (digits.length === 11 && digits[0] === '1') {
        userData.phoneNumber = `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
      }
      // Non-US numbers injected as-is
    }
    injectSlots(slotData);

    // Social links — data-rf-repeat="socialLinks"
    // Build array from known social fields in userData
    const socialFields = [
      { key: 'facebookUrl',  iconClass: 'fab fa-facebook-f rf-social-icon' },
      { key: 'twitterUrl',   iconClass: 'fab fa-twitter rf-social-icon' },
      { key: 'linkedinUrl',  iconClass: 'fab fa-linkedin rf-social-icon' },
      { key: 'instagramUrl', iconClass: 'fab fa-instagram rf-social-icon' },
      { key: 'tikTokUrl',    iconClass: 'fab fa-tiktok rf-social-icon' },
      { key: 'youtubeUrl',   iconClass: 'fab fa-youtube rf-social-icon' },
      { key: 'whatsAppUrl',  iconClass: 'fab fa-whatsapp rf-social-icon' }
    ];

    const socialItems = socialFields
      .filter(f => userData[f.key] && userData[f.key].trim() !== '')
      .map(f => ({ url: userData[f.key], iconClass: f.iconClass }));

    if (socialItems.length) {
      injectRepeat('socialLinks', socialItems);
      showBlock('socialLinks');
    } else {
      hideBlock('socialLinks');
    }

    // Does this rep have ANY usable detail beyond a name — photo, contact info,
    // booking link, or at least one social link? Used below to decide whether to
    // fall back to "Unknown User" and whether to reveal the profile card at all.
    const hasName        = !!(userData.firstName || userData.lastName);
    const hasBookingLink = !!(userData.customBookingLink && userData.customBookingLink.trim());
    const hasOtherDetail = !!(userData.email || userData.phoneNumber || userData.profileImage ||
                              hasBookingLink || socialItems.length);

    // Name fallback — if no name was returned but the rep otherwise has usable
    // data (e.g. only social links are populated), show "Unknown User" instead
    // of leaving the name blank.
    if (!hasName && hasOtherDetail) {
      document.querySelectorAll('[data-rf-slot="rep.firstName"]')
        .forEach(el => { el.textContent = 'Unknown User'; });
      document.querySelectorAll('[data-rf-slot="rep.lastName"]')
        .forEach(el => { el.textContent = ''; });
    }

    // Booking link — Book Me stays in its own default-hidden state (set by
    // initBookMe()) unless a real link is provided here. A missing booking link
    // no longer hides the rest of the profile card — it serves no purpose to show
    // a Book Me button with nowhere to go, but the photo/name/contact info are
    // independently useful and should still appear.
    if (hasBookingLink) {
      // Normalize Calendly URLs — update the month parameter to the current month
      // so the booking calendar always opens on the current period, not a hardcoded one.
      let bookingLink = userData.customBookingLink.trim();
      if (bookingLink.includes('calendly.com')) {
        try {
          const url = new URL(bookingLink);
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          url.searchParams.set('month', currentMonth);
          bookingLink = url.toString();
        } catch (e) {
          // If URL parsing fails, use the original link unchanged
        }
      }
      window.rfShared.customBookingLink = bookingLink;
      document.dispatchEvent(new CustomEvent('rf:bookingLinkReady'));
    }

    // Show rep profile block if we have a name, or any other usable rep detail.
    if (hasName || hasOtherDetail) {
      showBlock('repProfile');
    }

    console.log(LOG, 'User details applied.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOK ME
  // ═══════════════════════════════════════════════════════════════════════════

  function initBookMe() {
    const btn = document.getElementById('customBookingLink') ||
                document.querySelector('[data-rf-slot="rep.customBookingLink"]');
    if (!btn) return;

    btn.style.display = 'none';

    function revealIfReady() {
      const link = window.rfShared.customBookingLink ||
                   (btn.getAttribute('href') !== '#' ? btn.getAttribute('href') : null);
      if (link && link.trim()) {
        btn.setAttribute('href', link);
        btn.style.display = '';
      }
    }

    document.addEventListener('rf:bookingLinkReady', revealIfReady, { once: true });
    revealIfReady();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLACEHOLDER REPLACEMENT
  // Replaces [user-id], [userId], [contactId] tokens in all <a href> values.
  // ═══════════════════════════════════════════════════════════════════════════

  function replacePlaceholders() {
    document.querySelectorAll('a[href]').forEach(a => {
      const original = a.getAttribute('href');
      if (!original) return;
      const updated = original
        .replace(/\[user-id\]/g,   _params.userId)
        .replace(/\[userId\]/g,    _params.userId)
        .replace(/\[contactId\]/g, _params.contactId);
      if (updated !== original) a.setAttribute('href', updated);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACT FORM
  // ═══════════════════════════════════════════════════════════════════════════

  function initContactForm() {
    // Support both old (#contactFormContainer + data-campaign) and
    // new (data-rf-form="contactForm" + data-rf-campaign-id) conventions.
    const container =
      document.querySelector('[data-rf-form="contactForm"]') ||
      document.querySelector('#contactFormContainer');

    if (!container) return;

    const form = container.querySelector('form') ||
                 container.closest('form') ||
                 document.querySelector('#contact-form');

    if (!form) {
      console.warn(LOG, 'Contact form element not found.');
      return;
    }

    // Read config — support both naming conventions
    const campaignId  = container.getAttribute('data-rf-campaign-id') ||
                        container.getAttribute('data-campaign') || '';
    const labelId     = container.getAttribute('data-rf-label-id') ||
                        container.getAttribute('data-label') || '';
    const redirectUrl = container.getAttribute('data-redirect') || '';

    // Field visibility
    const showLastName = container.getAttribute('data-last-name') !== 'false';
    const showCompany  = container.getAttribute('data-company')   === 'true';
    const showGdpr     = container.getAttribute('data-gdpr')      === 'true';
    const showTos      = container.getAttribute('data-tos')       === 'true';
    const intlPhone    = container.getAttribute('data-international') === 'true';
    const country      = container.getAttribute('data-country')   || 'us';

    function fieldGroup(id) {
      return document.getElementById(id)?.closest('.form-item, .form-group');
    }

    if (!showLastName) { const g = fieldGroup('contactLastName'); if (g) g.style.display = 'none'; }
    if (!showCompany)  { const g = fieldGroup('contactCompany');  if (g) g.style.display = 'none'; }
    if (!showGdpr)     { const g = fieldGroup('gdprConsent');     if (g) g.style.display = 'none'; }
    if (!showTos)      { const g = fieldGroup('tosConsent');      if (g) g.style.display = 'none'; }

    // Pre-fill form fields if contactId is in the URL
    if (_params.contactId) {
      get(`https://apiv2.rapidfunnel.com/v2/contact-details/${encodeURIComponent(_params.contactId)}`)
        .then(r => {
          const c = r?.data;
          if (!c) return;
          const fields = {
            contactFirstName: c.firstName   || '',
            contactLastName:  c.lastName    || '',
            contactEmail:     c.email       || '',
            phone:            c.phone       || c.phoneNumber || ''
          };
          Object.keys(fields).forEach(id => {
            const el = document.getElementById(id);
            if (el && fields[id]) el.value = fields[id];
          });
          console.log(LOG, 'Form pre-filled for contact:', _params.contactId);
        })
        .catch(() => console.warn(LOG, 'Contact pre-fill fetch failed — form left empty.'));
    }

    // intl-tel-input (loaded only if needed)
    let itiInstance = null;
    if (intlPhone && window.intlTelInput) {
      const phoneEl = document.getElementById('phone');
      if (phoneEl) {
        itiInstance = window.intlTelInput(phoneEl, {
          loadUtils: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js',
          initialCountry: country,
          separateDialCode: true,
          autoPlaceholder: 'polite'
        });
      }
    }

    // Validation helpers
    function showError(fieldId, msg) {
      const err = document.getElementById('err-' + fieldId);
      if (err) err.textContent = msg;
      const input = document.getElementById('contact' + fieldId[0].toUpperCase() + fieldId.slice(1));
      if (input) input.classList.toggle('error', !!msg);
    }

    function clearErrors() {
      ['firstName','lastName','email','phone','company','gdpr','tos']
        .forEach(f => showError(f, ''));
    }

    function validate() {
      clearErrors();
      let valid = true;

      const fn = document.getElementById('contactFirstName')?.value.trim() || '';
      if (!fn) { showError('firstName', 'First name is required.'); valid = false; }

      const em = document.getElementById('contactEmail')?.value.trim() || '';
      if (!em) {
        showError('email', 'Email is required.'); valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        showError('email', 'Enter a valid email address.'); valid = false;
      }

      if (showGdpr && !document.getElementById('gdprConsent')?.checked) {
        showError('gdpr', 'You must accept the privacy policy.'); valid = false;
      }
      if (showTos && !document.getElementById('tosConsent')?.checked) {
        showError('tos', 'You must accept the terms of service.'); valid = false;
      }

      // Build formatted phone into hidden field
      if (itiInstance) {
        const rawPhone = document.getElementById('phone')?.value.trim() || '';
        const dialCode = itiInstance.getSelectedCountryData()?.dialCode || '';
        const fullPhone = rawPhone && !rawPhone.startsWith('+') ? `+${dialCode}${rawPhone}` : rawPhone;
        const hidden = document.getElementById('contactPhone');
        if (hidden) hidden.value = fullPhone;
      }

      return valid;
    }

    function setSubmitting(flag) {
      const btn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (!btn) return;
      if (flag && !btn._originalText) btn._originalText = btn.textContent;
      btn.disabled = flag;
      btn.textContent = flag ? 'Submitting…' : (btn._originalText || 'Submit');
    }

    function resetForm() {
      form.reset();
      clearErrors();
      setSubmitting(false);
      isSubmitting = false;
    }

    function showFormMessage(msg, isError) {
      let el = form.querySelector('.rf-form-message');
      if (!el) {
        el = document.createElement('p');
        el.className = 'rf-form-message';
        el.style.cssText = 'text-align:center;margin-top:12px;font-size:15px;padding:10px;border-radius:4px;';
        form.appendChild(el);
      }
      el.textContent = msg;
      el.style.background = isError
        ? 'color-mix(in srgb, var(--rf-tertiary) 12%, transparent)'
        : 'color-mix(in srgb, var(--rf-secondary) 15%, transparent)';
      el.style.color      = isError ? 'var(--rf-tertiary-dark)' : 'var(--rf-secondary-dark)';
      el.style.display    = 'block';
      if (!isError) setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    function clearFormMessage() {
      const el = form.querySelector('.rf-form-message');
      if (el) el.style.display = 'none';
    }

    let isSubmitting = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmitting) return;
      if (!validate()) return;
      isSubmitting = true;
      setSubmitting(true);
      clearFormMessage();

      if (!_params.userId) {
        console.error(LOG, 'Form submission: userId missing from URL — senderId will be empty. Rep will not be notified and contact may not be attributed correctly.');
      }
      if (!_params.resourceId) {
        console.error(LOG, 'Form submission: resourceId missing from URL — form payload will have no resourceId.');
      }

      const phone = document.getElementById('contactPhone')?.value.trim() ||
                    document.getElementById('phone')?.value.trim() || '';

      const payload = {
        formData: new URLSearchParams({
          firstName: document.getElementById('contactFirstName')?.value.trim() || '',
          lastName:  document.getElementById('contactLastName')?.value.trim()  || '',
          email:     document.getElementById('contactEmail')?.value.trim()     || '',
          phone,
          campaign:   campaignId,
          contactTag: labelId
        }).toString(),
        resourceId: _params.resourceId,
        senderId:   _params.userId,
        sentFrom:   'customPage'
      };

      // Timeout — if the API hasn't responded in 15 seconds, unblock the form
      // and warn the user, but keep listening for the response.
      // If success arrives late, we still process it correctly — never ignore it.
      let timedOut = false;
      const timeout = setTimeout(() => {
        if (!isSubmitting) return;
        timedOut = true;
        isSubmitting = false;
        setSubmitting(false);
        showFormMessage('The server is taking too long to respond. Please check your connection and try again.', true);
      }, 15000);

      post('https://my.rapidfunnel.com/landing/resource/create-custom-contact', payload)
        .then(response => {
          clearTimeout(timeout);
          isSubmitting = false;
          if (response.status === true) {
            if (redirectUrl && redirectUrl.trim() !== '') {
              const isAbsolute = /^https?:\/\//.test(redirectUrl);
              const sep = isAbsolute && redirectUrl.includes('?') ? '&' : '?';
              const dest = isAbsolute
                ? `${redirectUrl}${sep}userId=${_params.userId}&resourceId=${_params.resourceId}&contactId=${response.contactId}`
                : (() => {
                    try {
                      const u = new URL(redirectUrl, window.location.href);
                      u.searchParams.set('userId', _params.userId);
                      u.searchParams.set('resourceId', _params.resourceId);
                      u.searchParams.set('contactId', response.contactId);
                      return u.toString();
                    } catch(e) { return redirectUrl; }
                  })();
              window.location.href = dest;
            } else {
              resetForm();
              // If the user saw a timeout message, clarify that it did go through
              showFormMessage(timedOut
                ? 'Your submission was received — sorry for the delay!'
                : 'Thank you! We\'ll be in touch shortly.', false);
            }
          } else {
            if (!timedOut) setSubmitting(false);
            const errMsg = response.errorMessage || response.message || response.error || null;
            showFormMessage(errMsg
              ? `Submission failed: ${errMsg}`
              : 'There was a problem submitting. Please try again.', true);
            console.warn(LOG, 'Form submission failed — API response:', response);
          }
        })
        .catch(() => {
          clearTimeout(timeout);
          isSubmitting = false;
          if (!timedOut) resetForm();
          showFormMessage('Something went wrong. Please check your connection and try again.', true);
        });
    });

    console.log(LOG, 'Contact form initialized.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CTA BUTTONS
  // ═══════════════════════════════════════════════════════════════════════════

  function initCtaButtons() {
    const buttons = document.querySelectorAll('[data-button-type]');
    if (!buttons.length) return;

    // Appends userId, resourceId, and contactId to a destination URL before redirecting.
    // This ensures sequence continuity — every page in a multi-page flow receives
    // the same params the current page received, plus any contactId acquired via form.
    function buildSequenceUrl(url) {
      if (!url || url === '#') return url;
      try {
        const dest = new URL(url, window.location.href);
        if (_params.userId)    dest.searchParams.set('userId',    _params.userId);
        if (_params.resourceId) dest.searchParams.set('resourceId', _params.resourceId);
        if (_params.contactId) dest.searchParams.set('contactId', _params.contactId);
        return dest.toString();
      } catch (e) {
        return url;
      }
    }

    function redirect(url, target) {
      if (!url || url === '#') return;
      const dest = buildSequenceUrl(url);
      target === '_blank'
        ? window.open(dest, '_blank', 'noopener,noreferrer')
        : (window.location.href = dest);
    }

    function fetchContact(contactId) {
      return get(`https://apiv2.rapidfunnel.com/v2/contact-details/${encodeURIComponent(contactId)}`)
        .then(r => (r && r.data) ? r.data : {})
        .catch(() => ({}));
    }

    function sendCtaEmail(contactData, location, redirectUrl, target) {
      if (!_params.userId) console.error(LOG, 'CTA email: userId missing from URL — legacyUserId will be 0. Rep will not receive notification.');
      return postJSON('https://app.rapidfunnel.com/api/mail/send-cta-email', {
        legacyUserId:       Number(_params.userId) || 0,
        contactFirstName:   contactData.firstName   || '',
        contactLastName:    contactData.lastName     || '',
        contactPhoneNumber: contactData.phone        || '',
        contactEmail:       contactData.email        || '',
        ctaLocation:        location,
        ctaPageName:        getPageName(),
        contactId:          _params.contactId        || ''
      }).finally(() => redirect(redirectUrl, target));
    }

    function sendConversionEmail(contactData, location, redirectUrl, target) {
      if (!_params.userId) console.error(LOG, 'Conversion email: userId missing from URL — legacyUserId will be 0. Rep will not receive notification.');
      return postJSON('https://app.rapidfunnel.com/api/mail/send-cta-conversion-email', {
        legacyUserId:       Number(_params.userId) || 0,
        contactFirstName:   contactData.firstName   || '',
        contactLastName:    contactData.lastName     || '',
        contactPhoneNumber: contactData.phone        || '',
        contactEmail:       contactData.email        || '',
        ctaLocation:        location,
        ctaPageName:        getPageName(),
        contactId:          _params.contactId        || ''
      }).finally(() => redirect(redirectUrl, target));
    }

    // Resolve resource button hrefs on page load
    buttons.forEach(btn => {
      if (btn.getAttribute('data-button-type') !== 'resource') return;
      const resourceId = btn.getAttribute('data-resource-id');
      if (!resourceId) { btn.setAttribute('href', '#'); return; }

      get('https://app.rapidfunnel.com/api/api/resources/resource-details/', {
        userId: _params.userId, resourceId, contactId: _params.contactId
      }).then(r => {
        if (r?.data?.resourceUrl) {
          let url = r.data.resourceUrl.replace(/\/$/, '');
          url += '/' + _params.userId;
          if (_params.contactId) url += '/' + _params.contactId;
          btn.setAttribute('href', url);
        } else {
          btn.setAttribute('href', '#');
          btn.classList.add('disabled');
        }
      }).catch(() => { btn.setAttribute('href', '#'); btn.classList.add('disabled'); });
    });

    let isProcessing = false;

    buttons.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isProcessing || btn.classList.contains('disabled')) return;
        isProcessing = true;

        const type     = btn.getAttribute('data-button-type') || 'cta';
        const location = btn.getAttribute('data-location') || btn.id || '';
        const url      = btn.getAttribute('href') || '';
        const target   = btn.getAttribute('target') || '_self';

        const done = () => setTimeout(() => { isProcessing = false; }, 3000);

        if (type === 'conversion') {
          const fallback = { firstName: _params.contactId ? 'System failed to answer' : 'No contact ID found', lastName: '', phone: 'N/A', email: 'N/A' };
          (_params.contactId ? fetchContact(_params.contactId) : Promise.resolve(fallback))
            .then(c => sendConversionEmail(c && c.firstName ? c : fallback, location, url, target))
            .finally(done);
        } else {
          // cta and resource both send email only if contactId exists
          if (!_params.contactId) { redirect(url, target); done(); return; }
          fetchContact(_params.contactId)
            .then(c => sendCtaEmail(c, location, url, target))
            .catch(() => redirect(url, target))
            .finally(done);
        }
      });
    });

    console.log(LOG, `CTA buttons initialized: ${buttons.length} found.`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESOURCE DETAILS
  // Fetches GET /api/api/resources/resource-details/ using the page-level
  // resourceId from the URL. If the resource is a video (accountResourceTypeId 9),
  // passes the mediaHash to initWistia(). Resource button URL resolution is
  // handled separately inside initCtaButtons() using per-button resourceIds.
  // ═══════════════════════════════════════════════════════════════════════════

  function initResource() {
    // If a video block exists on this page but we cannot load the video for any
    // reason, we must still show the block with the "unavailable" fallback message.
    // showVideoUnavailable() handles that consistently from every failure path.
    function showVideoUnavailable(reason) {
      const videoBlock = document.querySelector('[data-rf-block="wistiaVideo"]');
      if (!videoBlock) return; // no video block on this page — nothing to do
      const wrapper = videoBlock.querySelector('.video-wrapper');
      if (!wrapper) { showBlock('wistiaVideo'); return; }
      wrapper.innerHTML = '';
      wrapper.style.position = 'relative';
      const fallbackEl = document.createElement('div');
      fallbackEl.className = 'rf-video-unavailable';
      fallbackEl.style.cssText = [
        'width:100%',
        'min-height:200px',
        'background:var(--rf-surface)',
        'color:var(--rf-text-muted)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'flex-direction:column',
        'gap:10px',
        'border-radius:var(--rf-radius)',
        'text-align:center',
        'padding:24px',
        'box-sizing:border-box'
      ].join(';');
      fallbackEl.innerHTML = `
        <span style="font-size:32px;opacity:0.4;">&#9654;</span>
        <p style="margin:0;font-size:16px;">Video unavailable — please try again later.</p>`;
      wrapper.appendChild(fallbackEl);
      showBlock('wistiaVideo');
      console.warn(LOG, 'Video unavailable:', reason);
    }

    if (!_params.resourceId) {
      console.warn(LOG, 'No resourceId in URL — resource details skipped.');
      showVideoUnavailable('no resourceId in URL');
      return;
    }

    get('https://app.rapidfunnel.com/api/api/resources/resource-details/', {
      userId:    _params.userId,
      resourceId: _params.resourceId,
      contactId: _params.contactId
    }).then(r => {
      const data = r?.data;
      if (!data) {
        console.warn(LOG, 'Resource details: empty response.');
        showVideoUnavailable('resource details API returned no data');
        return;
      }

      // If this is a video resource and a video block exists on the page, inject it
      if (data.accountResourceTypeId === 9) {
        const wistiaId = (data.mediaHash || data.mediahash || '').trim();
        if (wistiaId) {
          console.log(LOG, 'Resource is a video — wistiaId:', wistiaId);
          initWistia(wistiaId);
        } else {
          console.warn(LOG, 'Resource is type 9 (video) but mediaHash is empty.');
          showVideoUnavailable('resource is type 9 but mediaHash is empty');
        }
      } else {
        console.log(LOG, 'Resource type', data.accountResourceTypeId, '— no video to inject.');
        // Not a video resource — if a video block exists, show unavailable message
        showVideoUnavailable('resource is not a video type');
      }
    }).catch(e => {
      console.error(LOG, 'Resource details fetch failed:', e);
      showVideoUnavailable('resource details fetch failed');
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Receives the Wistia video ID from initResource() via the resource details API.
  // If no video block is present on the page, returns silently.
  // Tracking fires only when both userId and contactId are in the URL.
  // ═══════════════════════════════════════════════════════════════════════════

  function initWistia(wistiaId) {
    if (!wistiaId) return;

    const wrapper = document.querySelector('[data-rf-block="wistiaVideo"] .video-wrapper');
    if (!wrapper) {
      console.log(LOG, 'Wistia ID available but no video block found on page — skipping.');
      return;
    }

    // Inject Wistia scripts into <head>
    injectScript(`https://fast.wistia.com/embed/medias/${wistiaId}.jsonp`, true);
    injectScript('https://fast.wistia.com/assets/external/E-v1.js', true);
      // Ensure wrapper is relatively positioned so the fallback overlay works correctly
      wrapper.style.position = 'relative';
      wrapper.style.background = 'transparent';

      // Wistia embed — let Wistia control its own dimensions.
      // The padding-bottom aspect ratio trick conflicts with Wistia's inline-block
      // rendering, leaving a black gap. Instead give Wistia a clean 100% width
      // container and let it set the height naturally.
      wrapper.innerHTML = `
        <div class="wistia_embed wistia_async_${wistiaId} seo=true"
             style="width:100%;height:100%;">
        </div>`;

      // Build fallback as a separate element appended after the embed — never inside it
      const fallbackEl = document.createElement('div');
      fallbackEl.className = 'rf-video-unavailable';
      fallbackEl.style.cssText = `
        width:100%;
        min-height:200px;
        background:var(--rf-surface);
        color:var(--rf-text-muted);
        display:flex;
        align-items:center;
        justify-content:center;
        flex-direction:column;
        gap:10px;
        border-radius:var(--rf-radius);
        text-align:center;
        padding:24px;
        box-sizing:border-box;`;
      fallbackEl.innerHTML = `
        <span style="font-size:32px;opacity:0.4;">▶</span>
        <p style="margin:0;font-size:16px;">Video unavailable — please try again later.</p>`;
      wrapper.appendChild(fallbackEl);

      // The fallback message is visible by default.
      // Hide it only when Wistia confirms the video has successfully loaded
      // by firing its readystatechange to 'ready' or injecting a <video> element.
      // Use _wq to catch the ready state, with a MutationObserver as backup.
      let fallbackHidden = false;
      let observer;

      function hideFallback() {
        if (fallbackHidden) return;
        fallbackHidden = true;
        if (observer) observer.disconnect();
        // Verify the <video> element actually has media data before hiding the fallback.
        // Wistia fires onReady when the player initializes, not when media is playable —
        // so we check readyState directly. readyState >= 2 means media is actually loaded.
        const videoEl = wrapper.querySelector('video');
        if (videoEl && videoEl.readyState < 2) {
          // Media not yet loaded — poll until it is or give up after 10 seconds
          let attempts = 0;
          const check = setInterval(() => {
            attempts++;
            const v = wrapper.querySelector('video');
            if (v && v.readyState >= 2) {
              clearInterval(check);
              if (fallbackEl) fallbackEl.style.display = 'none';
              wrapper.style.background = '';
              console.log(LOG, 'Wistia video media confirmed loaded — fallback hidden.');
            } else if (attempts >= 20) {
              clearInterval(check);
              console.warn(LOG, 'Wistia reported ready but media did not load — keeping fallback.');
            }
          }, 500);
          return;
        }
        if (fallbackEl) fallbackEl.style.display = 'none';
        wrapper.style.background = '';
        console.log(LOG, 'Wistia video ready — fallback hidden.');
      }

      // Primary: _wq readystatechange to 'ready' is the most reliable Wistia signal
      window._wq = window._wq || [];
      window._wq.push({
        id: wistiaId,
        onReady: function (video) {
          hideFallback();
        }
      });

      // Backup: MutationObserver watches for Wistia injecting a <video> element
      observer = new MutationObserver(() => {
        if (wrapper.querySelector('video')) {
          observer.disconnect();
          hideFallback();
        }
      });
      observer.observe(wrapper, { childList: true, subtree: true });

      // Safety valve: disconnect observer after 30 seconds regardless
      setTimeout(() => observer.disconnect(), 30000);

    // Show the video block
    showBlock('wistiaVideo');

    // Wire tracking if we have the required URL params
    if (!_params.userId || !_params.contactId) {
      console.warn(LOG, 'Video tracking skipped — missing userId or contactId.');
      return;
    }

    window._wq = window._wq || [];
    _wq.push({
      _all: function (video) {
        const container  = video.container;
        // data-resource-id on the embed element is an optional per-video override.
        // Falls back to the page-level resourceId from the URL query parameter.
        const resourceId = (container?.getAttribute('data-resource-id') || '').trim()
                           || _params.resourceId;

        if (!resourceId) {
          console.warn(LOG, 'Video tracking: no resourceId available.');
          return;
        }

        let sentFinal = false;

        function pct() {
          const d = video.duration();
          return d > 0 ? Math.floor((video.time() / d) * 100) / 100 : 0;
        }

        function track(percentageWatched) {
          if (percentageWatched > 100) return;
          if (!_params.userId) console.error(LOG, 'Video tracking: userId missing from URL — tracking POST will have no userId.');
          post('https://my.rapidfunnel.com/landing/resource/push-to-sqs', {
            resourceId,
            contactId:        _params.contactId,
            userId:           _params.userId,
            percentageWatched,
            mediaHash:        video.hashedId(),
            duration:         video.duration(),
            visitorKey:       video.visitorKey(),
            eventKey:         video.eventKey(),
            delayProcess:     1,
            webinar:          ''
          }).catch(() => console.warn(LOG, 'Video tracking POST failed.'));
        }

        video.bind('pause',      () => { if (!sentFinal) track(pct()); });
        video.bind('timechange', t  => {
          const d = video.duration();
          if (!sentFinal && d > 0 && (t / d) >= 0.95) {
            sentFinal = true;
            track(Math.floor((t / d) * 100) / 100);
          }
        });
        video.bind('end', () => { if (!sentFinal) { sentFinal = true; track(100); } });

        console.log(LOG, 'Video tracking bound — wistiaId:', wistiaId, '| resourceId:', resourceId);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN INIT — runs after DOM is ready
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    console.log(LOG, 'Initializing — userId:', _params.userId, '| contactId:', _params.contactId, '| resourceId:', _params.resourceId);

    // 1. Replace URL token placeholders in all links immediately
    replacePlaceholders();

    // 2. Book Me button — hide immediately, reveal after user details load
    initBookMe();

    // 3. CTA buttons
    initCtaButtons();

    // 4. Contact form
    initContactForm();

    if (!_params.userId) {
      console.warn(LOG, 'No userId in URL — API calls skipped.');
      return;
    }

    // 5. Resource details — fetches video ID (and resourceUrl for resource buttons)
    //    initResource() calls initWistia() internally if resource is type 9 (video)
    initResource();

    // 6. Analytics (GA4, FB Pixel, GTM) — fire and forget
    get(`https://apiv2.rapidfunnel.com/v2/analytics/${encodeURIComponent(_params.userId)}`)
      .then(r => {
        if (r?.data) {
          processAnalyticsPayload(r.data.userData);
          processAnalyticsPayload(r.data.accountData);
        }
      })
      .catch(e => console.error(LOG, 'Analytics fetch failed:', e));

    // 7. User details (rep profile, social links, booking link)
    get(`https://apiv2.rapidfunnel.com/v2/users-details/${encodeURIComponent(_params.userId)}`)
      .then(r => {
        if (r?.data?.[0]) applyUserDetails(r.data[0]);
        else console.warn(LOG, 'User details: empty response.');
      })
      .catch(e => console.error(LOG, 'User details fetch failed:', e));

    // 8. Branding (colors, logo, favicon, RF logo visibility)
    get(`https://app.rapidfunnel.com/api/branding/user/${encodeURIComponent(_params.userId)}`)
      .then(r => { if (r?.data) injectBranding(r.data); })
      .catch(e => console.warn(LOG, 'Branding fetch failed:', e));
  }

  // Kick off after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
