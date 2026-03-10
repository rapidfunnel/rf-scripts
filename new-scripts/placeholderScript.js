(function() {
  // Safety check for jQuery
  if (typeof jQuery === 'undefined') {
    console.error('[PlaceholderScript] jQuery is not loaded');
    return;
  }

  jQuery(function ($) {
    'use strict';

    console.log('[PlaceholderScript] Script executing...');
    var LOG = '[PlaceholderScript]';
  var userId, contactId;

  try {
    var parsed = new URL(window.location.href);
    userId    = parsed.searchParams.get('userId')    || '';
    contactId = parsed.searchParams.get('contactId') || '';
  } catch (e) {
    console.error(LOG, 'Could not parse current URL:', e);
    return;
  }

  console.log(LOG, 'Replacing placeholders — userId:', userId, '| contactId:', contactId);

  var replaced = 0;

  $('a[href]').each(function () {
    var original = $(this).attr('href');

    if (!original || typeof original !== 'string') return;

    var updated = original
      .replace(/\[user-id\]/g,   userId)
      .replace(/\[userId\]/g,    userId)
      .replace(/\[contactId\]/g, contactId);

    if (updated !== original) {
      $(this).attr('href', updated);
      replaced++;
    }
  });

  console.log(LOG, 'Done. ' + replaced + ' link(s) updated.');
  });
})();
