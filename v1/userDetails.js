jQuery(function ($) {
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');

  console.log('User ID: ' + userId);
  console.log('Resource ID: ' + resourceId);
  console.log('Contact ID: ' + contactId);

  if (userId) {
    $.get(
      'https://apiv2.rapidfunnel.com/v2/users-details/' + userId,
      function (data) {
        const userData = data.data[0];
        console.log('userdata', userData);

        console.log('custom booking link', userData.custombookinglink);
        console.log('custom booking link2', userData.customBookingLink);
        console.log('custom booking link3', userData[custombookinglink]);
        console.log('custom booking link4', userData[customBookingLink]);
        console.log('custom booking link5', userData['customBookingLink']);

        window.sharedData.customBookingLink = userData['customBookingLink'];
        console.log('shared global custom booking link:', window.sharedData.customBookingLink);

        // Loop over the userData keys
        for (const key of Object.keys(userData)) {
          const value = userData[key];
          const $element = $('#' + key);

          if ($element.length) {
            // If it's not the customBookingLink, set the text for the element (replace the placeholder text)
            if (key !== 'customBookingLink' && !$element.hasClass('footer-btn-socials')) {
              $element.text(value);
            }

            if (key === 'profileImage') {
              const imgSrc =
                value !== ''
                  ? value
                  : 'https://rfres.com/assets/img/icon-user-default.png';
              $element.attr('src', imgSrc);
            } else if (key === 'email') {
              $element.attr('href', 'mailto:' + value).text(value);
            } else if (key === 'phoneNumber') {
              if (value !== '') {
                $element.attr('href', 'tel:' + value).text(value);
              } else {
                $element.parent().hide(); // Hide the parent if phoneNumber is empty
              }
            } else if (key === 'customBookingLink') {
              if (value !== '') {
                $element.attr('href', value);
                $element.find('span').text('');
                $('.custom_custombookinglink').attr('href', value);
                $('.alternate-text').hide();
              } else {
                $element.hide();
                $('.custom_custombookinglink').hide();
              }
            }
          }

          $('.email-block').find('span').text('');
          $('.phone-block').find('span').text('');
          $('.custom_custombookinglink').find('span').text('');

          // Handle social links (replace href if available, otherwise hide the element)
          $('.footer-social-links a').each(function () {
            const socialId = $(this).attr('id'); // Get the id of the element (e.g., facebookUrl, twitterUrl)

            if (
              userData.hasOwnProperty(socialId) &&
              userData[socialId].trim() !== ''
            ) {
              $(this)
                .attr('href', userData[socialId]); // Set href if value exists in userData
                $(this).find('span').text('');
                // .text('');
            } else {
              $(this).hide(); // Hide the element if no value exists for the socialId
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
