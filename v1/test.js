jQuery(function ($) {

    // Adding Wistia analytics tracking class to iframes
    $("iframe").each(function() {
        var str = $(this).attr('src');
        if (str && str.indexOf("wistia") >= 0) {
            $(this).addClass('wistia_embed').attr('name', 'wistia_embed');
        }
    });

    videoAnalytics();

    // Listen for the custom event
    $(document).on('customBookingLinkUpdated', function () {
        checkBookingLink();
    });

    // Function to check the booking link and show/hide the request call container
    function checkBookingLink() {
        if ($('#customBookingLink').attr('href') && $('#customBookingLink').attr('href') !== '#') {
            console.log("Hiding request call container - booking link exists");
            $('#requestCallContainer').hide();
        } else {
            console.log("Showing request call container - no booking link");
            $('#requestCallContainer').show();
        }
    }

    // Run the check initially in case the href value is already set on page load
    checkBookingLink();

    // Wistia video analytics tracking setup
    function videoAnalytics() {
        console.log('Inside video analytics setup');
        window._wq = window._wq || [];
        _wq.push({
            "_all": function(video) {
                var contactId,
                    userId,
                    resourceId,
                    url = window.location.href,
                    webinar = $('#webinar').val(),
                    args;

                const parsedUrl = new URL(url);
                userId = parsedUrl.searchParams.get('userId');
                resourceId = parsedUrl.searchParams.get('resourceId');
                contactId = parsedUrl.searchParams.get('contactId');

                // Ensure showBookMeAfterTimeInSecondsPassedInVideo is a valid number
                var showBookMeAfter = parseInt(showBookMeAfterTimeInSecondsPassedInVideo, 10) || 45;
                console.log('Threshold for showing book me container:', showBookMeAfter);

                if (showBookMeAfter > 0) {
                    $('#bookMeContainer').hide();
                }

                if (contactId && $.isNumeric(resourceId) && $.isNumeric(userId)) {
                    var analyticObject = {
                        resourceId: resourceId,
                        contactId: contactId,
                        userId: userId,
                        percentWatched: 0,
                        mediaHash: '',
                        duration: '',
                        visitorKey: '',
                        eventKey: '',
                        asyncStats: true,
                        delayProcess: 0,
                        webinar: webinar
                    };

                    video.bind('play', function() {
                        console.log("Video started playing");
                        analyticObject.percentWatched = video.percentWatched();
                        analyticObject.mediaHash = video.hashedId();
                        analyticObject.duration = video.duration();
                        analyticObject.visitorKey = video.visitorKey();
                        analyticObject.eventKey = video.eventKey();
                        analyticObject.asyncStats = true;
                        analyticObject.delayProcess = 1;
                        sqsPushAnalytics(analyticObject);
                        analyticObject.delayProcess = 0;
                        console.log("Analytic Object sent:", analyticObject);
                    });

                    video.bind("secondchange", function() {
                        let secondsWatched = video.secondsWatched();
                        console.log("Seconds watched:", secondsWatched);

                        if (secondsWatched >= showBookMeAfter) {
                            console.log("Showing book me container - required time passed");
                            $('#bookMeContainer').css("display", "block");
                        }
                    });

                    video.bind('percentwatchedchanged', function (percent, lastPercent) {
                        if (percent !== lastPercent) {
                            console.log('Percent Watched:', percent);
                        }
                    });

                    video.email($('#contactEmail').val());
                }
            }
        });
    }

    // Function to push video analytics to a remote server
    function sqsPushAnalytics(analyticObject) {
        var postUrl = "https://my.rapidfunnel.com/landing/resource/push-to-sqs";
        $.ajax({
            type: "POST",
            url: postUrl,
            dataType: "json",
            async: analyticObject.asyncStats,
            data: {
                resourceId: analyticObject.resourceId,
                contactId: analyticObject.contactId,
                userId: analyticObject.userId,
                percentageWatched: analyticObject.percentWatched,
                mediaHash: analyticObject.mediaHash,
                duration: analyticObject.duration,
                visitorKey: analyticObject.visitorKey,
                eventKey: analyticObject.eventKey,
                delayProcess: analyticObject.delayProcess,
                webinar: analyticObject.webinar
            },
            success: function(response) {
                if (!response) {
                    bootbox.confirm('Some error occurred. Please reload your video.', function(result) {
                        if (result) {
                            location.reload();
                        }
                    });
                }
            },
            error: function() {
                bootbox.confirm('Some error occurred. Please reload your video.', function(result) {
                    if (result) {
                        location.reload();
                    }
                });
            }
        })
    }
});
