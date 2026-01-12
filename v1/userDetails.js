jQuery(function ($) {
  $(document).ready(function () {
    // Parse the URL to extract userId, resourceID, and contactId
    const parsedUrl = new URL(window.location.href);
    const userId = parsedUrl.searchParams.get('userId');
    const resourceId = parsedUrl.searchParams.get('resourceId');
    const contactId = parsedUrl.searchParams.get('contactId');
    const emailIcon = document.querySelector('span.fa.fa-envelope.fa-lg');
    const phoneIcon = document.querySelector('span.fa.fa-phone.fa-lg');

    console.log('User ID: ' + userId);
    console.log('Resource ID: ' + resourceId);
    console.log('Contact ID: ' + contactId);

    if (emailIcon) {
      const styleSheet = document.styleSheets[0];
      styleSheet.insertRule(
        'span.fa.fa-envelope.fa-lg::before { content: ""; }',
        styleSheet.cssRules.length
      );
    }

    if (phoneIcon) {
      const styleSheet = document.styleSheets[0];
      styleSheet.insertRule(
        'span.fa.fa-phone.fa-lg::before { content: ""; }',
        styleSheet.cssRules.length
      );
    }

    if (userId) {
      $.get(
        'https://apiv2.rapidfunnel.com/v2/users-details/' + userId,
        function (data) {
          const userData = data.data[0];
          console.log('userdata', userData);

          console.log('custom booking link', userData.customBookingLink);

          window.sharedData = window.sharedData || {};
          window.sharedData.customBookingLink = userData.customBookingLink;
          console.log('shared global custom booking link:', window.sharedData.customBookingLink);

          // Loop over the userData keys
          for (const key of Object.keys(userData)) {
            const value = userData[key];
            // Use attribute starts with selector
            if (key.startsWith('profileImage')) {
              $(`[id^=${key}]`).each(function() {
                const imgSrc =
                  value !== ''
                    ? value
                    : 'https://rfres.com/assets/img/icon-user-default.png';
                $(this).attr('src', imgSrc);
              });
            }
            
            const $element = $('#' + key);

            if ($element.length && !key.startsWith('profileImage')) {
              if (key !== 'customBookingLink' && !$element.hasClass('footer-btn-socials')) {
                $element.text(value);
              }
              if (key === 'email') {
                $element.attr('href', 'mailto:' + value).text(value);
              } else if (key === 'phoneNumber') {
                if (value !== '') {
                  $element.attr('href', 'tel:' + value).text(value);
                } else {
                  $element.parent().hide();
                }
              } else if (key === 'customBookingLink') {
                if (value !== '') {
                  // Update ALL elements with IDs starting with "customBookingLink"
                  $('[id^="customBookingLink"]').each(function() {
                    $(this).attr('href', value);
                    $(this).find('span').text('');
                  });
                  
                  $('.custom_custombookinglink').attr('href', value);
                  $('.alternate-text').hide();

                  // Trigger the custom event now that the href has been updated
                  $(document).trigger('customBookingLinkUpdated');
                  console.log('Custom Booking Link Updated event triggered');
                } else {
                  console.log('Custom Booking Link Hidden as no value returned in API');
                  // Hide ALL elements with IDs starting with "customBookingLink"
                  $('[id^="customBookingLink"]').hide();
                  $('.custom_custombookinglink').hide();
                }
              }
            }

            $('.firstName').text(userData.firstName);
            $('.lastName').text(userData.lastName);
            $('.custom_custombookinglink').find('span').text('');

            // Handle social links
            $('.footer-social-links a').each(function () {
              const socialId = $(this).attr('id');

              if (
                userData.hasOwnProperty(socialId) &&
                userData[socialId] &&
                userData[socialId].trim() !== ''
              ) {
                $(this).attr('href', userData[socialId]);
                $(this).find('span').text('');
              } else {
                $(this).hide();
              }
            });
          }
        }
      ).fail(function () {
        console.error('Failed to fetch contact details.');
      });
    } else {
      console.log('No contactId found in the URL.');
    }
  });
});
