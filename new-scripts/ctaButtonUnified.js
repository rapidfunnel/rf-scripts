(function() {
  // Safety check for jQuery
  if (typeof jQuery === 'undefined') {
    console.error('[CtaButtonUnified] jQuery is not loaded');
    return;
  }

  jQuery(function ($) {
    'use strict';

    console.log('[CtaButtonUnified] Script executing...');
    var LOG = '[CtaButtonUnified]';

  // Constants
  var BUTTON_TYPES = {
    CTA: 'cta',
    CONVERSION: 'conversion',
    RESOURCE: 'resource'
  };

  // ============================================================================
  // URL Parameters
  // ============================================================================
  function getUrlParams() {
    try {
      var parsed = new URL(window.location.href);
      return {
        userId:    parsed.searchParams.get('userId')    || '',
        contactId: parsed.searchParams.get('contactId') || ''
      };
    } catch (e) {
      console.error(LOG, 'Could not parse URL:', e);
      return { userId: '', contactId: '' };
    }
  }

  // ============================================================================
  // Redirect
  // ============================================================================
  function redirect(url, target) {
    if (!url || url === '#') return;
    if (target === '_blank') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  }

  // ============================================================================
  // Page Name
  // ============================================================================
  function getPageName() {
    return $('meta[name="page-name"]').attr('content') ||
           $('meta[property="og:title"]').attr('content') ||
           document.title ||
           'Unknown Page';
  }

  // ============================================================================
  // Email Sending (for CTA and Resource types)
  // ============================================================================
  function sendCtaEmail(params, contactData, buttonLocation, redirectUrl, target) {
    $.ajax({
      url: 'https://app.rapidfunnel.com/api/mail/send-cta-email',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      timeout: 8000,
      data: JSON.stringify({
        legacyUserId:        Number(params.userId) || 0,
        contactFirstName:    contactData.firstName    || '',
        contactLastName:     contactData.lastName     || '',
        contactPhoneNumber:  contactData.phone        || '',
        contactEmail:        contactData.email        || '',
        ctaLocation:         buttonLocation,
        ctaPageName:         getPageName(),
        contactId:           params.contactId         || ''
      }),
      complete: function () {
        redirect(redirectUrl, target);
      }
    });
  }

  // ============================================================================
  // Email Sending (for Conversion type)
  // ============================================================================
  function sendConversionEmail(params, contactData, buttonLocation, redirectUrl, target) {
    $.ajax({
      url: 'https://app.rapidfunnel.com/api/mail/send-cta-conversion-email',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      timeout: 8000,
      data: JSON.stringify({
        legacyUserId:       Number(params.userId) || 0,
        contactFirstName:   contactData.firstName   || '',
        contactLastName:    contactData.lastName    || '',
        contactPhoneNumber: contactData.phone       || '',
        contactEmail:       contactData.email       || '',
        ctaLocation:        buttonLocation,
        ctaPageName:        getPageName(),
        contactId:          params.contactId        || ''
      }),
      complete: function () {
        redirect(redirectUrl, target);
      }
    });
  }

  // ============================================================================
  // Shared Contact Fetching
  // ============================================================================
  function fetchContactData(contactId, onSuccess, onError) {
    $.ajax({
      url: 'https://apiv2.rapidfunnel.com/v2/contact-details/' + encodeURIComponent(contactId),
      type: 'GET',
      dataType: 'json',
      timeout: 5000,
      success: function (response) {
        var contactData = (response && response.data) ? response.data : {};
        onSuccess(contactData);
      },
      error: onError
    });
  }

  // ============================================================================
  // Button Handlers by Type
  // ============================================================================

  // CTA Button: Send email only if contactId exists
  function handleCtaButton($btn, params, buttonLocation, redirectUrl, target) {
    if (!params.contactId) {
      redirect(redirectUrl, target);
      return;
    }

    fetchContactData(
      params.contactId,
      function (contactData) {
        sendCtaEmail(params, contactData, buttonLocation, redirectUrl, target);
      },
      function () {
        console.error(LOG, 'Failed to fetch contact details — redirecting anyway.');
        redirect(redirectUrl, target);
      }
    );
  }

  // Conversion Button: Always send email (with fallback data if needed)
  function handleConversionButton($btn, params, buttonLocation, redirectUrl, target) {
    var fallbackNoContact = { firstName: 'No contact ID found', lastName: '', phone: 'N/A', email: 'N/A' };
    var fallbackApiError = { firstName: 'System failed to answer', lastName: '', phone: 'N/A', email: 'N/A' };

    if (!params.contactId) {
      sendConversionEmail(params, fallbackNoContact, buttonLocation, redirectUrl, target);
      return;
    }

    fetchContactData(
      params.contactId,
      function (contactData) {
        var data = (contactData && contactData.firstName) ? contactData : fallbackApiError;
        sendConversionEmail(params, data, buttonLocation, redirectUrl, target);
      },
      function () {
        console.error(LOG, 'Failed to fetch contact details — sending fallback email.');
        sendConversionEmail(params, fallbackApiError, buttonLocation, redirectUrl, target);
      }
    );
  }

  // Resource Button: Send email only if contactId exists (same as CTA)
  function handleResourceButton($btn, params, buttonLocation, redirectUrl, target) {
    if (!params.contactId) {
      redirect(redirectUrl, target);
      return;
    }

    fetchContactData(
      params.contactId,
      function (contactData) {
        sendCtaEmail(params, contactData, buttonLocation, redirectUrl, target);
      },
      function () {
        console.error(LOG, 'Failed to fetch contact details — redirecting anyway.');
        redirect(redirectUrl, target);
      }
    );
  }

  // ============================================================================
  // Resource URL Resolution (for resource type buttons)
  // ============================================================================
  function disableButton($btn) {
    $btn.attr('href', '#').prop('disabled', true).addClass('disabled');
  }

  function updateResourceButtonHref($btn, params) {
    var resourceId = $btn.attr('data-resource-id');

    if (!resourceId) {
      console.warn(LOG, 'Missing data-resource-id on resource button:', $btn.attr('id'));
      disableButton($btn);
      return;
    }

    $.ajax({
      url: 'https://app.rapidfunnel.com/api/api/resources/resource-details/',
      type: 'GET',
      dataType: 'json',
      timeout: 8000,
      data: {
        userId:     params.userId,
        resourceId: resourceId,
        contactId:  params.contactId
      },
      success: function (response) {
        if (response && response.data && response.data.resourceUrl) {
          var url = response.data.resourceUrl;
          if (url.slice(-1) !== '/') url += '/';
          url += params.userId;
          if (params.contactId) url += '/' + params.contactId;
          $btn.attr('href', url).removeClass('disabled');
          console.log(LOG, 'Resource href updated for', $btn.attr('id'), '->', url);
        } else {
          console.warn(LOG, 'No resourceUrl in response for:', resourceId);
          disableButton($btn);
        }
      },
      error: function (xhr, status, error) {
        console.error(LOG, 'Failed to fetch resource URL for', resourceId, '— status:', status);
        disableButton($btn);
      }
    });
  }

  // ============================================================================
  // Initialization
  // ============================================================================
  var params = getUrlParams();
  var $buttons = $('[data-button-type]');

  if (!$buttons.length) {
    console.warn(LOG, 'No CTA buttons found with data-button-type attribute.');
    return;
  }

  console.log(LOG, 'Found', $buttons.length, 'button(s).');

  // Resolve resource button hrefs on page load
  $buttons.filter('[data-button-type="' + BUTTON_TYPES.RESOURCE + '"]').each(function () {
    updateResourceButtonHref($(this), params);
  });

  var isProcessing = false;

  // Handle clicks
  $buttons.on('click', function (e) {
    e.preventDefault();

    if (isProcessing) {
      console.warn(LOG, 'Click already being processed.');
      return;
    }

    var $btn = $(this);

    // Check if resource button is disabled
    if ($btn.hasClass('disabled')) {
      console.warn(LOG, 'Button is disabled — click ignored.');
      return;
    }

    isProcessing = true;

    var buttonType     = $btn.attr('data-button-type') || 'cta';
    var buttonLocation = $btn.attr('data-location') || $btn.attr('id') || '';
    var redirectUrl    = $btn.attr('href') || '';
    var target         = $btn.attr('target') || '_self';

    console.log(LOG, 'Clicked:', $btn.attr('id'), '(type:', buttonType + ')');

    // Route to appropriate handler
    if (buttonType === BUTTON_TYPES.CONVERSION) {
      handleConversionButton($btn, params, buttonLocation, redirectUrl, target);
    } else if (buttonType === BUTTON_TYPES.RESOURCE) {
      handleResourceButton($btn, params, buttonLocation, redirectUrl, target);
    } else {
      // Default to CTA behavior
      handleCtaButton($btn, params, buttonLocation, redirectUrl, target);
    }

    // Reset processing flag after delay to allow redirect
    setTimeout(function () { isProcessing = false; }, 3000);
  });

  console.log(LOG, 'CTA button tracking initialized.');
  });
})();
