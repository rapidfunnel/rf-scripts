// Helper function for redirects
function handleRedirect(url, target) {
  if (url) { 
    if (target === "_blank") {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  }
}

// Modified function to accept redirect parameters
function sendNotification(user, firstName, lastName, phone, email, btnLocation, redirectUrl, target, contactId) {
  const pageName = document.title || "Unknown Page"; // Ensure pageName is defined

  // Make a POST request to notify the user via email
  $.ajax({
    url: 'https://app.rapidfunnel.com/api/mail/send-cta-conversion-email',
    type: 'POST',
    contentType: 'application/json',
    dataType: "json",
    data: JSON.stringify({
      legacyUserId: user,
      contactFirstName: firstName,
      contactLastName: lastName,
      contactPhoneNumber: phone,
      contactEmail: email,
      ctaLocation: btnLocation,
      ctaPageName: pageName,
      contactId: contactId
    }),
    success: function (response) {
      console.log('CTA Conversion notification sent successfully', response);
      handleRedirect(redirectUrl, target);
    },
    error: function (xhr, status, error) {
      console.error('CTA Conversion notification failed', error);
      handleRedirect(redirectUrl, target);
    }
  });
}

jQuery(function ($) {
  // Parse the current URL to get query parameters
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const contactId = parsedUrl.searchParams.get('contactId');
  const numericUserId = userId ? Number(userId) : 0; // Avoid NaN issues

  $('[id^="ctaConversionButton"]').on('click', function(event) {
    event.preventDefault();
    console.log("Clicked CTA Button: ", this.id);

    // Capture redirect properties from the button
    let ctaButtonLocation = $(this).attr('data-description') || this.id; // Fix: Proper fallback
    const redirectUrl = $(this).attr('href');
    const target = $(this).attr('target');

    if (contactId) {
      $.get(`https://apiv2.rapidfunnel.com/v2/contact-details/${contactId}`)
        .done(function (response) {
          sendNotification(
            numericUserId, 
            response.data.firstName, 
            response.data.lastName, 
            response.data.phone, 
            response.data.email, 
            ctaButtonLocation,
            redirectUrl,
            target,
            contactId
          );
        })
        .fail(function () {
          sendNotification(
            numericUserId, 
            "System failed to answer",
            "N/A", 
            "N/A", 
            "N/A", 
            ctaButtonLocation,
            redirectUrl,
            target,
            contactId
          );
        });
    } else {
      sendNotification(
        numericUserId, 
        "No contact ID found", 
        "N/A", 
        "N/A", 
        "N/A", 
        ctaButtonLocation,
        redirectUrl,
        target,
        contactId
      );                
    }
  });
});
