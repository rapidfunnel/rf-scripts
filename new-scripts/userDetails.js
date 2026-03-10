(function() {
  // Safety check for jQuery
  if (typeof jQuery === 'undefined') {
    console.error('[UserDetails] jQuery is not loaded');
    return;
  }

  jQuery(function ($) {
    'use strict';

    console.log('[UserDetails] Script executing...');
    var LOG = '[UserDetails]';
  var DEFAULT_AVATAR = 'https://rfres.com/assets/img/icon-user-default.png';

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

  function safeSetText($el, value) {
    if ($el.length && value !== undefined && value !== null) {
      $el.text(String(value));
    }
  }

  function applyUserData(userData) {
    if (!userData || typeof userData !== 'object') return;

    Object.keys(userData).forEach(function (key) {
      var value = userData[key];

      // ── Profile images ───────────────────────────────────────────────────
      if (key.startsWith('profileImage')) {
        $('[id^="' + key + '"]').each(function () {
          $(this).attr('src', (value && value.trim() !== '') ? value : DEFAULT_AVATAR);
        });
        return;
      }

      // ── Booking link (handle BEFORE element existence check!) ───────────
      if (key === 'customBookingLink') {
        // ALWAYS store globally, regardless of element existence
        if (value && value.trim() !== '') {
          window.sharedData = window.sharedData || {};
          window.sharedData.customBookingLink = value;

          // Update #customBookingLink element if it exists
          var $customLink = $('#customBookingLink');
          if ($customLink.length) {
            $customLink.attr('href', value).find('span').text('');
          }

          $('.alternate-text').hide();

          // Notify other scripts (bookMe.js)
          $(document).trigger('customBookingLinkUpdated');
        } else {
          $('#customBookingLink').hide();
        }
        return;
      }

      var $el = $('#' + key);
      if (!$el.length) return;

      // ── Email ────────────────────────────────────────────────────────────
      if (key === 'email') {
        if (value) {
          $el.attr('href', 'mailto:' + value).text(value);
        }
        return;
      }

      // ── Phone ────────────────────────────────────────────────────────────
      if (key === 'phoneNumber') {
        if (value && value.trim() !== '') {
          $el.attr('href', 'tel:' + value).text(value);
        } else {
          $el.parent().hide();
        }
        return;
      }

      // ── All other fields ─────────────────────────────────────────────────
      if (!$el.hasClass('footer-btn-socials')) {
        safeSetText($el, value);
      }
    });

    // ── Name class helpers ──────────────────────────────────────────────────
    if (userData.firstName) $('.firstName').text(userData.firstName);
    if (userData.lastName)  $('.lastName').text(userData.lastName);

    // ── Social links ────────────────────────────────────────────────────────
    $('.footer-social-links a').each(function () {
      var $link    = $(this);
      var socialId = $link.attr('id');

      if (socialId && Object.prototype.hasOwnProperty.call(userData, socialId)) {
        var url = userData[socialId];
        if (url && url.trim() !== '') {
          $link.attr('href', url).find('span').text('');
        } else {
          $link.hide();
        }
      } else {
        $link.hide();
      }
    });
  }

  function suppressFontAwesomeIcons() {
    var sheet = document.styleSheets && document.styleSheets[0];
    if (!sheet) return;
    try {
      sheet.insertRule('span.fa.fa-envelope.fa-lg::before { content: ""; }', sheet.cssRules.length);
      sheet.insertRule('span.fa.fa-phone.fa-lg::before { content: ""; }',    sheet.cssRules.length);
    } catch (e) {
      console.warn(LOG, 'Could not suppress Font Awesome icons:', e);
    }
  }

  var params = getUrlParams();

  if (!params.userId) {
    console.warn(LOG, 'No userId in URL — user details skipped.');
    return;
  }

  suppressFontAwesomeIcons();

  $.ajax({
    url: 'https://apiv2.rapidfunnel.com/v2/users-details/' + encodeURIComponent(params.userId),
    type: 'GET',
    dataType: 'json',
    timeout: 8000,
    success: function (response) {
      if (!response || !response.data || !response.data[0]) {
        console.warn(LOG, 'Empty or invalid user details response.');
        return;
      }
      var userData = response.data[0];
      console.log(LOG, 'User data received:', userData);
      applyUserData(userData);
    },
    error: function (xhr, status, error) {
      console.error(LOG, 'Failed to fetch user details — status:', status, '| error:', error);
    }
  });

  console.log(LOG, 'User details initialized for userId:', params.userId);
  });
})();
