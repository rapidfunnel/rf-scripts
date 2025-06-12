jQuery(function ($) {
    // Adding Wistia analytics tracking class to iframes
    $('iframe').each(function () {
      var str = $(this).attr('src');
      if (str.indexOf('wistia') >= 0) {
        $(this).addClass('wistia_embed').attr('name', 'wistia_embed');
      }
    });

    const url = window.location.href;
    const parsedUrl = new URL(url);
    var userId = parsedUrl.searchParams.get('userId');
    var resourceId = parsedUrl.searchParams.get('resourceId');
    var contactId = parsedUrl.searchParams.get('contactId');

    if (
      '' !== contactId &&
      '' !== resourceId &&
      '' !== userId &&
      $.isNumeric(contactId) &&
      $.isNumeric(resourceId) &&
      $.isNumeric(userId)
    ) {
      window._wq = window._wq || [];
      _wq.push({
        _all: function (video) {
          console.log('Inside video analystics');
          var webinar = $('#webinar').val();

          video.bind('play', function () {
            $.ajax({
              type: 'POST',
              url: 'https://my.rapidfunnel.com/landing/resource/push-to-sqs',
              dataType: 'json',
              async: true,
              data: {
                resourceId: resourceId,
                contactId: contactId,
                userId: userId,
                percentageWatched: 0,
                mediaHash: video.hashedId(),
                duration: video.duration(),
                visitorKey: video.visitorKey(),
                eventKey: video.eventKey(),
                delayProcess: 1,
                webinar: webinar,
              },
              success: function (response) {
                if (!response) {
                  bootbox.confirm(
                    'Some error occurred. Please reload your video once.',
                    function (result) {
                      if (result) {
                        location.reload();
                      }
                    }
                  );
                }
              },
              error: function () {
                bootbox.confirm(
                  'Some error occurred. Please reload your video once.',
                  function (result) {
                    if (result) {
                      location.reload();
                    }
                  }
                );
              },
            });
          });
        },
      });
    }
});
