/**
 * Contact form functionality using EmailJS
 * This allows sending emails directly from client-side JavaScript
 */

// Initialize EmailJS
(function() {
    // Your EmailJS public key (safe to use in client-side code)
    emailjs.init("4F02P50JDBS8LDFsU", {
        // Add this options object to handle GitHub Pages domain
        publicKey: "4F02P50JDBS8LDFsU",
        blockHeadless: false, // Important for cross-domain use
        limitRate: { // Add rate limiting to prevent spam
            throttle: 1000 // 1 second between API calls
        }
    });
})();

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get the UI controller for notifications
            const ui = window.UIController ? new UIController() : null;
            
            // Show sending message
            if (ui) {
                ui.showNotification('Sending your message...', 'info');
            }
            
            // Collect form data
            const formData = {
                name: contactForm.name.value,
                email: contactForm.email.value,
                message: contactForm.message.value
            };
            
            console.log('About to send email with:', {
                serviceID: 'service_y7wr6qt',
                templateID: 'template_agks10o',
                templateParams: {
                    from_name: formData.name,
                    reply_to: formData.email,
                    message: formData.message
                }
            });
            
            // Send the email using EmailJS
            emailjs.send('service_y7wr6qt', 'template_agks10o', {
                from_name: formData.name,
                reply_to: formData.email,
                message: formData.message
            })
            .then(function(response) {
                console.log('SUCCESS!', response.status, response.text);
                
                // Show success notification
                if (ui) {
                    ui.showNotification('Message sent successfully!', 'success');
                }
                
                // Reset the form
                contactForm.reset();
            })
            .catch(function(error) {
                console.error('FAILED...', error);
                
                // Show detailed error notification
                const errorMessage = error.text || 'Failed to send message. Please try again later.';
                if (ui) {
                    ui.showNotification(errorMessage, 'error');
                }
            });
        });
    }
});
