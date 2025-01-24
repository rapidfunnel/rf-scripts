jQuery(function ($) {
    // Add Wistia analytics tracking class to iframes
    function addWistiaTrackingClass() {
        $("iframe").each(function () {
            var src = $(this).attr('src');
            if (src && src.includes("wistia")) {
                $(this).addClass('wistia_embed').attr('name', 'wistia_embed');
            }
        });
    }

    // Check the booking link and show/hide the request call container
    function checkBookingLink() {
        const bookingLink = $('#customBookingLink').attr('href');
        if (bookingLink && bookingLink !== '#') {
            console.log("Hiding request call container - Booking link exists");
            $('#requestCallContainer').hide();
        } else {
            console.log("Showing request call container - No booking link");
            $('#requestCallContainer').show();
        }
    }

    // Wistia video analytics tracking setup
    function videoAnalytics() {
        console.log('Initializing video analytics');
        window._wq = window._wq || [];
        _wq.push({
            "_all": function (video) {
                const urlParams = new URLSearchParams(window.location.search);
                const userId = urlParams.get('userId');
                const resourceId = urlParams.get('resourceId');
                const contactId = urlParams.get('contactId');
                const webinar = $('#webinar').val();
                
                if (contactId && $.isNumeric(resourceId) && $.isNumeric(userId)) {
                    const analyticObject = {
                        resourceId,
                        contactId,
                        userId,
                        percentWatched: 0,
                        mediaHash: '',
                        duration: '',
                        visitorKey: '',
                        eventKey: '',
                        asyncStats: true,
                        delayProcess: 0,
                        webinar
                    };
                    
                    video.bind('play', function () {
                        console.log("Video started - Tracking analytics");
                        analyticObject.percentWatched = video.percentWatched();
                        analyticObject.mediaHash = video.hashedId();
                        analyticObject.duration = video.duration();
                        analyticObject.visitorKey = video.visitorKey();
                        analyticObject.eventKey = video.eventKey();
                        analyticObject.delayProcess = 1;
                        sqsPushAnalytics(analyticObject);
                    });
                    
                    video.bind('percentwatchedchanged', function (percent, lastPercent) {
                        if (percent !== lastPercent) {
                            console.log('Percent Watched:', percent);
                        }
                    });
                    
                    video.bind("secondchange", function () {
                        const timeWatched = video.secondsWatched();
                        console.log("Time watched: ", timeWatched);
                        
                        if (timeWatched >= showBookMeAfterTimeInSecondsPassedInVideo) {
                            console.log("Displaying 'Book Me' button");
                            $('#bookMeContainer').show();
                        }
                    });
                    
                    video.email($('#contactEmail').val());
                }
            }
        });
    }

    // Function to push video analytics data
    function sqsPushAnalytics(analyticObject) {
        $.ajax({
            type: "POST",
            url: "https://my.rapidfunnel.com/landing/resource/push-to-sqs",
            dataType: "json",
            async: analyticObject.asyncStats,
            data: analyticObject,
            success: function (response) {
                if (!response) {
                    bootbox.confirm('Error occurred. Reload video?', function (result) {
                        if (result) location.reload();
                    });
                }
            },
            error: function () {
                bootbox.confirm('Error occurred. Reload video?', function (result) {
                    if (result) location.reload();
                });
            }
        });
    }

    // Event listeners
    $(document).on('customBookingLinkUpdated', checkBookingLink);
    
    // Initial execution
    addWistiaTrackingClass();
    checkBookingLink();
    videoAnalytics();
});
