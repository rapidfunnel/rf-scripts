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
          document.getElementById('google-tracking-code').textContent = userAnalytics.googleTrackingCode || 'Not Available';
          document.getElementById('fb-tracking-code').textContent = userAnalytics.fbTrackingCode || 'Not Available';
          document.getElementById('fb-page-id').textContent = userAnalytics.fbPageId || 'Not Available';

          document.getElementById('account-google-tracking-code').textContent = accountAnalytics.googleTrackingCode || 'Not Available';
          document.getElementById('gtm-tracking-code').textContent = accountAnalytics.gtmTrackingCode || 'Not Available';
          document.getElementById('account-fb-tracking-code').textContent = accountAnalytics.fbTrackingCode || 'Not Available';
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