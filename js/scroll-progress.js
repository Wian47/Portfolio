/**
 * Scroll progress indicator
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create the progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    document.body.appendChild(progressBar);
    
    // Update progress bar width on scroll
    window.addEventListener('scroll', function() {
        // Calculate how far down the page the user has scrolled
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        // Convert scroll position to percentage width
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        
        // Apply the percentage as the width of the progress bar
        progressBar.style.width = scrollPercentage + '%';
        
        // Show/hide based on scroll position
        if (scrollTop > 100) {
            progressBar.classList.add('visible');
        } else {
            progressBar.classList.remove('visible');
        }
    });
});
