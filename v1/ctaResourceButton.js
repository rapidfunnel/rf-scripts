jQuery(function ($) {
  // This script is for fetching resource URLs for link type resources.

  
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');

  function handleCtaResourceButtonClick(buttonId) {
  }

  

  $('[id^="ctaResourceButton"]').on('click', function(event) {
      event.preventDefault();
      console.log("Clicked CTA Resource Button:", this.id);
      handleCtaResourceButtonClick(this.id);
  });

});
