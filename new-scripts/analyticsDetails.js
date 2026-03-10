(function() {
  // Safety check for jQuery
  if (typeof jQuery === 'undefined') {
    console.error('[Analytics] jQuery is not loaded');
    return;
  }

  jQuery(function ($) {
    'use strict';

    console.log('[Analytics] Script executing...');
    var LOG = '[Analytics]';

  // Track injected codes per provider to prevent duplicates
  var injected = {
    ga:  new Set(),
    fb:  new Set(),
    gtm: new Set()
  };

  function injectGoogleAnalytics(id) {
    if (!id || injected.ga.has(id)) return;
    injected.ga.add(id);

    var gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(gtagScript);

    var initScript = document.createElement('script');
    initScript.textContent = [
      'window.dataLayer = window.dataLayer || [];',
      'function gtag(){ dataLayer.push(arguments); }',
      'gtag("js", new Date());',
      'gtag("config", "' + id + '");'
    ].join('\n');
    document.head.appendChild(initScript);

    console.log(LOG, 'Google Analytics injected:', id);
  }

  function injectFacebookPixel(id) {
    if (!id || injected.fb.has(id)) return;
    injected.fb.add(id);

    var fbScript = document.createElement('script');
    fbScript.textContent = [
      '!function(f,b,e,v,n,t,s){',
      '  if(f.fbq)return;n=f.fbq=function(){n.callMethod?',
      '  n.callMethod.apply(n,arguments):n.queue.push(arguments)};',
      '  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";',
      '  n.queue=[];t=b.createElement(e);t.async=!0;',
      '  t.src=v;s=b.getElementsByTagName(e)[0];',
      '  s.parentNode.insertBefore(t,s)',
      '}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");',
      'fbq("init","' + id + '");',
      'fbq("track","PageView");'
    ].join('\n');
    document.head.appendChild(fbScript);

    console.log(LOG, 'Facebook Pixel injected:', id);
  }

  function injectGoogleTagManager(id) {
    if (!id || injected.gtm.has(id)) return;
    injected.gtm.add(id);

    var gtmScript = document.createElement('script');
    gtmScript.textContent = [
      '(function(w,d,s,l,i){',
      '  w[l]=w[l]||[];',
      '  w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});',
      '  var f=d.getElementsByTagName(s)[0],',
      '      j=d.createElement(s),',
      '      dl=l!="dataLayer"?"&l="+l:"";',
      '  j.async=true;',
      '  j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;',
      '  f.parentNode.insertBefore(j,f);',
      '})(window,document,"script","dataLayer","' + id + '");'
    ].join('\n');
    document.head.appendChild(gtmScript);

    console.log(LOG, 'Google Tag Manager injected:', id);
  }

  function processTrackingCodes(data) {
    if (!data || typeof data !== 'object') return;
    if (data.googleTrackingCode) injectGoogleAnalytics(data.googleTrackingCode);
    if (data.fbTrackingCode)     injectFacebookPixel(data.fbTrackingCode);
    if (data.gtmTrackingCode)    injectGoogleTagManager(data.gtmTrackingCode);
  }

  var userId;

  try {
    userId = new URL(window.location.href).searchParams.get('userId');
  } catch (e) {
    console.error(LOG, 'Could not parse current URL:', e);
    return;
  }

  if (!userId) {
    console.log(LOG, 'No userId found in URL — analytics tracking skipped.');
    return;
  }

  console.log(LOG, 'Fetching analytics config for userId:', userId);

  $.ajax({
    url: 'https://apiv2.rapidfunnel.com/v2/analytics/' + encodeURIComponent(userId),
    type: 'GET',
    dataType: 'json',
    timeout: 8000,
    success: function (response) {
      if (!response || !response.data) {
        console.warn(LOG, 'API returned empty or invalid data.');
        return;
      }
      processTrackingCodes(response.data.userData);
      processTrackingCodes(response.data.accountData);
      console.log(LOG, 'Tracking initialization complete.');
    },
    error: function (xhr, status, error) {
      console.error(LOG, 'Failed to fetch analytics config — status:', status, '| error:', error);
    }
  });
  });
})();
