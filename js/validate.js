/**
 * Simple validation script to check the website for common issues
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait a second for everything to load
    setTimeout(function() {
        validateSite();
    }, 1000);
});

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
    if (!document.getElementById('projects-container')) errors.push('Missing #projects-container element');
    
    // Log results
    if (errors.length > 0) {
        console.error('Site validation found issues:', errors);
    } else {
        console.log('Site validation passed!');
    }
}
