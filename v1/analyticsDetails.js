jQuery(function ($) {
  // Parse the URL and extract the userId
  try {
    const parsedUrl = new URL(window.location.href);
    const userId = parsedUrl.searchParams.get('userId');
    
    if (!userId) {
      console.log('No userId found in the URL.');
      return;
    }
    
    // Log the userId to the console
    console.log('Found User ID:', userId);
    
    // Fetch analytics data using the userId
    $.get(`https://apiv2.rapidfunnel.com/v2/analytics/${userId}`)
      .done(function (data) {
        console.log('Analytics Data:', data);
        const userAnalytics = data.userData || {};
        const accountAnalytics = data.accountData || {};
        
        // Inject Google Analytics script
        if (userAnalytics.googleTrackingCode) {
          injectGoogleAnalytics(userAnalytics.googleTrackingCode);
        }
        
        // Inject Facebook Pixel script
        if (userAnalytics.fbTrackingCode) {
          injectFacebookPixel(userAnalytics.fbTrackingCode);
        }
        
        // Inject GTM script
        if (accountAnalytics.gtmTrackingCode) {
          injectGoogleTagManager(accountAnalytics.gtmTrackingCode);
        }
      })
      .fail(function (error) {
        console.error('Error fetching analytics data:', error);
      });
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
  
  // Helper function to inject Google Analytics
  function injectGoogleAnalytics(trackingId) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    
    gaScript.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', trackingId);
      console.log('Google Analytics script successfully injected.');
    };
    
    gaScript.onerror = () => {
      console.error('Failed to load Google Analytics script.');
    };
    
    document.head.appendChild(gaScript);
  }
  
  // Helper function to inject Facebook Pixel
  function injectFacebookPixel(pixelId) {
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
    
    // Add the noscript pixel image as well
    const fbNoscript = document.createElement('noscript');
    const fbPixelImg = document.createElement('img');
    fbPixelImg.height = 1;
    fbPixelImg.width = 1;
    fbPixelImg.style = "display:none";
    fbPixelImg.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    fbNoscript.appendChild(fbPixelImg);
    document.body.appendChild(fbNoscript);
    
    console.log('Facebook Pixel script successfully injected.');
  }
  
  // Helper function to inject Google Tag Manager
  function injectGoogleTagManager(gtmId) {
    // Add GTM script to head
    const gtmScript = document.createElement('script');
    gtmScript.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(gtmScript);
    
    // Add GTM noscript iframe to body
    const gtmNoscript = document.createElement('noscript');
    const gtmIframe = document.createElement('iframe');
    gtmIframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    gtmIframe.height = 0;
    gtmIframe.width = 0;
    gtmIframe.style = "display:none;visibility:hidden";
    gtmNoscript.appendChild(gtmIframe);
    document.body.appendChild(gtmNoscript);
    
    console.log('Google Tag Manager script successfully injected.');
  }
});
