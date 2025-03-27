jQuery(function ($) {
    // This is the next page that will be loaded when the form is submitted.
    // Leave this blank if you want to stay on this page
    
    const url = window.location.href;
    const parsedUrl = new URL(url);
    var userId = parsedUrl.searchParams.get('userId');
    var resourceId = parsedUrl.searchParams.get('resourceId');
    var contactId = parsedUrl.searchParams.get('contactId');

    // URL validation function
    function isValidUrl(url) {
        const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?$/;
        return urlPattern.test(url);
    }

    // Function to check if a URL has parameters
    function hasUrlParameters(url) {
        return url.includes("?");
    }

    $(document).ready(() => {
        if (nextPage && isValidUrl(nextPage)) {
            console.log('Next Page URL is valid:', nextPage);

            let RFparameters = "?userId=" + userId + "&resourceId=" + resourceId;
            if (hasUrlParameters(nextPage)) {
                console.log('Next Page URL already has parameters.');
                RFparameters = "&userId=" + userId + "&resourceId=" + resourceId;
            }

            // Set the next page target
            console.log('Next Page URL (Original)', $('#contactFormSubmitContainer').attr('data-redirect'));
            const submitContainer = document.getElementById("contactFormSubmitContainer");
            submitContainer.setAttribute("data-redirect", nextPage + RFparameters);
            console.log('Next Page URL (Updated)', $('#contactFormSubmitContainer').attr('data-redirect'));
        } else {
            console.error('Invalid nextPage URL:', nextPage);
            alert('Invalid nextPage URL detected!');
        }

        // If contactId exists, make an API call to get contact details and fill the form
        if (contactId) {
            $('#contactEmail').prop('disabled', true);  // Disable the email input field
            $('label[for="email"]').css('color', '#aaa');
            $.get(
                'https://apiv2.rapidfunnel.com/v2/contact-details/' + contactId,
                function (response) {
                    const contactData = response.data;
                    // Populate the form with contact details
                    $('.contactfirstname').val(contactData.firstName);
                    $('.contactlastname').val(contactData.lastName);
                    $('.contactemail').val(contactData.email);
                    $('.contactphone').val(contactData.phone);
                    $('.contactnote').val(contactData.note);
                }
            ).fail(function () {
                console.error('Cannot prefill form - API failure');
            });
        } else {
            console.log('Cannot prefill form - no contact ID specified');
        }
    });

    // Handle form submission
    $('#contactFormSubmitBtn').on('click', function (event) {
        event.preventDefault(); // Prevent the default form submission behavior
        $('#contactFormSubmitBtn').attr('disabled', false);
        var formData = 'firstName=' + document.getElementById('contactFirstName').value +
            '&lastName=' + document.getElementById('contactLastName').value +
            '&email=' + document.getElementById('contactEmail').value +
            '&phone=' + document.getElementById('contactPhone').value +
            '&campaign=' + campaignId +
            '&contactTag=' + labelId;
        // Submit the form data to the API
        $.ajax({
            url: 'https://my.rapidfunnel.com/landing/resource/create-custom-contact',
            method: 'POST',
            dataType: "json",
            data: {
                formData: formData,
                resourceId: resourceId,
                senderId: userId,
                sentFrom: 'customPage'
            },
            success: function (response) {
                console.log(response);
                if (response.contactId > 0) {
                    console.log('Form submitted successfully!');
                    let contactFormLink = $('#contactFormSubmitContainer').attr('data-redirect');
                    
                    if (contactFormLink) {
                        // Ensure contactId is from the response
                        contactFormLink = contactFormLink + "&contactId=" + response.contactId;
                        console.log('Next Page URL (with ContactID) = ', contactFormLink);
                        // Open the linked URL
                        window.location.href = contactFormLink;
                    }
                } else {
                    alert('Error: contact was not created');
                    console.log('ERROR: no contact ID returned');
                }
            },
            error: function (error) {
                alert('Error submitting the form.');
                console.error(error);
            },
        });
    });
});
