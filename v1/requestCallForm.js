jQuery(function ($) {
  // Request Call Component
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');
  const numericUserId = Number(userId);

  // $('.error-message.w-form-fail').hide();
  // $('.error-message.w-form-fail').css('visibility', 'hidden');
  // $('.error-message.w-form-fail').css('display', 'none');

  if(contactId) {
    $('#requestCallForm').hide();
  } else {
    $('#requestCallBtn').hide();
  }

  function requestCallButtonSubmit() {
    // Called for known contact
    if(contactId) {
      $.get(
      'https://apiv2.rapidfunnel.com/v2/contact-details/' + contactId,
      function (response) {
        const contactData = response.data;
        // Make a POST request with contactData to send request call email to user
        $.ajax({
          url: 'https://app.rapidfunnel.com/api/mail/send-request-call-email',
          type: 'POST',
          contentType: 'application/json',
          dataType: "json",
          data: JSON.stringify({
            legacyUserId: numericUserId,
            contactFirstName: contactData.firstName,
            contactLastName: contactData.lastName,
            contactPhoneNumber: contactData.phone,
            requestCallSourcePage: resourceDescriptionForRequestCall
          }),
          success: function (response) {
            console.log('Request Call email sent successfully', response);
          },
          error: function (xhr, status, error) {
            console.error('Request Call email failed', error);
          }
        });
      }
      ).fail(function () {
        console.error('Failed to fetch contact details.');
      });
    }
  }

  function requestCallFormSubmit() {
      const contactFirstName = $('#contactFirstNameRequestForm').val();
      const contactLastName = $('#contactLastNameRequestForm').val();
      const contactPhoneNumber = $('#contactPhoneRequestForm').val();
    
      $.ajax({
      url: 'https://app.rapidfunnel.com/api/mail/send-request-call-email',
      type: 'POST',
      contentType: 'application/json',
      dataType: "json",
      data: JSON.stringify({
        legacyUserId: numericUserId,
        contactFirstName: contactFirstName,
        contactLastName: contactLastName,
        contactPhoneNumber: contactPhoneNumber,
        requestCallSourcePage: resourceDescriptionForRequestCall
      }),
      success: function (response) {
        console.log('Request Call email sent successfully', response);
        $('#requestForm .w-form-done').show(); 
        $('#requestForm .w-form-fail').hide();
      },
      error: function (xhr, status, error) {
        console.error('Request Call email failed', error);
        $('#requestForm .w-form-done').hide(); 
        $('#requestForm .w-form-fail').show();
      }
    });
  }

  $('#requestCallBtn').on('click', requestCallButtonSubmit);
  $('#requestForm form').on('submit', function (event) {
    event.preventDefault();
    $('#requestForm .w-form-done').hide(); 
    $('#requestForm .w-form-fail').hide();
    requestCallFormSubmit();
  });
});
