(function() {
    'use strict';
    
    console.log('=== SCRIPT 2: CONTACT CREATION LOADED ===');
    
    let isSubmitting = false;
    
    // URL validation function
    function isValidUrl(url) {
        const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?$/;
        return urlPattern.test(url);
    }
    
    // Function to check if a URL has parameters
    function hasUrlParameters(url) {
        return url.includes("?");
    }
    
    // Helper function to safely get attribute value
    function getDataAttribute($element, attrName) {
        if ($element.length === 0) {
            console.error('Element not found when trying to get attribute:', attrName);
            return null;
        }
        
        const value = $element.attr(attrName);
        
        if (!value || value === 'undefined' || value.trim() === '') {
            console.warn(`Attribute '${attrName}' is missing, empty, or undefined`);
            return null;
        }
        
        return value;
    }
    
    // Main contact creation function - exposed globally
    window.createContactAfterValidation = function() {
        console.log('=== SCRIPT 2: CONTACT CREATION STARTED ===');
        console.log('Timestamp:', new Date().toISOString());
        
        // Prevent double submission
        if (isSubmitting) {
            console.log('⚠ Contact creation already in progress');
            return;
        }
        
        isSubmitting = true;
        
        // Get URL parameters
        const url = window.location.href;
        const parsedUrl = new URL(url);
        const userId = parsedUrl.searchParams.get('userId');
        const resourceId = parsedUrl.searchParams.get('resourceId');
        
        console.log('URL Parameters:', { userId, resourceId });
        
        // Get the container element
        const $container = jQuery('#contactFormContainer');
        
        if ($container.length === 0) {
            console.error('CRITICAL ERROR: contactFormContainer not found');
            alert('Form configuration error. Please contact support.');
            isSubmitting = false;
            window.isValidating = false;
            return;
        }
        
        console.log('✓ Container element found');
        
        // Get campaign and label IDs
        let campaignId = $container.attr('data-campaign');
        let labelId = $container.attr('data-label');
        
        console.log('Initial values:', { campaignId, labelId });
        
        // Try alternative methods if not found
        if (!campaignId || campaignId === 'undefined') {
            campaignId = $container[0].getAttribute('data-campaign') || $container.data('campaign');
        }
        if (!labelId || labelId === 'undefined') {
            labelId = $container[0].getAttribute('data-label') || $container.data('label');
        }
        
        console.log('Final values:', { campaignId, labelId });
        
        // Validate campaign ID
        if (!campaignId || campaignId === 'undefined' || campaignId === 'null' || campaignId === 'YOUR_CAMPAIGN_ID') {
            console.error('❌ ERROR: Campaign ID is invalid');
            alert('Form configuration error: Campaign ID is missing or invalid.');
            isSubmitting = false;
            window.isValidating = false;
            return;
        }
        
        console.log('✓ Campaign ID is valid');
        
        // Handle undefined label ID
        if (!labelId || labelId === 'undefined' || labelId === 'null' || labelId === 'YOUR_LABEL_ID') {
            console.warn('⚠ WARNING: Label ID is missing, using empty string');
            labelId = '';
        }
        
        // Get form field values
        const firstName = document.getElementById('contactFirstName').value.trim();
        const lastName = document.getElementById('contactLastName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();
        
        console.log('Form data collected:', { firstName, lastName, email, phone });
        
        // Disable button and show spinner
        jQuery('#contactFormSubmitBtn').attr('disabled', true).addClass('loading');
        jQuery('.btn-text').hide();
        jQuery('.spinner').show();
        
        console.log('✓ Button disabled, spinner shown');
        
        // Build form data
        const formData = 'firstName=' + encodeURIComponent(firstName) +
            '&lastName=' + encodeURIComponent(lastName) +
            '&email=' + encodeURIComponent(email) +
            '&phone=' + encodeURIComponent(phone) +
            '&campaign=' + encodeURIComponent(campaignId) +
            '&contactTag=' + encodeURIComponent(labelId);
        
        const submissionData = {
            formData: formData,
            resourceId: resourceId,
            senderId: userId,
            sentFrom: 'customPage'
        };
        
        console.log('Submission payload prepared:', submissionData);
        console.log('🚀 SENDING API REQUEST...');
        
        // Submit to API
        jQuery.ajax({
            url: 'https://my.rapidfunnel.com/landing/resource/create-custom-contact',
            method: 'POST',
            dataType: 'json',
            data: submissionData,
            success: function(response) {
                isSubmitting = false;
                window.isValidating = false;
                
                console.log('=== API REQUEST SUCCESS ===');
                console.log('Response:', response);
                
                if (response.contactId > 0) {
                    console.log('✅ Contact created successfully! Contact ID:', response.contactId);
                    
                    // Get redirect URL
                    let redirectUrl = $container.attr('data-redirect');
                    
                    if (redirectUrl && redirectUrl !== 'undefined' && redirectUrl !== 'YOUR_REDIRECT_URL' && isValidUrl(redirectUrl)) {
                        const separator = hasUrlParameters(redirectUrl) ? '&' : '?';
                        redirectUrl = redirectUrl + separator + 
                                     'userId=' + userId + 
                                     '&resourceId=' + resourceId + 
                                     '&contactId=' + response.contactId;
                        
                        console.log('Redirecting to:', redirectUrl);
                        window.location.href = redirectUrl;
                    } else {
                        console.log('No valid redirect URL, staying on page');
                        alert('Form submitted successfully!');
                        
                        // Re-enable button
                        jQuery('#contactFormSubmitBtn').attr('disabled', false).removeClass('loading');
                        jQuery('.btn-text').show();
                        jQuery('.spinner').hide();
                        
                        // Clear form
                        document.getElementById('contactFirstName').value = '';
                        document.getElementById('contactLastName').value = '';
                        document.getElementById('contactEmail').value = '';
                        document.getElementById('contactPhone').value = '';
                        document.getElementById('gdprConsent').checked = false;
                        document.getElementById('marketingConsent').checked = false;
                    }
                } else {
                    console.error('❌ Contact was not created - invalid response');
                    alert('Error: Contact was not created. Please try again.');
                    
                    // Re-enable button
                    jQuery('#contactFormSubmitBtn').attr('disabled', false).removeClass('loading');
                    jQuery('.btn-text').show();
                    jQuery('.spinner').hide();
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                isSubmitting = false;
                window.isValidating = false;
                
                console.error('=== API REQUEST FAILED ===');
                console.error('Status:', textStatus);
                console.error('Error:', errorThrown);
                console.error('Response:', jqXHR.responseText);
                
                alert('Error submitting the form. Please try again.');
                
                // Re-enable button
                jQuery('#contactFormSubmitBtn').attr('disabled', false).removeClass('loading');
                jQuery('.btn-text').show();
                jQuery('.spinner').hide();
            }
        });
    };
    
    console.log('✓ createContactAfterValidation function registered globally');
    
})();
