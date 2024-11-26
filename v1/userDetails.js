jQuery(function ($) {
  $(document).ready(function () {
    // Parse the URL to extract userId, resourceID, and contactId
    const parsedUrl = new URL(window.location.href);
    const userId = parsedUrl.searchParams.get('userId');
    const resourceId = parsedUrl.searchParams.get('resourceId');
    const contactId = parsedUrl.searchParams.get('contactId');
    const emailIcon = document.querySelector('span.fa.fa-envelope.fa-lg');
    const phoneIcon = document.querySelector('span.fa.fa-phone.fa-lg');
    const socialIcons = document.querySelectorAll('span.fa-xl');
  
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

    // if (socialIcons.length > 0) {
    //   const styleSheet = document.styleSheets[0];
    //   styleSheet.insertRule(
    //     'span.fa-xl::before { content: ""; }',
    //     styleSheet.cssRules.length
    //   );
    // }
if (socialIcons.length > 0) {
  console.log('check123123');
  socialIcons.forEach(icon => {
    const computedStyle = window.getComputedStyle(icon, "::before");
    const content = computedStyle.getPropertyValue("content");
    console.log(content, 'content123');
  
    if (content && content !== 'none' && content !== '""') {
      const styleSheet = document.styleSheets[0];
      styleSheet.insertRule(
        `span.fa-xl::before { content: ""; }`,
        styleSheet.cssRules.length
      );
    }
  });
}
    //
    
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
  
                  // Trigger the custom event now that the href has been updated
                  $(document).trigger('customBookingLinkUpdated');
                  console.log('Custom Booking Link Updated event triggered');
                } else {
                  console.log('Custom Booking Link Hidden as no value returned in API');
                  $element.hide();
                  $('.custom_custombookinglink').hide();
                }
              }
            }
  
            $('.email-block').find('span').text('');
            $('.firstName').text(userData.firstName);
            $('.lastName').text(userData.lastName);
            $('.phone-block').find('span').text('');
            $('.custom_custombookinglink').find('span').text('');
  
            // Handle social links (replace href if available, otherwise hide the element)
            $('.footer-social-links a').each(function () {
              const socialId = $(this).attr('id'); // Get the id of the element (e.g., facebookUrl, twitterUrl)
              
              if (
                userData.hasOwnProperty(socialId) &&
                userData[socialId] &&
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
});
