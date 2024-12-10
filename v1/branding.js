jQuery(function ($) {
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');

  if (userId) {
    // Call the API to fetch branding details
    $.get(`https://app.rapidfunnel.com/api/branding/user/${userId}`, function (response) {
      if (response.status === 0 && response.data) {
        const brandingData = response.data;
        console.log('Branding data', brandingData);

        // Apply primary color to elements with class 'rf_primaryColor'
        if (brandingData.primaryColor) {
          $('.rf_primarycolor').css('background', brandingData.primaryColor);
          console.log('Primary Color', brandingData.primaryColor);
        }

        // Apply secondary color to elements with class 'rf_secondaryColor'
        if (brandingData.secondaryColor) {
          $('.rf_secondarycolor').css('background', brandingData.secondaryColor);
        }

        // Apply tertiary color to elements with class 'rf_tertiaryColor'
        if (brandingData.tertiaryColor) {
          $('.rf_tertiarycolor').css('background', brandingData.tertiaryColor);
        }

        // Hide the "Powered by RF" logo based on hidePoweredByRFLogoOnResources
        if (brandingData.hidePoweredByRFLogoOnResources) {
          $('.pbrf_logo').hide();
          
      } else {
        console.error('Failed to fetch branding data:', response);
      }
    }).fail(function () {
      console.error('Error calling branding API');
    });
  } else {
    console.warn('No userId found in the URL');
  }
});
