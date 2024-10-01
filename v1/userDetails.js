jQuery(function ($) {
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const params = parsedUrl.search.split('/');
  const userId = params[1]; // Extract the userId
  const resourceId = params[2]; // Extract the resourceID
  const contactId = params[3]; // Extract the contactId

  if (userId) {
    $.get(
      'https://apiv2.rapidfunnel.com/v2/users-details/' + userId,
      function (data) {
        const userData = data.data[0];
        console.log('userdata', userData);

        // Loop over the userData keys
        for (const key of Object.keys(userData)) {
          const value = userData[key];
          const $element = $('.components--custom_' + key.toLowerCase());

          // If it's not the customBookingLink, set the text for the element (replace the placeholder text)
          if (key !== 'customBookingLink') {
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
            } else {
              $element.hide();
            }
          }

          // Handle social links
            $('.components--footer-social-links a').each(function () {
              const socialId = $(this).attr('id'); // Get the id of the element (e.g., facebookUrl, twitterUrl)
              
              if (userData.hasOwnProperty(socialId) && userData[socialId].trim() !== '') {
                $(this).attr('href', userData[socialId]); // Set href if value exists in userData
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
