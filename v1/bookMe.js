jQuery(function ($) {
    // Initially hide the button
    const $bookMebutton = $('#customBookingLink');
    $bookMebutton.hide();

    // Function to check if the button should be shown based on the href attribute
    function checkAndShowButton() {
        if ($bookMebutton.attr('href')) {
            $bookMebutton.show();
        } else {
            $bookMebutton.hide();
        }
    }

    // Check if a video is present on the page
    const videoExists = $('.wistia_embed');

    if (videoExists) {
        // Listen for the custom event when the video reaches a certain watch percentage or watch time
        window.addEventListener('videoWatched', function (event) {
            checkAndShowButton();
        });
    } else {
        // Call the function initially to check if the button should be shown
        checkAndShowButton();
    }
});
