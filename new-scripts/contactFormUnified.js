(function() {
  'use strict';

  const LOG = '[ContactForm]';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const CONFIG = {
    formSelector: '#contact-form',
    containerSelector: '#contactFormContainer',
    apiEndpoint: 'https://my.rapidfunnel.com/landing/resource/create-custom-contact',
    requiredFields: ['firstName', 'email']
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  let isSubmitting = false;
  let itiInstance = null;
  let formFeatures = {};
  let formMode = 'single';

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE DETECTION & CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  function getContainerConfig() {
    const container = document.querySelector(CONFIG.containerSelector);
    if (!container) return null;

    return {
      showLastName: container.getAttribute('data-last-name') === 'true',
      showGdpr: container.getAttribute('data-gdpr') === 'true',
      showTos: container.getAttribute('data-tos') === 'true',
      showCompany: container.getAttribute('data-company') === 'true',
      enableIntlPhone: container.getAttribute('data-international') === 'true',
      defaultCountry: container.getAttribute('data-country') || 'us'
    };
  }

  function applyFormConfiguration(config) {
    // Show/hide last name field
    const lastNameGroup = document.getElementById('contactLastName')?.closest('.form-group');
    if (lastNameGroup) {
      lastNameGroup.style.display = config.showLastName ? '' : 'none';
    }

    // Show/hide company field
    const companyGroup = document.getElementById('contactCompany')?.closest('.form-group');
    if (companyGroup) {
      companyGroup.style.display = config.showCompany ? '' : 'none';
    }

    // Show/hide GDPR checkbox
    const gdprGroup = document.getElementById('gdprConsent')?.closest('.form-group');
    if (gdprGroup) {
      gdprGroup.style.display = config.showGdpr ? '' : 'none';
    }

    // Show/hide TOS checkbox
    const tosGroup = document.getElementById('tosConsent')?.closest('.form-group');
    if (tosGroup) {
      tosGroup.style.display = config.showTos ? '' : 'none';
    }

    console.log(LOG, 'Form configured:', config);
  }

  function detectFormFeatures(config) {
    const phoneEl = document.getElementById('phone');
    const features = {
      hasGdpr: config.showGdpr && !!document.getElementById('gdprConsent'),
      hasTos: config.showTos && !!document.getElementById('tosConsent'),
      hasPhone: !!phoneEl,
      hasIntlTelInput: !!(window.intlTelInput && phoneEl && config.enableIntlPhone),
      hasPart1: !!document.getElementById('part1Form'),
      hasPart2: !!document.getElementById('part2Form'),
      hasCompany: config.showCompany && !!document.getElementById('contactCompany'),
      hasLastName: config.showLastName && !!document.getElementById('contactLastName')
    };

    // Determine form mode
    if (features.hasPart1 && features.hasPart2) {
      formMode = 'two-part';
    } else {
      formMode = 'single';
    }

    return features;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTL-TEL-INPUT INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function initIntlTelInput(config) {
    if (!formFeatures.hasIntlTelInput) return null;

    const phoneEl = document.getElementById('phone');

    try {
      itiInstance = window.intlTelInput(phoneEl, {
        loadUtils: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js',
        initialCountry: config.defaultCountry,
        separateDialCode: true,
        autoPlaceholder: 'polite'
      });

      phoneEl._itiInstance = itiInstance;
      return itiInstance;
    } catch (e) {
      console.error(LOG, 'Failed to initialize intl-tel-input:', e);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function showError(fieldId, msg) {
    const errEl = document.getElementById('err-' + fieldId);
    const inputEl = document.getElementById('contact' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1));

    if (errEl) errEl.textContent = msg;
    if (inputEl) inputEl.classList.toggle('error', !!msg);
  }

  function clearErrors() {
    const errorFields = ['firstName', 'lastName', 'email', 'phone', 'company', 'gdpr', 'tos'];
    errorFields.forEach(f => showError(f, ''));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidUrl(url) {
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?$/.test(url);
  }

  function hasUrlParameters(url) {
    return url.includes('?');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  function validateForm() {
    clearErrors();
    let valid = true;

    // Required: First name
    const firstName = document.getElementById('contactFirstName')?.value.trim() || '';
    if (!firstName) {
      showError('firstName', 'First name is required.');
      valid = false;
    }

    // Required: Email
    const email = document.getElementById('contactEmail')?.value.trim() || '';
    if (!email) {
      showError('email', 'Email is required.');
      valid = false;
    } else if (!validateEmail(email)) {
      showError('email', 'Enter a valid email address.');
      valid = false;
    }

    // Optional: Phone with intl-tel-input formatting
    if (formFeatures.hasPhone) {
      const phoneEl = document.getElementById('phone');
      const rawPhone = phoneEl?.value.trim() || '';

      if (formFeatures.hasIntlTelInput && itiInstance) {
        let fullPhone = rawPhone;
        try {
          const dialCode = itiInstance.getSelectedCountryData().dialCode;
          if (dialCode && rawPhone && !rawPhone.startsWith('+')) {
            fullPhone = '+' + dialCode + rawPhone;
          }
        } catch (e) {
          console.warn(LOG, 'Could not get dial code, using raw phone');
        }

        const hiddenPhone = document.getElementById('contactPhone');
        if (hiddenPhone) {
          hiddenPhone.value = fullPhone;
        }
      }
    }

    // GDPR checkbox validation (if visible)
    if (formFeatures.hasGdpr) {
      const gdprChecked = document.getElementById('gdprConsent')?.checked;
      if (!gdprChecked) {
        showError('gdpr', 'You must accept the privacy policy.');
        valid = false;
      }
    }

    // TOS checkbox validation (if visible)
    if (formFeatures.hasTos) {
      const tosChecked = document.getElementById('tosConsent')?.checked;
      if (!tosChecked) {
        showError('tos', 'You must accept the terms of service.');
        valid = false;
      }
    }

    return valid;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA COLLECTION
  // ═══════════════════════════════════════════════════════════════════════════

  function getFormData() {
    const data = {
      firstName: document.getElementById('contactFirstName')?.value.trim() || '',
      lastName: document.getElementById('contactLastName')?.value.trim() || '',
      email: document.getElementById('contactEmail')?.value.trim() || '',
      phone: '',
      company: document.getElementById('contactCompany')?.value.trim() || ''
    };

    // Get phone (prefer formatted version from hidden field)
    if (formFeatures.hasPhone) {
      data.phone = document.getElementById('contactPhone')?.value.trim() ||
                   document.getElementById('phone')?.value.trim() || '';
    }

    return data;
  }

  function getConfiguration() {
    const container = document.querySelector(CONFIG.containerSelector);

    if (!container) {
      console.error(LOG, 'Container not found:', CONFIG.containerSelector);
      return null;
    }

    let campaignId = container.getAttribute('data-campaign') || container.dataset.campaign || '';
    let labelId = container.getAttribute('data-label') || container.dataset.label || '';
    let redirectUrl = container.getAttribute('data-redirect') || container.dataset.redirect || '';

    // Validate campaign ID
    if (!campaignId || campaignId === 'undefined' || campaignId === 'null' || campaignId === 'YOUR_CAMPAIGN_ID') {
      console.error(LOG, 'Invalid campaign ID:', campaignId);
      alert('Form configuration error: Campaign ID is missing or invalid.');
      return null;
    }

    // Clean up label ID
    if (!labelId || labelId === 'undefined' || labelId === 'null' || labelId === 'YOUR_LABEL_ID') {
      labelId = '';
    }

    // Clean up redirect URL
    if (!redirectUrl || redirectUrl === 'undefined' || redirectUrl === 'YOUR_REDIRECT_URL' || !isValidUrl(redirectUrl)) {
      redirectUrl = '';
    }

    return { campaignId, labelId, redirectUrl };
  }

  function getUrlParams() {
    try {
      const url = new URL(window.location.href);
      return {
        userId: url.searchParams.get('userId') || '',
        resourceId: url.searchParams.get('resourceId') || ''
      };
    } catch (e) {
      console.error(LOG, 'Could not parse URL:', e);
      return { userId: '', resourceId: '' };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBMIT BUTTON MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  function setSubmitButtonState(submitting, buttonText) {
    const submitButton = document.querySelector(
      CONFIG.formSelector + ' button[type="submit"], ' +
      CONFIG.formSelector + ' input[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = submitting;
      if (buttonText) {
        submitButton.textContent = buttonText;
      } else {
        submitButton.textContent = submitting ? 'Submitting...' : 'Submit';
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════════

  function createContact() {
    if (isSubmitting) return;
    isSubmitting = true;

    const config = getConfiguration();
    if (!config) {
      isSubmitting = false;
      return;
    }

    const urlParams = getUrlParams();
    const formData = getFormData();

    setSubmitButtonState(true);

    // Build form data string
    const postData = [
      'firstName=' + encodeURIComponent(formData.firstName),
      'lastName=' + encodeURIComponent(formData.lastName),
      'email=' + encodeURIComponent(formData.email),
      'phone=' + encodeURIComponent(formData.phone),
      'campaign=' + encodeURIComponent(config.campaignId),
      'contactTag=' + encodeURIComponent(config.labelId)
    ];

    if (formData.company) {
      postData.push('company=' + encodeURIComponent(formData.company));
    }

    const submissionData = {
      formData: postData.join('&'),
      resourceId: urlParams.resourceId,
      senderId: urlParams.userId,
      sentFrom: 'customPage'
    };

    // Use jQuery if available, otherwise fetch
    if (window.jQuery && typeof jQuery.ajax === 'function') {
      submitViaJQuery(submissionData, config, urlParams);
    } else {
      submitViaFetch(submissionData, config, urlParams);
    }
  }

  function submitViaJQuery(submissionData, config, urlParams) {
    jQuery.ajax({
      url: CONFIG.apiEndpoint,
      method: 'POST',
      dataType: 'json',
      data: submissionData,
      timeout: 10000,
      success: function(response) {
        handleSuccess(response, config, urlParams);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        handleError(textStatus, errorThrown, jqXHR.responseText || '');
      }
    });
  }

  function submitViaFetch(submissionData, config, urlParams) {
    const formBody = new URLSearchParams(submissionData);

    fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString()
    })
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(response => handleSuccess(response, config, urlParams))
      .catch(error => handleError('fetch', error.message, ''));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  function handleSuccess(response, config, urlParams) {
    isSubmitting = false;

    if (response.contactId > 0) {
      // Redirect if URL is configured
      if (config.redirectUrl) {
        const sep = hasUrlParameters(config.redirectUrl) ? '&' : '?';
        const fullUrl = config.redirectUrl + sep +
          'userId=' + urlParams.userId +
          '&resourceId=' + urlParams.resourceId +
          '&contactId=' + response.contactId;

        window.location.href = fullUrl;
      } else {
        alert('Form submitted successfully!');
        resetForm();
        setSubmitButtonState(false);
      }
    } else {
      console.error(LOG, 'Contact not created — invalid response:', response);
      alert('Error: Contact was not created. Please try again.');
      setSubmitButtonState(false);
    }
  }

  function handleError(status, error, responseText) {
    isSubmitting = false;
    console.error(LOG, 'API request failed:', status, error, responseText);
    alert('Error submitting the form. Please try again.');
    setSubmitButtonState(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM RESET
  // ═══════════════════════════════════════════════════════════════════════════

  function resetForm() {
    const fields = ['contactFirstName', 'contactLastName', 'contactEmail', 'phone', 'contactPhone', 'contactCompany'];

    fields.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) el.value = '';
    });

    if (formFeatures.hasGdpr) {
      const gdpr = document.getElementById('gdprConsent');
      if (gdpr) gdpr.checked = false;
    }

    if (formFeatures.hasTos) {
      const tos = document.getElementById('tosConsent');
      if (tos) tos.checked = false;
    }

    clearErrors();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TWO-PART FORM HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  function showPart2() {
    const part1 = document.getElementById('part1Form');
    const part2 = document.getElementById('part2Form');

    if (part1) part1.style.display = 'none';
    if (part2) part2.style.display = 'block';

    window.validationComplete = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    const form = document.querySelector(CONFIG.formSelector);

    if (!form) {
      console.warn(LOG, 'Form not found:', CONFIG.formSelector);
      return;
    }

    // Apply font inheritance
    form.style.fontFamily = 'inherit';

    // Get container configuration
    const config = getContainerConfig();
    if (!config) {
      console.error(LOG, 'Could not read container configuration');
      return;
    }

    // Apply configuration (show/hide fields)
    applyFormConfiguration(config);

    // Detect form features based on configuration
    formFeatures = detectFormFeatures(config);

    // Initialize intl-tel-input if enabled
    if (formFeatures.hasIntlTelInput) {
      initIntlTelInput(config);
    }

    // Handle Part 1 form submission (validation)
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      if (formMode === 'two-part') {
        showPart2();
      } else {
        createContact();
      }
    });

    // Handle Part 2 submission (if two-part form)
    if (formMode === 'two-part' && formFeatures.hasPart2) {
      const part2Form = document.getElementById('part2Form');
      const part2Button = part2Form?.querySelector('button[type="submit"], input[type="submit"]');

      if (part2Button) {
        part2Button.addEventListener('click', function(e) {
          e.preventDefault();
          createContact();
        });
      }
    }

    console.log(LOG, 'Initialized successfully');
  }

  // Safe initialization
  function safeInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  safeInit();

})();
