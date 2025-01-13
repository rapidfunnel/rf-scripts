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
          $('.rf_primaryColor').css('background', brandingData.primaryColor);
          console.log('Primary Color', brandingData.primaryColor);
        }

        // Apply primary color offset to elements with class 'rf_primaryColorOff'
        if (brandingData.primaryColorOffset) {
          $('.rf_primaryColorOff').css('background', brandingData.primaryColorOffset);
          console.log('Primary Color Offset', brandingData.primaryColorOffset);
        }

        // Apply secondary color to elements with class 'rf_secondaryColor'
        if (brandingData.secondaryColor) {
          $('.rf_secondaryColor').css('background', brandingData.secondaryColor);
        }

        // Apply secondary color offset to elements with class 'rf_secondaryColorOff'
        if (brandingData.secondaryColorOffset) {
          $('.rf_secondaryColorOff').css('background', brandingData.secondaryColorOffset);
        }

        // Apply tertiary color to elements with class 'rf_tertiaryColor'
        if (brandingData.tertiaryColor) {
          $('.rf_tertiaryColor').css('background', brandingData.tertiaryColor);
        }

        // Apply tertiary color offset to elements with class 'rf_tertiaryColorOff'
        if (brandingData.tertiaryColorOffset) {
          $('.rf_tertiaryColorOff').css('background', brandingData.tertiaryColorOffset);
        }

        // Ensure the "Powered by RF" logo is visible by default
        $('#pbrf_logo').show();

        // Debug the hidePoweredByRFLogoOnResources value
        console.log('removeRFLogoOnDashboard:', brandingData.removeRFLogoOnDashboard);

        // Hide the "Powered by RF" logo if hidePoweredByRFLogoOnResources is true
        if (brandingData.removeRFLogoOnDashboard === true) {
          $('#pbrf_logo').hide();
        }
        
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
