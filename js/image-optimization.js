// Image lazy loading and optimization
document.addEventListener('DOMContentLoaded', function() {
    // Apply lazy loading to all images with data-src attribute
    applyLazyLoading();
    
    // Call optimizeProjectImages to ensure project images are properly loaded
    setTimeout(optimizeProjectImages, 500);
});

// Apply lazy loading to images
function applyLazyLoading() {
    // Get all images with data-src attribute
    const images = document.querySelectorAll('img[data-src]');
    console.log(`Found ${images.length} images with data-src attribute`);
    
    // Check for native lazy loading support
    if ('loading' in HTMLImageElement.prototype) {
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.loading = 'lazy';
                img.decoding = 'async';
                console.log(`Applied native lazy loading to: ${img.dataset.src}`);
            }
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
        
        // Add lazysizes classes
        images.forEach(img => {
            img.classList.add('lazyload');
            console.log(`Applied lazysizes to: ${img.dataset.src}`);
        });
    }
}

// Optimize project images loading
function optimizeProjectImages() {
    console.log('Running optimizeProjectImages()');
    const projectCards = document.querySelectorAll('.project-card img');
    console.log(`Found ${projectCards.length} project images`);
    
    projectCards.forEach((img, index) => {
        // Ensure image has lazy loading attributes
        img.loading = 'lazy';
        img.decoding = 'async';
        
        // Debug info
        console.log(`Project image ${index}: src = ${img.src}, data-src = ${img.dataset.src}`);
        
        // Fix missing data-src by setting it from src if needed
        if (!img.dataset.src && img.src) {
            img.dataset.src = img.src;
            console.log(`Added missing data-src to project image: ${img.src}`);
        }
        
        // Add srcset for responsive images if src or data-src exists
        const imageSrc = img.dataset.src || img.src;
        if (imageSrc) {
            // Don't replace if the source doesn't end with .jpg
            if (imageSrc.toLowerCase().endsWith('.jpg')) {
                img.srcset = `
                    ${imageSrc.replace('.jpg', '-small.jpg')} 300w,
                    ${imageSrc.replace('.jpg', '-medium.jpg')} 600w,
                    ${imageSrc} 1200w
                `;
                img.sizes = '(max-width: 768px) 100vw, 50vw';
                console.log(`Applied srcset to: ${imageSrc}`);
            } else if (imageSrc.toLowerCase().endsWith('.png')) {
                // For PNG files, just use the original image
                console.log(`Keeping original PNG without srcset: ${imageSrc}`);
            }
        }
        
        // Fix any missing src by copying from data-src
        if (!img.src && img.dataset.src) {
            img.src = img.dataset.src;
            console.log(`Applied missing src from data-src: ${img.dataset.src}`);
        }
    });
}

// Add a global error handler for images
window.addEventListener('DOMContentLoaded', function() {
    // Add global error handler for images
    document.addEventListener('error', function(e) {
        if (e.target.tagName.toLowerCase() === 'img') {
            console.log(`Image failed to load: ${e.target.src}`);
            
            // Check if it's a project image
            if (e.target.closest('.project-card')) {
                const repoName = e.target.getAttribute('alt') || '';
                console.log(`Attempting fallback for project image: ${repoName}`);
                
                // Try to use the ProjectImages utility if available
                if (window.ProjectImages) {
                    const category = e.target.dataset.category || 'code';
                    window.projectImageErrorHandler(e.target, repoName, category);
                } else {
                    // Basic fallback - use a generic placeholder
                    e.target.src = 'assets/projects/default-code.jpg';
                }
            }
        }
    }, true);
    
    // Run optimizeProjectImages periodically to catch any dynamically loaded content
    setTimeout(optimizeProjectImages, 1000);
    setTimeout(optimizeProjectImages, 3000);
});