jQuery(function ($) {
    // Initially hide the button
    const $bookMebutton = $('#customBookingLink');
    $bookMebutton.hide();

    // Listen for the custom event
    $(document).on('customBookingLinkUpdated', function () {
        checkAndShowButton();
    });

    // Function to check if the button should be shown based on the href attribute
    function checkAndShowButton() {
        console.log("In Book me script, book me href value", $bookMebutton.attr('href'));
        if ($bookMebutton.attr('href') && $bookMebutton.attr('href') !== '#') {
            $bookMebutton.show();
        } else {
            $bookMebutton.hide();
        }
    }

    checkAndShowButton();
});
