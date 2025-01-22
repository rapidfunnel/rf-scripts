jQuery(function ($) {
  $(document).ready(function () {
    // Parse the URL and extract the userId
    const parsedUrl = new URL(window.location.href);
    const userId = parsedUrl.searchParams.get('userId');

    if (userId) {
      // Log the userId to the console
      console.log('Found User ID:', userId);

      // Fetch analytics data using the userId
      $.get(`https://apiv2.rapidfunnel.com/v2/analytics/` + userId, function (data) {
        console.log('Analytics Data:', data);

        const userAnalytics = data.userData || {};
        const accountAnalytics = data.accountData || {};

        // Dynamically inject Google Analytics script
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

            console.log('Google Analytics script successfully injected.');
          };
        }

        // Dynamically inject Facebook Pixel script
        if (userAnalytics.fbTrackingCode) {
          const fbScript = document.createElement('script');
          fbScript.innerHTML = `
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${userAnalytics.fbTrackingCode}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(fbScript);

          console.log('Facebook Pixel script successfully injected.');
        }

        // Dynamically inject GTM (Google Tag Manager) script if available
        if (accountAnalytics.gtmTrackingCode) {
          const gtmScript = document.createElement('script');
          gtmScript.innerHTML = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${accountAnalytics.gtmTrackingCode}');
          `;
          document.head.appendChild(gtmScript);

          console.log('Google Tag Manager script successfully injected.');
        }
      }).fail(function (error) {
        console.error('Error fetching analytics data:', error);
      });
    } else {
      console.log('No userId found in the URL.');
    }
  });
});
