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
        
        // Verify response structure
        if (!response) {
          console.error('API response is empty or invalid');
          return;
        }
        
        // Extract data based on the actual API response structure shown in the logs
        const data = response.data || {};
        const userData = data.userData || {};
        
        console.log('Extracted userData object:', userData);
        
        // Check Google Analytics tracking code in userData
        if (userData.googleTrackingCode && !injectedTrackingCodes.ga.has(userData.googleTrackingCode)) {
          console.log('Found Google Analytics tracking code in userData:', userData.googleTrackingCode);
          injectGoogleAnalytics(userData.googleTrackingCode);
        } else {
          console.log('No Google Analytics tracking code found or already injected');
        }
        
        // Check Facebook Pixel code in userData
        if (userData.fbTrackingCode && !injectedTrackingCodes.fb.has(userData.fbTrackingCode)) {
          console.log('Found Facebook Pixel code in userData:', userData.fbTrackingCode);
          injectFacebookPixel(userData.fbTrackingCode);
        } else {
          console.log('No Facebook Pixel tracking code found or already injected');
        }
        
        // Check for GTM code in userData
        if (userData.googleTrackingCode && userData.googleTrackingCode.startsWith('GTM-') && !injectedTrackingCodes.gtm.has(userData.googleTrackingCode)) {
          console.log('Found GTM tracking code in userData:', userData.googleTrackingCode);
          injectGoogleTagManager(userData.googleTrackingCode);
        } else {
          console.log('No GTM tracking code found or already injected');
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
  
  // Helper functions with duplicate prevention
  function injectGoogleAnalytics(trackingId) {
    // Ensure correct trackingId is being passed and avoid literal injection
    if (injectedTrackingCodes.ga.has(trackingId)) {
      console.log(`Google Analytics with ID ${trackingId} already injected, skipping...`);
      return;
    }
    
    console.log('Injecting Google Analytics with ID:', trackingId);
    
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    
    gaScript.onload = () => {
      console.log('Google Analytics script loaded successfully');
      
      const gaInitScript = document.createElement('script');
      gaInitScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', '${trackingId}');
      `;
      document.head.appendChild(gaInitScript);
      
      console.log('Google Analytics initialization script injected');
    };
    
    gaScript.onerror = (e) => {
      console.error('Failed to load Google Analytics script:', e);
    };
    
    document.head.appendChild(gaScript);
    console.log('Google Analytics script added to DOM');
    
    // Mark this tracking ID as injected
    injectedTrackingCodes.ga.add(trackingId);
  }
  
  function injectFacebookPixel(pixelId) {
    // Ensure correct pixelId is being passed
    if (injectedTrackingCodes.fb.has(pixelId)) {
      console.log(`Facebook Pixel with ID ${pixelId} already injected, skipping...`);
      return;
    }
    
    console.log('Injecting Facebook Pixel with ID:', pixelId);
    
    // Check if fbq is already defined (another way to prevent duplication)
    if (window.fbq) {
      console.log('Facebook Pixel already initialized, adding this pixel ID');
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    } else {
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
      console.log('Facebook Pixel script added to DOM');
    }
    
    // Mark this pixel ID as injected
    injectedTrackingCodes.fb.add(pixelId);
  }
  
  function injectGoogleTagManager(gtmId) {
    // Ensure correct GTM ID is being passed
    if (injectedTrackingCodes.gtm.has(gtmId)) {
      console.log(`Google Tag Manager with ID ${gtmId} already injected, skipping...`);
      return;
    }
    
    console.log('Injecting Google Tag Manager with ID:', gtmId);
    
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
    console.log('Google Tag Manager script added to DOM');
    
    // Mark this GTM ID as injected
    injectedTrackingCodes.gtm.add(gtmId);
  }
});
