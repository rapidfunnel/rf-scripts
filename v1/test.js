(function() {
    'use strict';
    
    console.log('═══════════════════════════════════════════════════');
    console.log('SCRIPT 2: CONTACT CREATION SCRIPT LOADING');
    console.log('═══════════════════════════════════════════════════');
    
    // Check if validation was completed before this script loaded
    if (!window.validationComplete) {
        console.error('❌ ERROR: Contact creation script loaded but validation was not completed!');
        console.error('This script should only be loaded after validation passes.');
        return;
    }
    
    console.log('✓ Validation confirmed complete - initializing contact creation script');
    
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
        console.log('═══════════════════════════════════════════════════');
        console.log('SCRIPT 2: CONTACT CREATION FUNCTION CALLED');
        console.log('═══════════════════════════════════════════════════');
        console.log('Timestamp:', new Date().toISOString());
        
        // CRITICAL: Double-check validation is complete
        if (!window.validationComplete || !window.VALIDATION_PASSED) {
            console.error('❌ CRITICAL ERROR: Validation not complete! Cannot create contact.');
            console.error('validationComplete:', window.validationComplete);
            console.error('VALIDATION_PASSED:', window.VALIDATION_PASSED);
            alert('Validation error. Please try submitting the form again.');
            return;
        }
        
        console.log('✓ Validation status confirmed - proceeding with contact creation');
        
        // Prevent double submission
        if (isSubmitting) {
            console.log('⚠ Contact creation already in progress');
            return;
        }
        
        isSubmitting = true;
        console.log('✓ Submission flag set - preventing duplicates');
        
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
        
        // Find submit button and disable it
        const form = document.querySelector('.form-container form');
        const submitButton = form ? form.querySelector('button[type="submit"], input[type="submit"]') : null;
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            console.log('✓ Submit button disabled');
        }
        
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
                window.validationComplete = false;
                window.VALIDATION_PASSED = false;
                
                console.log('═══════════════════════════════════════════════════');
                console.log('API REQUEST SUCCESS');
                console.log('═══════════════════════════════════════════════════');
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
                        if (submitButton) {
                            submitButton.disabled = false;
                            submitButton.textContent = 'Submit';
                        }
                        
                        // Clear form
                        document.getElementById('contactFirstName').value = '';
                        document.getElementById('contactLastName').value = '';
                        document.getElementById('contactEmail').value = '';
                        document.getElementById('contactPhone').value = '';
                    }
                } else {
                    console.error('❌ Contact was not created - invalid response');
                    alert('Error: Contact was not created. Please try again.');
                    
                    // Re-enable button
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Submit';
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                isSubmitting = false;
                window.isValidating = false;
                window.validationComplete = false;
                window.VALIDATION_PASSED = false;
                
                console.error('═══════════════════════════════════════════════════');
                console.error('API REQUEST FAILED');
                console.error('═══════════════════════════════════════════════════');
                console.error('Status:', textStatus);
                console.error('Error:', errorThrown);
                console.error('Response:', jqXHR.responseText);
                
                alert('Error submitting the form. Please try again.');
                
                // Re-enable button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Submit';
                }
            }
        });
    };
    
    console.log('✓ createContactAfterValidation function registered globally');
    console.log('═══════════════════════════════════════════════════');
    console.log('SCRIPT 2: CONTACT CREATION SCRIPT FULLY LOADED');
    console.log('═══════════════════════════════════════════════════');
    
})();
