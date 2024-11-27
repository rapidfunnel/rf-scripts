jQuery(function ($) {
  // Request Call Component
  // Parse the URL to extract userId, resourceID, and contactId
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');
  const numericUserId = Number(userId);

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

    // del
  let requestCallFormLink = $('#requestCallForm form').attr('redirect') || $('#requestCallForm form').data('redirect');
  if (requestCallFormLink) {
    // Format the redirect URL with the dynamic values
    requestCallFormLink = requestCallFormLink
      .replace('[user-id]', userId || '')
      .replace('[resourceID]', resourceId || '')
      .replace('[contactId]', contactId || '');
    
    console.log('Formatted Redirect URL:', requestCallFormLink);

    // Remove redirect attributes immediately to prevent Webflow's default behavior
    $('#requestCallForm form').removeAttr('redirect').removeAttr('data-redirect');
  } else {
      console.log('not found');
    }
  // del
    
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
      },
      error: function (xhr, status, error) {
        console.error('Request Call email failed', error);
      }
    });
  }

  $('#requestCallBtn').on('click', requestCallButtonSubmit);
  $('#requestForm').on('submit', function (event) {
    // del
event.preventDefault(); // Prevent the default form submission behavior
    // del
    requestCallFormSubmit();
  });
});
