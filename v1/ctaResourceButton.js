jQuery(function ($) {
  // This script is for fetching resource URLs for CTA resource buttons.

  
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');

  // Function to handle API call and update href for each CTA resource button
  function updateCtaResourceButtonLinks(button) {
    const ctaResourceId = $(button).attr('data-cta-resource-id');

    // Call the API with userId, resourceId, contactId, and ctaResourceId
    $.ajax({
      url: `https://app.rapidfunnel.com/api/api/resources/resource-details/?userId=${userId}&resourceId=${ctaResourceId}`,
      method: 'GET',
      success: function (response) {
        console.log(response);
        if (response && response.data) {
          // Update the href attribute of the button
          let formattedResourceUrl = response.data.resourceUrl + '/' + userId;
          if(contactId) {
            formattedResourceUrl = formattedResourceUrl + '/' + contactId;
          }
          $(button).attr('href', formattedResourceUrl);
        }
      },
      error: function (error) {
        console.error('Error fetching resource URL:', error);
      }
    });
  }

  // Iterate over each CTA resource button and update href on load
  $('[id^="ctaResourceButton"]').each(function () {
    console.log('CTA Resource Button exists', this);
    updateCtaResourceButtonLinks(this);
  });

  function handleCtaResourceButtonClick(buttonId) {
    const ctaResLocation = $('#' + buttonId).attr('data-cta-res-location');
    const redirectUrl = $('#' + buttonId).attr('href');
    const target = $('#' + buttonId).attr('target');

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
            ctaLocation: ctaResLocation,
            ctaPageName: pageName
          }),
          success: function (response) {
            console.log('CTA Resource email sent successfully', response);
            if (target === "_blank") {
              window.open(redirectUrl, '_blank');
            } else {
              window.location.href = redirectUrl;
            }
          },
          error: function (xhr, status, error) {
            console.error('CTA Resource email failed', error);
            if (target === "_blank") {
              window.open(redirectUrl, '_blank');
            } else {
              window.location.href = redirectUrl;
            }
          }
        });
      }
      ).fail(function () {
        console.error('Failed to fetch contact details.');
        if (target === "_blank") {
          window.open(redirectUrl, '_blank');
        } else {
          window.location.href = redirectUrl;
        }
      });
    } else {
      if (target === "_blank") {
        window.open(redirectUrl, '_blank');
      } else {
        window.location.href = redirectUrl;
      }
    }
  }

  

  $('[id^="ctaResourceButton"]').on('click', function(event) {
      event.preventDefault();
      console.log("Clicked CTA Resource Button:", this.id);
      handleCtaResourceButtonClick(this.id);
  });
});
