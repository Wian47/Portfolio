/**
 * Contact form functionality using EmailJS
 * This allows sending emails directly from client-side JavaScript
 */

// Initialize EmailJS
(function() {
    // Your EmailJS public key (safe to use in client-side code)
    emailjs.init("4F02P50JDBS8LDFsU"); // Replace with your actual public key after signing up
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
                console.log('FAILED...', error);
                
                // Show error notification
                if (ui) {
                    ui.showNotification('Failed to send message. Please try again later.', 'error');
                }
            });
        });
    }
});
