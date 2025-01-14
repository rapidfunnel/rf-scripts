jQuery(function ($) {
  $(document).ready(function () {
    const parsedUrl = new URL(window.location.href);
    const userId = parsedUrl.searchParams.get('userId');

    if (userId) {
      console.log('Found User ID:', userId);

      $.get(`https://apiv2.rapidfunnel.com/v2/analytics/` + userId, function (data) {
        console.log('Analytics Data:', data);

        const userAnalytics = data.userData || {};
        const accountAnalytics = data.accountData || {};

        // Dynamically update Webflow placeholders
        document.getElementById('google-tracking-code').textContent = userAnalytics.googleTrackingCode || 'Not Available';
        document.getElementById('fb-tracking-code').textContent = userAnalytics.fbTrackingCode || 'Not Available';
        document.getElementById('fb-page-id').textContent = userAnalytics.fbPageId || 'Not Available';

        document.getElementById('account-google-tracking-code').textContent = accountAnalytics.googleTrackingCode || 'Not Available';
        document.getElementById('gtm-tracking-code').textContent = accountAnalytics.gtmTrackingCode || 'Not Available';
        document.getElementById('account-fb-tracking-code').textContent = accountAnalytics.fbTrackingCode || 'Not Available';

        // Dynamically add Google Analytics and Facebook Pixel scripts
        addTrackingScripts(userAnalytics, accountAnalytics);
      }).fail(function (error) {
        console.error('Error fetching analytics data:', error);
      });
    } else {
      console.log('No userId found in the URL.');
    }

    // Function to add tracking scripts dynamically
    function addTrackingScripts(userAnalytics, accountAnalytics) {
      // Google Analytics (GA4)
      if (userAnalytics.googleTrackingCode) {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${userAnalytics.googleTrackingCode}`;
        document.head.appendChild(gaScript);

        gaScript.onload = () => {
          window.dataLayer = window.dataLayer || [];
          function gtag() { dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', userAnalytics.googleTrackingCode);
        };
      }

      // Facebook Pixel
      if (userAnalytics.fbTrackingCode) {
        !function(f,b,e,v,n,t,s) {
          if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
          if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
          t = b.createElement(e); t.async = true; t.src = v;
          s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', userAnalytics.fbTrackingCode);
        fbq('track', 'PageView');
      }
    }
  });
});
