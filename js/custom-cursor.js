document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing custom cursor");
    
    // Create cursor dot
    const cursor = document.createElement('div');
    cursor.classList.add('cursor-dot');
    document.body.appendChild(cursor);
    
    // Update cursor position
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Handle cursor visibility
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
    });
    
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });

    // Disable on touch devices
    if ('ontouchstart' in window) {
        cursor.style.display = 'none';
        document.body.style.cursor = 'auto';
    }

    // Add hover effect to all interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .btn, .project-card, .filter-btn, input[type="submit"], .nav-link, .mobile-toggle, [role="button"]');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
        
        // Ensure cursor:none is maintained
        el.addEventListener('mouseover', () => {
            el.style.cursor = 'none';
        });
    });
    
    // Hide cursor when mouse leaves window
    document.addEventListener('mouseleave', () => {
        cursor.style.display = 'none';
    });
    
    document.addEventListener('mouseenter', () => {
        cursor.style.display = 'block';
    });

    // Force cursor:none on all new elements added to the DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        node.style.cursor = 'none';
                        const elements = node.getElementsByTagName('*');
                        Array.from(elements).forEach(el => {
                            el.style.cursor = 'none';
                        });
                    }
                });
            }
        });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
});
