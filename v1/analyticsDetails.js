jQuery(function ($) {
  console.log('DOM ready, initializing analytics tracking...');

  // Track which tracking codes have been injected to prevent duplicates
  const injectedTrackingCodes = {
    ga: new Set(),
    fb: new Set(),
    gtm: new Set()
  };

  try {
    const parsedUrl = new URL(window.location.href);
    const userId = parsedUrl.searchParams.get('userId');

    console.log('Current URL:', window.location.href);
    console.log('User ID from URL:', userId);

    if (!userId) {
      console.log('No userId found in the URL. Tracking will not be initialized.');
      return;
    }

    const apiUrl = `https://apiv2.rapidfunnel.com/v2/analytics/${userId}`;
    console.log('Attempting to fetch analytics data from:', apiUrl);

    $.ajax({
      url: apiUrl,
      type: 'GET',
      dataType: 'json',
      beforeSend: function() {
        console.log('API request starting...');
      },
      success: function(response) {
        console.log('API request successful, response:', response);

        if (!response || !response.data) {
          console.error('API response is empty or invalid');
          return;
        }

        // Process userData tracking codes
        if (response.data.userData) {
          const userData = response.data.userData;
          console.log('Extracted userData object:', userData);

          // Inject Google Analytics if available (userData)
          if (userData.googleTrackingCode && !injectedTrackingCodes.ga.has(userData.googleTrackingCode)) {
            console.log('Injecting Google Analytics from userData:', userData.googleTrackingCode);
            injectGoogleAnalytics(userData.googleTrackingCode);
          }

          // Inject Facebook Pixel if available (userData)
          if (userData.fbTrackingCode && !injectedTrackingCodes.fb.has(userData.fbTrackingCode)) {
            console.log('Injecting Facebook Pixel from userData:', userData.fbTrackingCode);
            injectFacebookPixel(userData.fbTrackingCode);
          }

          // Inject Google Tag Manager if available (userData)
          if (userData.gtmTrackingCode && !injectedTrackingCodes.gtm.has(userData.gtmTrackingCode)) {
            console.log('Injecting Google Tag Manager from userData:', userData.gtmTrackingCode);
            injectGoogleTagManager(userData.gtmTrackingCode);
          }
        }

        // Process accountData tracking codes
        if (response.data.accountData) {
          const accountData = response.data.accountData;
          console.log('Extracted accountData object:', accountData);

          // Inject Google Analytics if available (accountData)
          if (accountData.googleTrackingCode && !injectedTrackingCodes.ga.has(accountData.googleTrackingCode)) {
            console.log('Injecting Google Analytics from accountData:', accountData.googleTrackingCode);
            injectGoogleAnalytics(accountData.googleTrackingCode);
          }

          // Inject Facebook Pixel if available (accountData)
          if (accountData.fbTrackingCode && !injectedTrackingCodes.fb.has(accountData.fbTrackingCode)) {
            console.log('Injecting Facebook Pixel from accountData:', accountData.fbTrackingCode);
            injectFacebookPixel(accountData.fbTrackingCode);
          }

          // Inject Google Tag Manager if available (accountData)
          if (accountData.gtmTrackingCode && !injectedTrackingCodes.gtm.has(accountData.gtmTrackingCode)) {
            console.log('Injecting Google Tag Manager from accountData:', accountData.gtmTrackingCode);
            injectGoogleTagManager(accountData.gtmTrackingCode);
          }
        }
      },
      error: function(xhr, status, error) {
        console.error('API request failed:', status, error);
        console.error('Response:', xhr.responseText);
      }
    });
  } catch (error) {
    console.error('Error in analytics tracking script:', error);
  }

  // Helper functions
  function injectGoogleAnalytics(trackingId) {
    if (injectedTrackingCodes.ga.has(trackingId)) return;

    console.log('Injecting Google Analytics:', trackingId);

    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(gaScript);

    const gaInitScript = document.createElement('script');
    gaInitScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', '${trackingId}');
    `;
    document.head.appendChild(gaInitScript);

    injectedTrackingCodes.ga.add(trackingId);
  }

  function injectFacebookPixel(pixelId) {
    if (injectedTrackingCodes.fb.has(pixelId)) return;

    console.log('Injecting Facebook Pixel:', pixelId);

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
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(fbScript);

    injectedTrackingCodes.fb.add(pixelId);
  }

  function injectGoogleTagManager(gtmId) {
    if (injectedTrackingCodes.gtm.has(gtmId)) return;

    console.log('Injecting Google Tag Manager:', gtmId);

    const gtmScript = document.createElement('script');
    gtmScript.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(gtmScript);

    injectedTrackingCodes.gtm.add(gtmId);
  }
});
