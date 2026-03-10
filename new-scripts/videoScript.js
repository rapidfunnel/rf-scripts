(function() {
  function initVideoTracking() {
    const url = new URL(window.location.href);
    const userIdRaw = url.searchParams.get('userId') || '';
    const contactIdRaw = url.searchParams.get('contactId') || '';
    const userId = userIdRaw.match(/^\d+$/) ? userIdRaw : '';
    const contactId = contactIdRaw.match(/^\d+$/) ? contactIdRaw : '';
    const webinarElement = document.querySelector('#webinar');
    const webinar = webinarElement ? webinarElement.value || '' : '';

    function isNumeric(value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    }

    if (contactId && userId && isNumeric(contactId) && isNumeric(userId)) {
      window._wq = window._wq || [];
      _wq.push({
        _all: function(video) {
          let sentFinal = false;
          const videoContainer = video.container;
          const resourceId = videoContainer?.getAttribute('data-resource-id');

          if (!resourceId || !isNumeric(resourceId)) {
            console.warn('[Tracking] ⚠️ No valid data-resource-id on this video');
            return;
          }

          function calculatePercentage() {
            const duration = video.duration();
            const currentTime = video.time();
            if (!duration || duration <= 0) return 0;
            return Math.floor((currentTime / duration) * 100) / 100;
          }

          function sendTrackingData(percentageWatched) {
            if (percentageWatched > 100) return;
            const formData = new URLSearchParams({
              resourceId: resourceId,
              contactId: contactId,
              userId: userId,
              percentageWatched: percentageWatched,
              mediaHash: video.hashedId(),
              duration: video.duration(),
              visitorKey: video.visitorKey(),
              eventKey: video.eventKey(),
              delayProcess: 1,
              webinar: webinar,
            });
            fetch('https://my.rapidfunnel.com/landing/resource/push-to-sqs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: formData.toString(),
            })
              .then(response => response.json())
              .catch(() => console.warn('[Tracking] ❌ POST failed'));
          }

          // Send on pause using precise playhead position
          video.bind('pause', function() {
            if (!sentFinal) {
              sendTrackingData(calculatePercentage());
            }
          });

          // Send at 95% threshold using precise playhead position
          video.bind('timechange', function(t) {
            const duration = video.duration();
            if (!sentFinal && duration > 0 && (t / duration) >= 0.95) {
              sentFinal = true;
              sendTrackingData(Math.floor((t / duration) * 100) / 100);
            }
          });

          // Send 100% on end
          video.bind('end', function() {
            if (!sentFinal) {
              sentFinal = true;
              sendTrackingData(100);
            }
          });
        },
      });
    } else {
      console.warn('[Tracking] 💡 Missing or invalid userId/contactId');
    }
  }

  function safeInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initVideoTracking);
    } else {
      initVideoTracking();
    }
  }

  if (window._wq) {
    safeInit();
  } else {
    window._wq = [];
    safeInit();
  }
})();
