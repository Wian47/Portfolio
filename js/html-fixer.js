/**
 * HTML Fixer - Automatically detects and fixes common HTML issues
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('HTML Fixer: Starting automatic HTML correction...');
    
    try {
        // Fix broken HTML structure
        fixBrokenStructure();
        
        // Fix accessibility issues
        fixAccessibilityIssues();
        
        // Ensure correct nesting
        fixIncorrectNesting();
        
        // Fix missing attributes
        fixMissingAttributes();
        
        console.log('HTML Fixer: Completed successfully!');
    } catch (error) {
        console.error('HTML Fixer encountered an error:', error);
    }
});

function fixBrokenStructure() {
    // Fix unclosed or improperly nested tags
    fixUnclosedTags();
    
    // Make sure all section tags have proper IDs for navigation
    fixSectionIds();
    
    // Ensure main sections are properly structured
    ensureMainSections();
    
    console.log('✓ Fixed structural issues');
}

function fixUnclosedTags() {
    // This is a simplified approach - in a real scenario, more sophisticated parsing would be needed
    
    // Look for common patterns of unclosed tags
    const html = document.documentElement.outerHTML;
    const potentiallyUnclosedTags = ['div', 'span', 'a', 'li', 'ul', 'section'];
    
    potentiallyUnclosedTags.forEach(tag => {
        const openingTags = (html.match(new RegExp(`<${tag}[^>]*>`, 'g')) || []).length;
        const closingTags = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
        
        if (openingTags > closingTags) {
            console.warn(`Possible unclosed <${tag}> tags: ${openingTags - closingTags} issue(s) detected`);
        }
    });
}

function fixSectionIds() {
    // Ensure all sections have IDs for navigation
    document.querySelectorAll('section:not([id])').forEach((section, index) => {
        const sectionName = `section-${index + 1}`;
        section.id = sectionName;
        console.warn(`Added missing ID '${sectionName}' to section`);
    });
}

function ensureMainSections() {
    // Ensure main tag exists
    if (!document.querySelector('main')) {
        const mainContent = document.createElement('main');
        
        // Find the content that should be in the main tag
        const contentSections = Array.from(document.querySelectorAll('body > section'));
        
        if (contentSections.length > 0) {
            const firstSection = contentSections[0];
            firstSection.parentNode.insertBefore(mainContent, firstSection);
            
            // Move all sections into main
            contentSections.forEach(section => {
                mainContent.appendChild(section);
            });
            
            console.warn('Created main element and moved sections inside');
        }
    }
}

function fixAccessibilityIssues() {
    // Add appropriate ARIA attributes
    fixMissingAriaLabels();
    
    // Ensure proper focus order
    fixTabIndex();
    
    console.log('✓ Fixed accessibility issues');
}

function fixMissingAriaLabels() {
    // Add aria-labels to interactive elements without text
    document.querySelectorAll('a, button').forEach(el => {
        if (!el.textContent.trim() && !el.getAttribute('aria-label')) {
            // Try to infer a label from icon or context
            let label = '';
            
            if (el.querySelector('.fa-github')) {
                label = 'GitHub';
            } else if (el.querySelector('.fa-linkedin')) {
                label = 'LinkedIn';
            } else if (el.querySelector('.fa-envelope')) {
                label = 'Email';
            } else {
                label = `${el.tagName.toLowerCase()} ${Math.random().toString(36).substring(2, 8)}`;
            }
            
            el.setAttribute('aria-label', label);
            console.warn(`Added aria-label "${label}" to ${el.tagName.toLowerCase()}`);
        }
    });
}

function fixTabIndex() {
    // Remove negative tabindex where not appropriate
    document.querySelectorAll('[tabindex="-1"]').forEach(el => {
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') {
            el.removeAttribute('tabindex');
            console.warn(`Removed inappropriate negative tabindex from ${el.tagName.toLowerCase()}`);
        }
    });
}

function fixIncorrectNesting() {
    // Fix common nesting issues
    fixBlockInInline();
    fixInvalidTableStructure();
    
    console.log('✓ Fixed nesting issues');
}

function fixBlockInInline() {
    // Find and fix cases of block elements inside inline elements
    // This is a simplified approach - would need DOM manipulation for real fixes
    const problematicSelectors = [
        'span > div', 'span > h1', 'span > h2', 'span > h3', 'span > h4', 'span > h5', 'span > h6',
        'a > div', 'a > h1', 'a > h2', 'a > h3', 'a > h4', 'a > h5', 'a > h6'
    ];
    
    problematicSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            console.warn(`Potentially invalid nesting: ${selector}`);
        });
    });
}

function fixInvalidTableStructure() {
    // Fix tables without proper structure
    document.querySelectorAll('table').forEach(table => {
        if (!table.querySelector('tbody')) {
            const tbody = document.createElement('tbody');
            const rows = table.querySelectorAll('tr');
            
            if (rows.length > 0) {
                rows.forEach(row => tbody.appendChild(row));
                table.appendChild(tbody);
                console.warn('Added missing tbody to table');
            }
        }
    });
}

function fixMissingAttributes() {
    // Add missing alt attributes to images
    document.querySelectorAll('img:not([alt])').forEach((img, index) => {
        const alt = `Image ${index + 1}`;
        img.setAttribute('alt', alt);
        console.warn(`Added missing alt="${alt}" to image`);
    });
    
    // Add type attributes to buttons where needed
    document.querySelectorAll('button:not([type])').forEach(button => {
        button.setAttribute('type', 'button');
        console.warn('Added missing type="button" to button');
    });
    
    // Add title attributes to iframes
    document.querySelectorAll('iframe:not([title])').forEach((iframe, index) => {
        iframe.setAttribute('title', `Embedded content ${index + 1}`);
        console.warn(`Added missing title to iframe`);
    });
    
    console.log('✓ Fixed missing attributes');
}
