<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

  jQuery(function ($) {
    $(document).ready(function () {
      // Parse the URL and extract the userId
      const parsedUrl = new URL(window.location.href);
      const userId = parsedUrl.searchParams.get('userId');

      if (userId) {
        // Log the userId to the console
        console.log('User ID:', userId);

        // Fetch analytics data using the userId
        fetch(`https://apiv2.rapidfunnel.com/v2/analytics/` + userId)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((analyticsData) => {
            console.log('Analytics Data:', analyticsData);

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
            console.error('Error fetching analytics data:', error.message);
          });
      } else {
        console.log('No userId found in the URL.');
      }
    });
  });
  
  