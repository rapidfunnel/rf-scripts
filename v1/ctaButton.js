jQuery(function ($) {
  // CTA Button Component
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');

  function handleCtaButtonClick(buttonId) {
    const ctaButtonLocation = eval(buttonId);

    // Get contact details
    if(contactId) {
      $.get(
      'https://apiv2.rapidfunnel.com/v2/contact-details/' + contactId,
      function (response) {
        const contactData = response.data;
        // Make a POST request with contactData to send cta button email to user
        $.ajax({
          url: 'https://s1app.rapidfunnel.com/api/mail/send-cta-email',
          type: 'POST',
          contentType: 'application/json',
          dataType: "json",
          data: JSON.stringify({
            legacyUserId: userId,
            contactFirstName: contactData.firstName,
            contactLastName: contactData.lastName,
            contactPhoneNumber: contactData.phone,
            contactEmail: contactData.email,
            ctaLocation: ctaButtonLocation,
            ctaPageName: pageName
          }),
          success: function (response) {
            console.log('CTA Button email sent successfully', response);
          },
          error: function (xhr, status, error) {
            console.error('CTA Button email failed', error);
          }
        });
      }
      ).fail(function () {
        console.error('Failed to fetch contact details.');
      });
    }
  }
  

  
  $('[id^="ctaButton"]').on('click', function(event) {
      event.preventDefault();
      console.log("Clicked CTA Button:", this.id);
      handleCtaButtonClick(this.id);
  });
});
