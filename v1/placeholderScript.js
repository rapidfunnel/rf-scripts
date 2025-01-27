jQuery(function ($) {
  // This script is to replace placeholders for all links in the page.
  // Mainly targets replacing userId and contactId placeholders for any
  // links in the page.
  
  const parsedUrl = new URL(window.location.href);
  const userId = parsedUrl.searchParams.get('userId');
  const resourceId = parsedUrl.searchParams.get('resourceId');
  const contactId = parsedUrl.searchParams.get('contactId');

  // Log the extracted IDs to the console
  console.log('userId:', userId);
  console.log('resourceId:', resourceId);
  console.log('contactId:', contactId);

  // Iterate over all links on the page
  $('a').each(function () {
    // Get the original href attribute
    let href = $(this).attr('href');

    // Check if the href contains placeholders and replace them with actual values
    if (href) {
      href = href
        .replace('[user-id]', userId || '')
        .replace('[userId]', userId || '')
        .replace('[contactId]', contactId || '');

      // Set the updated href back to the link
      $(this).attr('href', href);
    }
  });
});
