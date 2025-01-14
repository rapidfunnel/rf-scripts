jQuery(function ($) {
  $(document).ready(function () {
    // Parse the URL and extract the userId
    const parsedUrl = new URL(window.location.href);
    const userId = parsedUrl.searchParams.get('userId');

    if (userId) {
      // Log the userId to the console
      console.log('Found User ID:', userId);

      // Fetch analytics data using the userId
      $.get(
        `https://apiv2.rapidfunnel.com/v2/analytics/` + userId,
        function (data) {
          // Logging the response to the console for debugging
          console.log('Analytics Data:', data);

          // Extracting userData and accountData from the response
          const userAnalytics = data.userData || {};
          const accountAnalytics = data.accountData || {};

          // Dynamically update Webflow placeholders
          document.getElementById('google-tracking-code') = userAnalytics.googleTrackingCode;
          document.getElementById('fb-tracking-code') = userAnalytics.fbTrackingCode;
          document.getElementById('fb-page-id') = userAnalytics.fbPageId;

          document.getElementById('account-google-tracking-code') = accountAnalytics.googleTrackingCode;
          document.getElementById('gtm-tracking-code') = accountAnalytics.gtmTrackingCode;
          document.getElementById('account-fb-tracking-code') = accountAnalytics.fbTrackingCode;
        }
      ).fail(function (error) {
        // Handle the error if the API request fails
        console.error('Error fetching analytics data:', error);
      });
    } else {
      console.log('No userId found in the URL.');
    }
  });
});