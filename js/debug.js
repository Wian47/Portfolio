/**
 * Debug script to help identify and fix HTML errors
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug script loaded - checking for HTML issues...');
    
    // Track when all resources have loaded
    window.addEventListener('load', function() {
        console.log('All resources loaded - running final validation');
        validatePageStructure();
    });
    
    // Check for broken resources
    checkBrokenResources();
    
    // Check for script errors
    monitorJSErrors();
});

function checkBrokenResources() {
    // Check images once they've had a chance to load
    setTimeout(() => {
        document.querySelectorAll('img').forEach(img => {
            if (!img.complete || img.naturalHeight === 0) {
                console.error(`Image failed to load: ${img.src}`);
            }
        });
    }, 3000);
    
    // Check for CSS issues
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        // We can't reliably check if CSS loaded correctly in all browsers
        // So we'll just log the attempt
        console.log(`Stylesheet: ${link.href}`);
    });
}

function validatePageStructure() {
    // Check for missing required elements
    const requiredElements = ['header', 'main', 'footer'];
    requiredElements.forEach(tag => {
        if (!document.querySelector(tag)) {
            console.error(`Required element <${tag}> is missing from the page`);
        }
    });
    
    // Check for unclosed tags by looking for unexpected nesting
    checkForNestedHeadings();
    checkForMalformedLists();
    
    // Check for empty links or buttons
    document.querySelectorAll('a, button').forEach(element => {
        if (!element.innerText.trim() && !element.querySelector('img') && 
            !element.getAttribute('aria-label')) {
            console.warn(`Empty ${element.tagName} found without text or aria-label`);
        }
    });
    
    // Check for duplicate IDs
    const ids = {};
    let hasDuplicateIds = false;
    
    document.querySelectorAll('[id]').forEach(el => {
        const id = el.getAttribute('id');
        if (ids[id]) {
            console.error(`Duplicate ID detected: #${id}`);
            hasDuplicateIds = true;
        } else {
            ids[id] = true;
        }
    });
    
    if (!hasDuplicateIds) {
        console.log('✓ No duplicate IDs found');
    }
    
    // Check if document.querySelector returns multiple elements for one ID
    // (another way to detect ID duplicates)
    Object.keys(ids).forEach(id => {
        const elements = document.querySelectorAll(`#${id}`);
        if (elements.length > 1) {
            console.error(`ID #${id} is used on ${elements.length} elements`);
        }
    });
    
    // Check for accessibility issues
    checkAccessibility();
}

function checkForNestedHeadings() {
    // Check for headings nested within headings (a common error)
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        if (heading.querySelector('h1, h2, h3, h4, h5, h6')) {
            console.error('Heading element contains another heading - possible unclosed tag');
        }
    });
}

function checkForMalformedLists() {
    // Check for list items not inside a list
    document.querySelectorAll('li').forEach(li => {
        const parent = li.parentElement;
        if (parent.tagName !== 'UL' && parent.tagName !== 'OL') {
            console.error('Found <li> element not inside a <ul> or <ol>');
        }
    });
    
    // Check for empty lists
    document.querySelectorAll('ul, ol').forEach(list => {
        if (list.children.length === 0) {
            console.warn(`Empty ${list.tagName} found`);
        }
    });
}

function checkAccessibility() {
    // Check for images without alt text
    document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('alt')) {
            console.warn(`Image without alt text: ${img.src}`);
        }
    });
    
    // Check for form fields without labels
    document.querySelectorAll('input, textarea, select').forEach(field => {
        const id = field.id;
        if (id && !document.querySelector(`label[for="${id}"]`)) {
            console.warn(`Form field #${id} has no associated label`);
        }
    });
    
    // Check for proper heading hierarchy
    let lastHeadingLevel = 0;
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        
        // Check for skipped heading levels
        if (level > lastHeadingLevel + 1 && lastHeadingLevel !== 0) {
            console.warn(`Heading level skipped: from H${lastHeadingLevel} to H${level}`);
        }
        
        lastHeadingLevel = level;
    });
}

function monitorJSErrors() {
    // Track JavaScript errors
    window.addEventListener('error', function(e) {
        console.error('JavaScript error detected:', e.message, 'at', e.filename, ':', e.lineno);
    });
}

// Add a helper function to export a clean version of the HTML
window.getCleanHTML = function() {
    const clone = document.documentElement.cloneNode(true);
    
    // Remove scripts from the clone to avoid them in the output
    clone.querySelectorAll('script').forEach(script => script.remove());
    
    // Get the HTML as a string
    const html = clone.outerHTML;
    
    // Log it to console
    console.log('Clean HTML:', html);
    
    // You could also create a download link
    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clean-portfolio.html';
    a.textContent = 'Download Clean HTML';
    a.style.position = 'fixed';
    a.style.bottom = '10px';
    a.style.right = '10px';
    a.style.backgroundColor = '#3a86ff';
    a.style.color = 'white';
    a.style.padding = '10px 15px';
    a.style.borderRadius = '5px';
    a.style.textDecoration = 'none';
    a.style.zIndex = '9999';
    
    document.body.appendChild(a);
    
    return html;
};

// Add a message to let users know about the helper function
console.log('Debug tip: Run window.getCleanHTML() in the console to get a clean version of this page\'s HTML');
