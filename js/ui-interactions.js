// UI Interactions
class UIController {
    constructor() {
        // UI Elements
        this.themeToggle = document.getElementById('theme-toggle-btn');
        this.navbar = document.querySelector('.navbar');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.mobileToggle = document.querySelector('.mobile-toggle');
        this.navMenu = document.querySelector('.nav-links');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.projectsContainer = document.getElementById('projects-container');
        this.modal = document.getElementById('project-modal');
        this.modalContent = document.getElementById('modal-project-details');
        this.closeModal = document.querySelector('.close-modal');
        this.animatedBg = document.getElementById('animated-bg');
        this.contactForm = document.getElementById('contactForm');
        this.currentYearSpan = document.getElementById('current-year');
        
        // Initialize
        this.init();
    }

    // Initialize UI event listeners and features
    init() {
        // Set current year in footer
        this.currentYearSpan.textContent = new Date().getFullYear();
        
        // Set stored theme
        this.initTheme();
        
        // Event listeners
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Mobile menu toggle
        if (this.mobileToggle && this.navMenu) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => this.filterProjects(btn));
        });
        
        // Scroll spy for navigation
        window.addEventListener('scroll', () => this.activateScrollSpy());
        
        // Smooth scroll for navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavLinkClick(e));
        });
        
        // Modal event listeners
        this.closeModal.addEventListener('click', () => this.hideModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        // Contact form submission
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }
        
        // Animation intersection observers
        this.initIntersectionObservers();

        // Initialize background animation

        this.initBackgroundAnimation();

        // Initialize skill animations
        this.initSkillsAnimations();
    }

    // Initialize theme (light/dark)
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    // Toggle between light and dark theme
    toggleTheme() {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    }

    // Toggle mobile menu
    toggleMobileMenu() {
        this.navMenu.classList.toggle('show');
        this.mobileToggle.classList.toggle('active');
    }

    // Improved filter projects method with smoother animations
    filterProjects(selectedBtn) {
        const filter = selectedBtn.dataset.filter;
        console.log(`Filtering projects by: ${filter}`);
        
        // Update active button
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        selectedBtn.classList.add('active');
        
        // Get all project cards and count visible ones
        const projectCards = document.querySelectorAll('.project-card');
        let visibleCount = 0;
        
        // First hide any existing "no projects" message
        const existingMsg = this.projectsContainer.querySelector('.no-projects');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        // Apply filtering with staggered animations
        projectCards.forEach((card, index) => {
            const category = card.dataset.category;
            const shouldBeVisible = filter === 'all' || category === filter;
            const delay = index * 50; // Stagger the animations
            
            if (shouldBeVisible) {
                // Make visible with animation
                setTimeout(() => {
                    // Reset any previous animations
                    card.classList.remove('fade-out');
                    card.style.display = 'flex'; // Use flex instead of block
                    
                    // Force a reflow before adding the animation class
                    void card.offsetWidth;
                    
                    // Add fade-in animation
                    card.classList.add('fade-in');
                }, delay);
                
                visibleCount++;
            } else {
                // Hide with animation
                setTimeout(() => {
                    // Add fade-out animation
                    card.classList.remove('fade-in');
                    card.classList.add('fade-out');
                    
                    // Hide after animation completes
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 500); // Match the animation duration
                }, delay);
            }
        });
        
        // Show "no projects" message if needed after animations complete
        setTimeout(() => {
            if (visibleCount === 0) {
                const noProjectsMsg = document.createElement('p');
                noProjectsMsg.className = 'no-projects fade-in'; // Add animation class
                noProjectsMsg.textContent = `No ${filter} projects found.`;
                this.projectsContainer.appendChild(noProjectsMsg);
            }
        }, projectCards.length * 50 + 600); // Wait for all animations to finish
    }

    // Create HTML for project cards with improved structure
    createProjectCard(project) {
        const card = document.createElement('div');
        card.classList.add('project-card');
        card.dataset.category = project.category;
        
        // Add CSS for transitions
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        let tagsHTML = '';
        if (project.topics.length > 0) {
            project.topics.slice(0, 3).forEach(topic => {
                tagsHTML += `<span class="project-tag">${topic}</span>`;
            });
        } else if (project.language) {
            tagsHTML = `<span class="project-tag">${project.language}</span>`;
        }
        
        // Determine image path and fallbacks
        const normalizedName = project.name.replace(/\s+/g, '-').toLowerCase();
        const imagePath = project.imagePath || 
                         `assets/projects/${normalizedName}.jpg`;
        
        // Create the image HTML with enhanced error handling
        const imageHtml = `
            <div class="project-image project-preview">
                <img 
                    src="${imagePath}" 
                    alt="${project.name}" 
                    data-category="${project.category}"
                    data-repo="${normalizedName}"
                    onerror="window.projectImageErrorHandler(this, '${normalizedName}', '${project.category}')"
                >
            </div>
        `;
        
        card.innerHTML = `
            ${imageHtml}
            <div class="project-info">
                <h3>${project.name}</h3>
                <p>${this.truncateText(project.description, 100)}</p>
                <div class="project-tags">
                    ${tagsHTML}
                </div>
                <div class="project-links">
                    <button class="btn secondary-btn details-btn" data-id="${project.id}">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <a href="${project.url}" class="btn primary-btn" target="_blank" rel="noopener">
                        <i class="fab fa-github"></i> View
                    </a>
                </div>
            </div>
        `;
        
        // Add event listener to details button
        const detailsBtn = card.querySelector('.details-btn');
        detailsBtn.addEventListener('click', () => {
            this.showProjectDetails(project);
        });
        
        return card;
    }

    // Get icon based on project category
    getProjectIcon(category) {
        switch (category) {
            case 'web':
                return 'fa-globe';
            case 'api':
                return 'fa-server';
            case 'app':
                return 'fa-mobile-alt';
            default:
                return 'fa-code';
        }
    }

    // Show project details in modal
    showProjectDetails(project) {
        const modalContent = `
            <h2>${project.name}</h2>
            <div class="modal-info">
                <div class="modal-description">
                    <h3>Description</h3>
                    <p>${project.description}</p>
                </div>
                <div class="modal-meta">
                    <p><strong>Language:</strong> ${project.language}</p>
                    <p><strong>Created:</strong> ${project.createdAt}</p>
                    <p><strong>Last Updated:</strong> ${project.updatedAt}</p>
                    <p><strong>Stars:</strong> ${project.stars}</p>
                    <p><strong>Forks:</strong> ${project.forks}</p>
                </div>
            </div>
            <div class="modal-tags">
                <h3>Topics</h3>
                <div class="tags-container">
                    ${project.topics.length > 0 ? 
                        project.topics.map(topic => `<span class="project-tag">${topic}</span>`).join('') : 
                        '<p>No topics specified</p>'}
                </div>
            </div>
            <div class="modal-actions">
                <a href="${project.url}" class="btn primary-btn" target="_blank" rel="noopener">
                    <i class="fab fa-github"></i> View on GitHub
                </a>
                ${project.homepage ? 
                    `<a href="${project.homepage}" class="btn secondary-btn" target="_blank" rel="noopener">
                        <i class="fas fa-external-link-alt"></i> View Live Demo
                    </a>` : ''}
            </div>
        `;
        
        this.modalContent.innerHTML = modalContent;
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    // Hide modal
    hideModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = ''; // Enable scrolling
    }

    // Show loading spinner
    showLoading() {
        this.projectsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading projects from GitHub...</p>
            </div>
        `;
    }

    // Handle contact form submission
    handleContactSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this.contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        
        // Validate form data
        if (!name || !email || !message) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // In a real implementation, you would send this data to a server
        // Here we'll just show a success message and clear the form
        
        this.showNotification('Message sent successfully!', 'success');
        this.contactForm.reset();
    }

    // Show notification
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Initialize intersection observers for animations
    initIntersectionObservers() {
        // Skip if IntersectionObserver is not supported
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported in this browser. Animations may not work.');
            return;
        }
        
        const sections = document.querySelectorAll('section');
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.1 });
        
        sections.forEach(section => {
            sectionObserver.observe(section);
        });
        
        // Skill bars animation
        const skillBars = document.querySelectorAll('.skill-progress');
        
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const width = entry.target.style.width;
                    entry.target.style.width = '0';
                    setTimeout(() => {
                        entry.target.style.width = width;
                    }, 100);
                }
            });
        }, { threshold: 0.1 });
        
        skillBars.forEach(bar => {
            skillObserver.observe(bar);
        });
    }

    // Handle navigation link clicks
    handleNavLinkClick(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        
        // Close mobile menu if open
        if (this.navMenu.classList.contains('show')) {
            this.toggleMobileMenu();
        }
        
        // Scroll to target section
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    }

    // Activate scroll spy for navigation
    activateScrollSpy() {
        const scrollPosition = window.scrollY + 100; // Offset
        
        document.querySelectorAll('section').forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (
                scrollPosition >= sectionTop && 
                scrollPosition < sectionTop + sectionHeight
            ) {
                // Remove active class from all nav links
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                });
                
                // Add active class to current section nav link
                document.querySelector(`.nav-link[href="#${sectionId}"]`)?.classList.add('active');
            }
        });
    }

    // Helper to truncate text
    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    // Update GitHub stats display
    updateGitHubStats(stats) {
        document.getElementById('repo-count').textContent = stats.repoCount;
        document.getElementById('stars-count').textContent = stats.starsCount;
        document.getElementById('commits-count').textContent = stats.commitsCount;
    }

    // Update projects display
    updateProjectsDisplay(projects) {
        this.projectsContainer.innerHTML = '';
        
        if (projects.length === 0) {
            this.projectsContainer.innerHTML = '<p class="no-projects">No projects found.</p>';
            return;
        }
        
        projects.forEach(project => {
            const card = this.createProjectCard(project);
            this.projectsContainer.appendChild(card);
        });
    }

    // Add this method to UIController class
    initBackgroundAnimation() {
        const animatedBg = document.getElementById('animated-bg');
        if (!animatedBg) {
            console.warn('animated-bg element not found');
            return;
        }
        
        try {
            // Clear existing background
            animatedBg.innerHTML = '';
            
            // Create a more subtle, professional pattern
            const patternDiv = document.createElement('div');
            patternDiv.classList.add('hero-pattern');
            animatedBg.appendChild(patternDiv);
            
            // Add subtle floating elements
            for (let i = 0; i < 10; i++) {
                const floatingEl = document.createElement('div');
                floatingEl.classList.add('floating-element');
                
                // Randomize size, position and opacity
                const size = Math.random() * 100 + 50;
                floatingEl.style.width = `${size}px`;
                floatingEl.style.height = `${size}px`;
                
                floatingEl.style.left = `${Math.random() * 100}%`;
                floatingEl.style.top = `${Math.random() * 100}%`;
                floatingEl.style.opacity = `${Math.random() * 0.05 + 0.02}`;
                
                // Use primary/secondary colors
                const colors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--highlight-color)'];
                floatingEl.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                // Add subtle animation
                floatingEl.style.animation = `float ${Math.random() * 15 + 20}s ease-in-out ${Math.random() * 5}s infinite alternate`;
                
                animatedBg.appendChild(floatingEl);
            }
        } catch (error) {
            console.error('Error initializing background animation:', error);
        }
    }

    // Add this method to UIController class for improved error handling
    handleError(message, element) {
        console.error(message);
        if (element) {
            element.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
        this.showNotification(message, 'error');
    }

    // Add this method to UIController class for improved skill animations
    initSkillsAnimations() {
        // Create a new reliable method for skill bar animations
        const skillBars = document.querySelectorAll('.skill-progress');
        
        // Store original widths before resetting
        skillBars.forEach(bar => {
            // Get the percentage from the style or data attribute
            const width = bar.style.width || bar.getAttribute('data-width') || '0%';
            // Store the target width as a data attribute for reliable access
            bar.setAttribute('data-width', width);
            // Start with zero width
            bar.style.width = '0';
        });
        
        // Create a better intersection observer with lower threshold
        const skillObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const bar = entry.target;
                        // Use the stored target width
                        const targetWidth = bar.getAttribute('data-width');
                        
                        // Ensure bar has needed transition
                        bar.style.transition = 'width 1.5s ease-out';
                        
                        // Trigger reflow before setting width to ensure transition plays
                        void bar.offsetWidth;
                        
                        // Set to final width
                        setTimeout(() => {
                            bar.style.width = targetWidth;
                        }, 100);
                        
                        // Stop observing this element
                        skillObserver.unobserve(bar);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
        );
        
        // Apply observer to all skill progress bars
        skillBars.forEach(bar => {
            skillObserver.observe(bar);
        });
        
        // Add this as a backup to ensure bars animate even when observer fails
        this.setupSkillBarsFallback();

        // Create a separate observer for tech clusters with longer rootMargin
        const observeTechClusters = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const techItems = entry.target.querySelectorAll('.tech-item');
                        
                        techItems.forEach((item, index) => {
                            // Add a class instead of direct animation
                            setTimeout(() => {
                                item.classList.add('fade-in');
                            }, index * 100);
                        });
                        
                        // Stop observing this container
                        observeTechClusters.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
        );
        
        // Apply observer to each tech cluster
        document.querySelectorAll('.tech-cluster').forEach(cluster => {
            observeTechClusters.observe(cluster);
        });
        
        // Enhanced timeline animation with better detection
        const observeTimeline = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('timeline-visible');
                        observeTimeline.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
        );
        
        // Apply observer to timeline
        const timeline = document.querySelector('.timeline');
        if (timeline) {
            observeTimeline.observe(timeline);
        }

        // Add a scroll event handler as a fallback for tech items
        this.setupFallbackForTechItems();
    }

    // Add a new method for skill bars fallback animation
    setupSkillBarsFallback() {
        const skillBars = document.querySelectorAll('.skill-progress');
        let animationApplied = false;
        
        // Function to check position and animate if needed
        const checkAndAnimateBars = () => {
            if (animationApplied) return;
            
            const skills = document.getElementById('skills');
            if (!skills) return;
            
            const rect = skills.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                skillBars.forEach(bar => {
                    const targetWidth = bar.getAttribute('data-width');
                    if (bar.style.width === '0px' || bar.style.width === '0%' || !bar.style.width) {
                        // Ensure transition is defined
                        bar.style.transition = 'width 1.5s ease-out';
                        
                        // Force reflow
                        void bar.offsetWidth;
                        
                        // Set width after a short delay
                        setTimeout(() => {
                            bar.style.width = targetWidth;
                        }, 100);
                    }
                });
                
                animationApplied = true;
                window.removeEventListener('scroll', checkAndAnimateBars);
            }
        };
        
        // Run on page load and scroll
        setTimeout(checkAndAnimateBars, 500);
        window.addEventListener('scroll', checkAndAnimateBars);
        
        // Auto-reset if animations are stuck after 5 seconds
        setTimeout(() => {
            skillBars.forEach(bar => {
                const targetWidth = bar.getAttribute('data-width');
                if (bar.style.width === '0px' || bar.style.width === '0%' || !bar.style.width) {
                    console.log('Resetting stuck skill bar:', bar);
                    bar.style.transition = 'width 1s ease-out';
                    bar.style.width = targetWidth;
                }
            });
        }, 5000);
    }

    // Add this new method to handle cases where IntersectionObserver doesn't trigger
    setupFallbackForTechItems() {
        // Flag to track if animations have been triggered
        let techItemsAnimated = false;
        let timelineAnimated = false;
        
        // Function to check position and trigger animations if needed
        const checkPositionAndAnimate = () => {
            // Handle tech clusters
            if (!techItemsAnimated) {
                const techClusters = document.querySelector('.tech-clusters');
                if (techClusters) {
                    const rect = techClusters.getBoundingClientRect();
                    // If the top of the tech clusters is in view
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        const techItems = document.querySelectorAll('.tech-item');
                        techItems.forEach((item, index) => {
                            setTimeout(() => {
                                item.classList.add('fade-in');
                            }, index * 100);
                        });
                        techItemsAnimated = true;
                    }
                }
            }
            
            // Handle timeline with more items
            if (!timelineAnimated) {
                const timeline = document.querySelector('.timeline');
                if (timeline) {
                    const rect = timeline.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        timeline.classList.add('timeline-visible');
                        
                        // Set custom property for each timeline item for staggered animation
                        const timelineItems = timeline.querySelectorAll('.timeline-item');
                        timelineItems.forEach((item, index) => {
                            item.style.setProperty('--item-index', index);
                        });
                        
                        timelineAnimated = true;
                    }
                }
            }
            
            // If both are animated, remove the scroll listener
            if (techItemsAnimated && timelineAnimated) {
                window.removeEventListener('scroll', checkPositionAndAnimate);
            }
        };
        
        // Run once to check initial state (important for desktop)
        checkPositionAndAnimate();
        
        // Add scroll listener
        window.addEventListener('scroll', checkPositionAndAnimate);
    }
}

// Add this code to check if animations are loaded after the page is fully loaded
window.addEventListener('load', function() {
    // Check if tech items are visible but not animated
    setTimeout(() => {
        document.querySelectorAll('.tech-item:not(.fade-in)').forEach((item, index) => {
            if (isElementInViewport(item)) {
                setTimeout(() => {
                    item.classList.add('fade-in');
                }, index * 100);
            }
        });
        
        // Check if timeline is visible but not animated
        const timeline = document.querySelector('.timeline:not(.timeline-visible)');
        if (timeline && isElementInViewport(timeline)) {
            timeline.classList.add('timeline-visible');
        }
    }, 500);
});

// Helper function to check if element is in viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
        rect.bottom >= 0 &&
        rect.right >= 0
    );
}
