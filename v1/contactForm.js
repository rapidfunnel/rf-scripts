jQuery(function ($) {
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  // const params = parsedUrl.search.split('/');
  // const userId = params[1]; // Extract the userId
  // const resourceId = params[2]; // Extract the resourceID
  // const contactId = params[3]; // Extract the contactId

  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');

  console.log('User ID: ' + userId);
  console.log('Resource ID: ' + resourceId);
  console.log('Contact ID: ' + contactId);

  // If contactId exists, make an API call to get contact details
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
      console.error('Failed to fetch contact details.');
    });
  } else {
    console.log('No contactId found in the URL.');
  }

  function todayDate() {
    const today = new Date();
    return today.toISOString();
  }

  // Handle form submission
  $('#contactForm').on('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    $(':button').attr('disabled', true);

    // Get additional attributes from the form
    const contactForm = $('#contactForm');
    const formData = 'firstName=' + document.getElementById('contactFirstName').value +
          '&lastName=' + document.getElementById('contactLastName').value +
          '&email=' + document.getElementById('contactEmail').value +
          '&phone=' + document.getElementById('contactPhone').value;

    
          // '&note=' + document.getElementById('contactNote').value +
          // '&noteTimeStamps[]=' + todayDate();

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
          alert('Form submitted successfully!');
        } else {
          alert('A contact could not be added!');
        }
      },
      error: function (error) {
        alert('Error submitting the form.');
        console.error(error);
      },
    });
  });
});
