src="https://code.jquery.com/jquery-3.6.0.min.js"

  jQuery(function ($) {
    $(document).ready(function () {
      // Parse the URL and extract the userId
      const parsedUrl = new URL(window.location.href);
      const userId = parsedUrl.searchParams.get('userId');

      // Check if the userId exists in the URL
      if (userId) {
        console.log('User ID found:', userId);

        // Attempt to make the API request
        console.log('Attempting to fetch analytics data...');
        fetch(`https://apiv2.rapidfunnel.com/v2/analytics/` + userId)
          .then((response) => {
            // Check if the response is successful (status 200-299)
            if (!response.ok) {
              console.error(`HTTP error! Status: ${response.status}`);
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((analyticsData) => {
            console.log('Analytics Data received:', analyticsData);

            // Safely access data from the API response
            const userAnalytics = analyticsData.userData || {};
            const accountAnalytics = analyticsData.accountData || {};

            // Dynamically update Webflow placeholders
            document.getElementById('google-tracking-code').textContent = userAnalytics.googleTrackingCode || 'Not Available';
            document.getElementById('fb-tracking-code').textContent = userAnalytics.fbTrackingCode || 'Not Available';
            document.getElementById('fb-page-id').textContent = userAnalytics.fbPageId || 'Not Available';

            document.getElementById('account-google-tracking-code').textContent = accountAnalytics.googleTrackingCode || 'Not Available';
            document.getElementById('gtm-tracking-code').textContent = accountAnalytics.gtmTrackingCode || 'Not Available';
            document.getElementById('account-fb-tracking-code').textContent = accountAnalytics.fbTrackingCode || 'Not Available';
          })
          .catch((error) => {
            // Log any errors that occur during the fetch process
            console.error('Error fetching analytics data:', error.message);
          });
      } else {
        // If userId is not found in the URL, log this information
        console.log('No userId found in the URL.');
      }
    });
  });