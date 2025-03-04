/**
 * Completely revised tooltip positioning to fix centering issue
 */

document.addEventListener('DOMContentLoaded', function() {
    // Tech descriptions
    const techData = {
        python: {
            title: "Python",
            description: "A versatile programming language known for its readability and ease of use. Great for automation, data analysis, web development, and security scripting.",
            link: "https://www.python.org/"
        },
        javascript: {
            title: "JavaScript",
            description: "The programming language of the web that enables interactive websites. It's essential for front-end development and can also be used for server-side programming with Node.js.",
            link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
        },
        flutter: {
            title: "Flutter/Dart",
            description: "Google's UI toolkit for building natively compiled applications for mobile, web, and desktop from a single codebase, using the Dart language.",
            link: "https://flutter.dev/"
        },
        git: {
            title: "Git",
            description: "A distributed version control system that tracks changes in source code during software development, facilitating collaboration between developers.",
            link: "https://git-scm.com/"
        },
        html: {
            title: "HTML5",
            description: "The standard markup language for web pages, providing the structure and content. HTML5 adds features like video, audio, and canvas elements.",
            link: "https://developer.mozilla.org/en-US/docs/Web/HTML"
        },
        css: {
            title: "CSS3",
            description: "Cascading Style Sheets that describe how HTML elements should be displayed. CSS3 introduces advanced features like animations, flexbox, and grid layouts.",
            link: "https://developer.mozilla.org/en-US/docs/Web/CSS"
        },
        react: {
            title: "React",
            description: "A JavaScript library for building user interfaces, particularly single-page applications. It's used for handling the view layer in web and mobile apps.",
            link: "https://reactjs.org/"
        },
        linux: {
            title: "Linux",
            description: "A family of open-source Unix-like operating systems based on the Linux kernel. Essential for servers and cybersecurity professionals.",
            link: "https://www.linux.org/"
        },
        security: {
            title: "Security",
            description: "Practices and technologies that protect systems, networks, and data from cyber threats and unauthorized access. Key focus for preventing vulnerabilities.",
            link: "https://www.sans.org/cybersecurity/"
        },
        networking: {
            title: "Networking",
            description: "The practice of connecting computers and devices to share resources. Fundamental knowledge for understanding how systems communicate securely.",
            link: "https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html"
        },
        sql: {
            title: "SQL",
            description: "Structured Query Language used to communicate with and manipulate databases. Essential for data management and security in applications.",
            link: "https://www.w3schools.com/sql/"
        }
    };
    
    // DOM elements
    const techItems = document.querySelectorAll('.tech-item');
    const tooltip = document.getElementById('tech-tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipDescription = document.getElementById('tooltip-description');
    const tooltipLink = document.getElementById('tooltip-link');
    const closeTooltip = document.getElementById('close-tooltip');
    const tooltipOverlay = document.querySelector('.tooltip-overlay');
    
    // Initial variables
    let activeTech = null;
    let activeItem = null;
    
    // Completely rewritten positioning function with guaranteed centering
    function positionTooltip(techItem) {
        // Get dimensions and positions
        const rect = techItem.getBoundingClientRect();
        const tooltipWidth = 280; // Fixed tooltip width
        
        // Calculate exact center position of tech item
        const buttonCenter = rect.left + (rect.width / 2);
        
        // Force tooltip's horizontal center to align with button's center
        tooltip.style.position = 'fixed';
        tooltip.style.width = tooltipWidth + 'px';
        tooltip.style.left = (buttonCenter - (tooltipWidth/2)) + 'px';
        
        // Adjust if tooltip goes off screen edges
        const tooltipLeft = parseFloat(tooltip.style.left);
        if (tooltipLeft < 10) {
            tooltip.style.left = '10px';
        } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
            tooltip.style.left = (window.innerWidth - tooltipWidth - 10) + 'px';
        }
        
        // Vertical positioning - below or above the item
        const spaceBelow = window.innerHeight - rect.bottom;
        const tooltipHeight = tooltip.offsetHeight || 150;
        
        if (spaceBelow < tooltipHeight + 20) {
            // Position above the item
            tooltip.style.top = (rect.top - tooltipHeight - 10) + 'px';
        } else {
            // Position below the item
            tooltip.style.top = (rect.bottom + 10) + 'px';
        }
    }
    
    // Updated show tooltip function with forced layout recalculation
    function showTooltip(techItem) {
        const techId = techItem.getAttribute('data-tech');
        if (!techId || !techData[techId]) {
            console.error('Invalid tech item or missing data:', techId);
            return;
        }
        
        // Set content
        tooltipTitle.textContent = techData[techId].title;
        tooltipDescription.textContent = techData[techId].description;
        tooltipLink.href = techData[techId].link;
        
        // First make tooltip visible but with opacity 0
        tooltip.style.visibility = 'hidden';
        tooltip.style.display = 'block';
        tooltip.classList.add('active');
        
        // Then force layout calculation and position it
        tooltip.offsetHeight; // Force layout recalculation
        positionTooltip(techItem);
        
        // Now make it visible with transition
        tooltip.style.visibility = 'visible';
        tooltipOverlay.classList.add('active');
        
        // Store reference to active item
        activeTech = techId;
        activeItem = techItem;
        
        // Prevent page scrolling
        document.body.style.overflow = 'hidden';
    }
    
    // Function to hide tooltip
    function hideTooltip() {
        tooltip.classList.remove('active');
        tooltipOverlay.classList.remove('active');
        
        // Re-enable scrolling
        document.body.style.overflow = '';
        
        activeTech = null;
        activeItem = null;
    }
    
    // Add click event to tech items
    techItems.forEach(item => {
        // First, make sure all items have the data-tech attribute
        if (!item.getAttribute('data-tech')) {
            // Extract tech name from the item's text content
            const techName = item.querySelector('span')?.textContent.toLowerCase();
            if (techName && techData[techName]) {
                item.setAttribute('data-tech', techName);
            }
        }
        
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const techId = this.getAttribute('data-tech');
            
            // Toggle tooltip if clicking the same tech
            if (activeTech === techId) {
                hideTooltip();
            } else {
                showTooltip(this);
            }
        });
    });
    
    // Close tooltip when clicking X button
    closeTooltip.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        hideTooltip();
    });
    
    // Close tooltip when clicking overlay
    tooltipOverlay.addEventListener('click', hideTooltip);
    
    // Close tooltip when pressing Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activeTech) {
            hideTooltip();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (activeTech && activeItem) {
            positionTooltip(activeItem);
        }
    });
    
    // Updated event handler to keep tooltips positioned correctly when scrolling
    window.addEventListener('scroll', function() {
        if (activeTech && activeItem) {
            positionTooltip(activeItem);
        }
    });
    
    // Initial console validation
    console.log(`Tooltip.js loaded. Found ${techItems.length} tech items.`);
    techItems.forEach(item => {
        const techId = item.getAttribute('data-tech');
        if (!techId) {
            console.warn('Tech item missing data-tech attribute:', item.textContent);
        } else if (!techData[techId]) {
            console.warn(`No tech data found for: ${techId}`);
        }
    });
    
    // Add data-tech attributes to all items
    techItems.forEach(item => {
        // Fix JavaScript tooltip by ensuring all tech items have correct data-tech attributes
        const techText = item.querySelector('span')?.textContent.trim().toLowerCase();
        
        // For JavaScript specifically, ensure it has the correct attribute
        if (techText === 'javascript') {
            item.setAttribute('data-tech', 'javascript');
        } 
        // For all other items that might be missing attributes
        else if (!item.getAttribute('data-tech') && techData[techText]) {
            item.setAttribute('data-tech', techText);
        }
        
        // Log warning for any items still missing attributes
        if (!item.getAttribute('data-tech')) {
            console.warn('Tech item still missing data-tech attribute:', item.textContent);
        }
    });
    
    // Immediately apply data-tech attributes and log confirmation
    console.log('Fixed tech item data attributes.');
    
    // Add this code to help diagnose the issue
    console.log('Tooltip elements found:', {
        tooltip: tooltip ? true : false,
        tooltipTitle: tooltipTitle ? true : false,
        tooltipDescription: tooltipDescription ? true : false, 
        tooltipLink: tooltipLink ? true : false,
        closeTooltip: closeTooltip ? true : false,
        tooltipOverlay: tooltipOverlay ? true : false,
    });
    
    console.log('Tech items with data-tech attributes:');
    techItems.forEach(item => {
        console.log(`${item.textContent.trim()}: ${item.getAttribute('data-tech') || 'NO DATA-TECH ATTRIBUTE'}`);
    });
});
