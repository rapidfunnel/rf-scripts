jQuery(function ($) {

    // Adding Wistia analytics tracking class to iframes
    $("iframe").each(function() {
        var str = $(this).attr('src');
        if (str.indexOf("wistia") >= 0) {
            $(this).addClass('wistia_embed').attr('name', 'wistia_embed');
        }
    });
    videoAnalytics();

    // Listen for the custom event
    $(document).on('customBookingLinkUpdated', function () {
        checkBookingLink();
    });

    function checkBookingLink() {
        if ($('#customBookingLink').attr('href') && $('#customBookingLink').attr('href') !== '#') {
            console.log("We should hide request call container since there's a booking link");
            $('#requestCallContainer').hide();
        } else {
            console.log("We should show request call container since there's no booking link");
            $('#requestCallContainer').show();
        }
    }

    checkBookingLink();

    function videoAnalytics() {
        console.log('Inside video analytics');
        window._wq = window._wq || [];
        _wq.push({
            "_all": function(video) {
                var contactId,
                    userId,
                    resourceId,
                    url = window.location.href,
                    webinar = $('#webinar').val();

                const parsedUrl = new URL(url);
                userId     = parsedUrl.searchParams.get('userId');
                resourceId = parsedUrl.searchParams.get('resourceId');
                contactId  = parsedUrl.searchParams.get('contactId');

                console.log('showBookMeAfterTimeInSecondsPassedInVideo:', showBookMeAfterTimeInSecondsPassedInVideo);
                if (showBookMeAfterTimeInSecondsPassedInVideo > 0) {
                    $('#bookMeContainer').hide();
                }

                if ('' !== contactId &&
                    $.isNumeric(resourceId) && $.isNumeric(userId)) {

                    var analyticObject = {
                        resourceId:     resourceId,
                        contactId:      contactId,
                        userId:         userId,
                        percentWatched: 0,
                        mediaHash:      '',
                        duration:       '',
                        visitorKey:     '',
                        eventKey:       '',
                        asyncStats:     true,
                        delayProcess:   0,
                        webinar:        webinar
                    };

                    // Capture metadata on play so it's available when pause/end fires
                    video.bind('play', function() {
                        analyticObject.mediaHash  = video.hashedId();
                        analyticObject.duration   = video.duration();
                        analyticObject.visitorKey = video.visitorKey();
                        analyticObject.eventKey   = video.eventKey();
                        analyticObject.asyncStats = true;
                        analyticObject.delayProcess = 1;

                        console.log('Video started. Metadata captured:', analyticObject);
                        analyticObject.delayProcess = 0;
                    });

                    // Push analytics on pause or end with correct percentage
                    video.bind('pause end', function() {
                        var duration       = video.duration();
                        var secondsWatched = video.secondsWatched();

                        analyticObject.percentWatched = duration > 0
                            ? Math.round((secondsWatched / duration) * 100)
                            : 0;

                        analyticObject.mediaHash  = video.hashedId();
                        analyticObject.duration   = duration;
                        analyticObject.visitorKey = video.visitorKey();
                        analyticObject.eventKey   = video.eventKey();
                        analyticObject.asyncStats = true;
                        analyticObject.delayProcess = 0;

                        console.log('Pushing analytics on pause/end. Percent watched:', analyticObject.percentWatched);
                        sqsPushAnalytics(analyticObject);
                    });

                    video.bind('percentwatchedchanged', function(percent, lastPercent) {
                        if (percent !== lastPercent) {
                            console.log('Percent Watched:', percent);
                        }
                    });

                    video.bind('secondchange', function() {
                        console.log('book me href value', $('#customBookingLink').attr('href'));
                        if (video.secondsWatched() >= showBookMeAfterTimeInSecondsPassedInVideo) {
                            console.log('Showing bookMeContainer — time threshold reached');
                            $('#bookMeContainer').show();
                        }
                        if (video.secondsWatched() == 5)  console.log("You've watched 5 seconds of this video!");
                        if (video.secondsWatched() == 10) {
                            console.log("You've watched 10 seconds of this video!");
                            console.log('video script, customBookingLink:', window.sharedData.customBookingLink);
                        }
                        if (video.secondsWatched() == 15) console.log("You've watched 15 seconds of this video!");
                    });

                    video.email($('#contactEmail').val());
                }
            }
        });
    }

    function sqsPushAnalytics(analyticObject) {
        var postUrl = "https://my.rapidfunnel.com/landing/resource/push-to-sqs";
        $.ajax({
            type:     "POST",
            url:      postUrl,
            dataType: "json",
            async:    analyticObject.asyncStats,
            data: {
                resourceId:        analyticObject.resourceId,
                contactId:         analyticObject.contactId,
                userId:            analyticObject.userId,
                percentageWatched: analyticObject.percentWatched,
                mediaHash:         analyticObject.mediaHash,
                duration:          analyticObject.duration,
                visitorKey:        analyticObject.visitorKey,
                eventKey:          analyticObject.eventKey,
                delayProcess:      analyticObject.delayProcess,
                webinar:           analyticObject.webinar
            },
            success: function(response) {
                if (!response) {
                    bootbox.confirm('Some error occurred. Please reload your video once.', function(result) {
                        if (result) { location.reload(); }
                    });
                }
            },
            error: function() {
                bootbox.confirm('Some error occurred. Please reload your video once.', function(result) {
                    if (result) { location.reload(); }
                });
            }
        });
    }

});
