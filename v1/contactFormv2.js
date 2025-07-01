jQuery(function ($) {
    // --- Configuration ---
    const apiEndpoint = 'https://my.rapidfunnel.com/landing/resource/create-custom-contact';
    const prefetchNextPage = false;

    // --- Utility Functions ---
    function isValidUrl(url) {
        const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?$/;
        return urlPattern.test(url);
    }

    function hasUrlParameters(url) {
        return url.includes("?");
    }

    $(document).ready(() => {
        const url = window.location.href;
        const parsedUrl = new URL(url);
        const userId = parsedUrl.searchParams.get('userId');
        const resourceId = parsedUrl.searchParams.get('resourceId');
        const contactId = parsedUrl.searchParams.get('contactId');

        // --- Prefill Form (if contactId is present) ---
        if (contactId) {
            $('#contactEmail').prop('disabled', true);  // Disable email input
            $('label[for="email"]').css('color', '#aaa');

            $.get(
                'https://apiv2.rapidfunnel.com/v2/contact-details/' + contactId,
                function (response) {
                    const contactData = response.data;
                    if (contactData) {
                        $('.contactfirstname').val(contactData.firstName);
                        $('.contactlastname').val(contactData.lastName);
                        $('.contactemail').val(contactData.email);
                        $('.contactphone').val(contactData.phone);
                        $('.contactnote').val(contactData.note);
                    } else {
                        console.warn('No contact data found for contactId:', contactId);
                    }
                }
            ).fail(function () {
                console.error('Cannot prefill form - API failure');
            });
        } else {
            console.log('Cannot prefill form - no contact ID specified');
        }
    });

    // --- Form Submission Handling ---
    $('#contactFormSubmitBtn').on('click', function (event) {
        event.preventDefault();

        const $button = $('#contactFormSubmitBtn');
        const originalButtonText = $button.text();
        $button.prop('disabled', true).text('Submitting...');

        const url = window.location.href;
        const parsedUrl = new URL(url);
        const userId = parsedUrl.searchParams.get('userId');
        const resourceId = parsedUrl.searchParams.get('resourceId');

        // --- Prepare Form Data ---
        const formData = {
            firstName: $('#contactFirstName').val(),
            lastName: $('#contactLastName').val(),
            email: $('#contactEmail').val(),
            phone: $('#contactPhone').val(),
            campaign: campaignId,
            contactTag: labelId,
        };

        // Submit to API
        $.ajax({
            url: apiEndpoint,
            method: 'POST',
            dataType: "json",
            data: {
                formData: $.param(formData),
                resourceId: resourceId,
                senderId: userId,
                sentFrom: 'customPage'
            },
            success: function (response) {
                console.log('API Response:', response);
                if (response.contactId > 0) {
                    console.log('Form submitted successfully!');

                    // Use data-redirect attribute for redirect URL
                    let redirectUrl = $button.data('redirect');

                    if (redirectUrl && isValidUrl(redirectUrl)) {
                        let separator = hasUrlParameters(redirectUrl) ? '&' : '?';
                        redirectUrl = `${redirectUrl}${separator}userId=${encodeURIComponent(userId)}&resourceId=${encodeURIComponent(resourceId)}&contactId=${encodeURIComponent(response.contactId)}`;
                        console.log('Redirecting to:', redirectUrl);
                        window.location.href = redirectUrl;
                    } else {
                        console.error('Invalid redirect URL (data-redirect missing or not a valid URL):', redirectUrl);
                        alert('Error: Invalid or missing redirect URL.');
                        $button.prop('disabled', false).text(originalButtonText);
                    }
                } else {
                    alert('Error: Invalid email used. Please try again');
                    console.error('No contact ID returned:', response);
                    $button.prop('disabled', false).text(originalButtonText);
                }
            },
            error: function (error) {
                alert('Error submitting the form. Please try again.');
                console.error('Form submission error:', error);
                console.error('Error response text:', error.responseText);
                $button.prop('disabled', false).text(originalButtonText);
            }
        });
    });
});
