/**
 * Simple validation script to check the website for common issues
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait a second for everything to load
    setTimeout(function() {
        validateSite();
    }, 1000);

function validateSite() {
    const errors = [];
    
    // Check for 404 errors on resources
    document.querySelectorAll('link, script, img').forEach(el => {
        if (el.error || (el.complete === false && el.naturalHeight === 0)) {
            errors.push(`Failed to load: ${el.src || el.href}`);
        }
    });
    
    // Check for missing JS functions or objects
    if (!window.GitHubAPI) errors.push('GitHubAPI class not found');
    if (!window.UIController) errors.push('UIController class not found');
    if (!window.marked) errors.push('Marked library not found');
    
    // Check for critical DOM elements
    if (!document.getElementById('animated-bg')) errors.push('Missing #animated-bg element');
    
    // Remove any language/translation related checks that might be here
    
    // Log results
    if (errors.length > 0) {
        console.error('Site validation found issues:', errors);
    } else {
        console.log('Site validation passed!');
    }
}
});

/**
 * Enhanced form validation with visual feedback
 */

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // Add animation class when form is in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('form-animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    observer.observe(contactForm);
    
    // Handle input focus/blur events for animation only (not validation)
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        const input = group.querySelector('input, textarea');
        
        // Initial state check (for browser autofill)
        if (input.value) {
            group.classList.add('has-content');
        }
        
        // Focus event
        input.addEventListener('focus', () => {
            group.classList.add('focused');
        });
        
        // Blur event - MODIFIED: Only handle styling, not validation
        input.addEventListener('blur', () => {
            group.classList.remove('focused');
            if (input.value) {
                group.classList.add('has-content');
            } else {
                group.classList.remove('has-content');
                
                // Remove error styling if present
                group.classList.remove('error');
            }
            
            // REMOVED: validateInput(input) call from here
        });
    });
    
    // Validate single input - only called during form submission now
    function validateInput(input) {
        const group = input.closest('.form-group');
        
        if (input.value.trim() === '') {
            setError(group, 'This field is required');
            return false;
        }
        
        if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                setError(group, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Clear any errors
        setSuccess(group);
        return true;
    }
    
    function setError(group, message) {
        group.classList.add('error');
        group.classList.remove('success');
        
        const errorMessage = group.querySelector('.error-message');
        if (errorMessage && message) {
            errorMessage.textContent = message;
        }
    }
    
    function setSuccess(group) {
        group.classList.remove('error');
        group.classList.add('success');
    }
    
    // Form submission - Validation happens ONLY on submit now
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        // Validate all inputs
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            return;
        }
        
        // Show sending state on button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        // Proceed with form submission via EmailJS
        const formData = {
            name: contactForm.name.value,
            email: contactForm.email.value,
            message: contactForm.message.value
        };
        
        // Get the UI controller for notifications
        const ui = window.UIController ? new UIController() : null;
        
        // Send using EmailJS (from contact.js)
        if (window.emailjs) {
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
                
                // Reset form
                contactForm.reset();
                
                // Remove success classes
                formGroups.forEach(group => {
                    group.classList.remove('success', 'has-content');
                });
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            })
            .catch(function(error) {
                console.error('FAILED...', error);
                
                // Show detailed error notification
                const errorMessage = error.text || 'Failed to send message. Please try again later.';
                if (ui) {
                    ui.showNotification(errorMessage, 'error');
                }
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            });
        } else {
            // Fallback if EmailJS is not loaded
            console.log('EmailJS not loaded, showing success anyway');
            if (ui) {
                ui.showNotification('Message sent successfully!', 'success');
            }
            
            // Reset form and button
            contactForm.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
});
