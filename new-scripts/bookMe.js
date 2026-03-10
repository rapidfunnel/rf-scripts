(function() {
  // Safety check for jQuery
  if (typeof jQuery === 'undefined') {
    console.error('[BookMe] jQuery is not loaded');
    return;
  }

  jQuery(function ($) {
    'use strict';

    console.log('[BookMe] Script executing...');
    var LOG = '[BookMe]';
  var checkCount = 0;
  var maxChecks = 20;
  var checkInterval = 500;
  var pollTimer = null;
  var foundBookingLink = false;

  var $btn = $('#customBookingLink');

  if (!$btn.length) {
    console.warn(LOG, '#customBookingLink not found on page');
    return;
  }

  // Initially hide the button
  $btn.hide();

  function getBookingLink() {
    // Check window.sharedData (set by userDetails.js)
    if (window.sharedData && window.sharedData.customBookingLink) {
      var link = window.sharedData.customBookingLink;
      if (link && link !== '#' && link.trim() !== '') {
        return link;
      }
    }

    // Check href attribute on the button itself
    var href = $btn.attr('href');
    if (href && href !== '#' && href.trim() !== '') {
      return href;
    }

    return null;
  }

  function checkAndShowButton() {
    checkCount++;
    var bookingLink = getBookingLink();

    if (bookingLink) {
      foundBookingLink = true;

      // Stop polling once found
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }

      console.log(LOG, 'Booking link found, showing button');
      $btn.show();
    } else {
      $btn.hide();
    }
  }

  // Listen for the customBookingLinkUpdated event (auto-cleanup with .one())
  $(document).one('customBookingLinkUpdated', function () {
    checkAndShowButton();
  });

  // Run initial check
  checkAndShowButton();

  // Start polling if not found yet
  if (!foundBookingLink) {
    pollTimer = setInterval(function() {
      if (foundBookingLink) {
        clearInterval(pollTimer);
        pollTimer = null;
        return;
      }

      if (checkCount >= maxChecks) {
        clearInterval(pollTimer);
        pollTimer = null;
        console.warn(LOG, 'Booking link not found after polling');
        return;
      }

      checkAndShowButton();
    }, checkInterval);
  }
  });
})();
