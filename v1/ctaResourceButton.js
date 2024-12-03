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
    console.log('resId', ctaResourceId);
    console.log('API URL', `https://s1app.rapidfunnel.com/api/api/resources/resource-details/?userId=${userId}&resourceId=${ctaResourceId}`);

    // Call the API with userId, resourceId, contactId, and ctaResourceId
    $.ajax({
      url: `https://s1app.rapidfunnel.com/api/api/resources/resource-details/?userId=${userId}&resourceId=${ctaResourceId}`,
      method: 'GET',
      success: function (response) {
        console.log(response);
        if (response && response.data) {
          // Update the href attribute of the button
          $(button).attr('href', response.data.resourceUrl);
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
    const ctaResourceId = $('#' + buttonId).attr('data-cta-resource-id');
  }

  

  $('[id^="ctaResourceButton"]').on('click', function(event) {
      event.preventDefault();
      console.log("Clicked CTA Resource Button:", this.id);
      handleCtaResourceButtonClick(this.id);
  });

});
