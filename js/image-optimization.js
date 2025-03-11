// Image lazy loading and optimization
document.addEventListener('DOMContentLoaded', function() {
    // Convert images to WebP format where supported
    const images = document.querySelectorAll('img[data-src]');
    
    // Check for native lazy loading support
    if ('loading' in HTMLImageElement.prototype) {
        images.forEach(img => {
            img.src = img.dataset.src;
            img.loading = 'lazy';
            img.decoding = 'async';
            // Add blur-up loading effect
            img.style.filter = 'blur(5px)';
            img.onload = () => {
                img.style.filter = 'none';
                img.style.transition = 'filter 0.3s ease-out';
            };
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }
});

// Optimize project images loading
function optimizeProjectImages() {
    const projectCards = document.querySelectorAll('.project-card img');
    projectCards.forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
        // Add srcset for responsive images
        if (img.dataset.src) {
            img.srcset = `
                ${img.dataset.src.replace('.jpg', '-small.jpg')} 300w,
                ${img.dataset.src.replace('.jpg', '-medium.jpg')} 600w,
                ${img.dataset.src} 1200w
            `;
            img.sizes = '(max-width: 768px) 100vw, 50vw';
        }
    });
}