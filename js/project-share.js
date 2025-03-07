/**
 * Project sharing functionality
 * Handles Web Share API and click events for share buttons
 */

document.addEventListener('DOMContentLoaded', function() {
    // Listen for project modal openings and initialize share buttons
    const projectModal = document.getElementById('project-modal');
    
    if (projectModal) {
        projectModal.addEventListener('click', function(e) {
            // Find the web share button if it was clicked
            if (e.target.closest('#web-share-btn')) {
                e.preventDefault();
                handleWebShare(projectModal);
            }
        });
    }
    
    function handleWebShare(modal) {
        // Get project information from the modal
        const projectTitle = modal.querySelector('h2')?.textContent || 'Check out this project';
        const projectDesc = modal.querySelector('.modal-description p')?.textContent || 'An interesting project';
        
        // Try to find the project URL from GitHub or homepage links
        const githubLink = modal.querySelector('.modal-actions a[href*="github.com"]');
        const homepageLink = modal.querySelector('.modal-actions a:not([href*="github.com"])');
        const projectUrl = homepageLink?.href || githubLink?.href || window.location.href;
        
        // Check if Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: projectTitle,
                text: projectDesc,
                url: projectUrl
            }).then(() => {
                console.log('Project shared successfully');
            }).catch((error) => {
                console.error('Error sharing project:', error);
            });
        } else {
            // Fallback - copy link to clipboard
            navigator.clipboard.writeText(projectUrl).then(() => {
                // Show notification
                const ui = window.UIController ? new UIController() : null;
                if (ui) {
                    ui.showNotification('Link copied to clipboard!', 'success');
                } else {
                    alert('Link copied to clipboard!');
                }
            });
        }
    }
});
