jQuery(function ($) {
  // CTA Button Component
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');

  function handleCtaButtonClick(buttonId) {
    const ctaButtonLocation = eval(buttonId);
    const redirectUrl = $('#' + buttonId).attr('href');

    // Get contact details
    if(contactId) {
      $.get(
      'https://apiv2.rapidfunnel.com/v2/contact-details/' + contactId,
      function (response) {
        const contactData = response.data;
        const numericUserId = Number(userId);
        // Make a POST request with contactData to send cta button email to user
        $.ajax({
          url: 'https://app.rapidfunnel.com/api/mail/send-cta-email',
          type: 'POST',
          contentType: 'application/json',
          dataType: "json",
          data: JSON.stringify({
            legacyUserId: numericUserId,
            contactFirstName: contactData.firstName,
            contactLastName: contactData.lastName,
            contactPhoneNumber: contactData.phone,
            contactEmail: contactData.email,
            ctaLocation: ctaButtonLocation,
            ctaPageName: pageName
          }),
          success: function (response) {
            console.log('CTA Button email sent successfully', response);
            window.location.href = redirectUrl;
          },
          error: function (xhr, status, error) {
            console.error('CTA Button email failed', error);
            window.location.href = redirectUrl;
          }
        });
      }
      ).fail(function () {
        console.error('Failed to fetch contact details.');
        window.location.href = redirectUrl;
      });
    } else {
      window.location.href = redirectUrl;
    }
  }
  

  
  $('[id^="ctaButton"]').on('click', function(event) {
      event.preventDefault();
      console.log("Clicked CTA Button:", this.id);
      handleCtaButtonClick(this.id);
  });
});
