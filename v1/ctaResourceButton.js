jQuery(function ($) {
  // Parse the URL to extract userId and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const contactId = parsedUrl.searchParams.get('contactId');
  const numericUserId = userId ? Number(userId) : 0; // Ensure userId is valid
  const pageName = document.title || "Unknown Page"; // Ensure pageName is defined

  // Helper function for redirects
  function handleRedirect(url, target) {
    if (url) {
      target === "_blank" ? window.open(url, "_blank") : (window.location.href = url);
    }
  }

  // Function to update href for each CTA resource button
  function updateCtaResourceButtonLinks(button) {
    const ctaResourceId = $(button).attr('data-cta-resource-id');

    $.ajax({
      url: `https://app.rapidfunnel.com/api/api/resources/resource-details/?userId=${userId}&resourceId=${ctaResourceId}&contactId=${contactId || ''}`,
      method: 'GET',
      success: function (response) {
        console.log(response);
        if (response && response.data) {
          let formattedResourceUrl = response.data.resourceUrl + '/' + userId;
          if (contactId) {
            formattedResourceUrl += '/' + contactId;
          }
          $(button).attr('href', formattedResourceUrl);
        }
      },
      error: function (error) {
        console.error("Error fetching resource URL:", error);
        $(button).attr("href", "#").prop("disabled", true);  // Disable button on failure
      }
    });
  }

  // Iterate over each CTA resource button and update href on load
  $('[id^="ctaResourceButton"]').each(function () {
    console.log("CTA Resource Button exists", this);
    updateCtaResourceButtonLinks(this);
  });

  // Function to handle CTA button clicks
  function handleCtaResourceButtonClick(buttonId) {
    const button = $('#' + buttonId);
    const ctaResLocation = button.attr('data-cta-res-location');
    const redirectUrl = button.attr('href');
    const target = button.attr('target');

    if (contactId) {
      $.get(`https://apiv2.rapidfunnel.com/v2/contact-details/${contactId}`)
        .done(function (response) {
          const contactData = response.data;

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
              console.log("CTA Resource email sent successfully", response);
              handleRedirect(redirectUrl, target);
            },
            error: function (xhr, status, error) {
              console.error("CTA Resource email failed", error);
              handleRedirect(redirectUrl, target);
            }
          });
        })
        .fail(function () {
          console.error("Failed to fetch contact details.");
          handleRedirect(redirectUrl, target);
        });
    } else {
      handleRedirect(redirectUrl, target);
    }
  }

  // Attach event listener for CTA resource button clicks
  $('[id^="ctaResourceButton"]').on('click', function (event) {
    event.preventDefault();
    console.log("Clicked CTA Resource Button:", this.id);
    handleCtaResourceButtonClick(this.id);
  });
});
