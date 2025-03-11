document.addEventListener('DOMContentLoaded', function() {
    // Force clear GitHub cache to apply new filters
    sessionStorage.removeItem('github_repos');
    sessionStorage.removeItem('github_stats');
    
    // Check if required modules are loaded
    if (!window.ProjectImages) {
        console.error('ProjectImages utility not found! Creating fallback...');
        // Create minimal fallback
        window.ProjectImages = {
            getImagePath: function() { return null; },
            getCategoryImage: function(category) {
                return `assets/projects/default-${category || 'code'}.jpg`;
            },
            customMappings: {}
        };
    }
    
    // Initialize UI Controller
    const ui = new UIController();
    
    // Initialize GitHub API with your username
    const github = new GitHubAPI('Wian47');
    
    // Initialize hero section animation 
    initHeroAnimation();
    
    // Load GitHub data
    loadGitHubData(github, ui);
    
    // Remove any particle-related code here if present
});

// Load GitHub data and update UI
async function loadGitHubData(github, ui) {
    try {
        ui.showLoading();
        
        // Use Promise.all for parallel requests
        const [stats, repos] = await Promise.all([
            github.getStats(),
            github.getRepositories()
        ]);
        
        if (!repos || repos.length === 0) {
            throw new Error('No repositories found');
        }
        
        // Update UI efficiently
        requestAnimationFrame(() => {
            updateGitHubStatsWithAnimation(stats);
            const formattedRepos = github.formatRepositories(repos);
            ui.updateProjectsDisplay(formattedRepos);
            
            // Optimize project card display
            requestAnimationFrame(() => {
                document.querySelectorAll('.project-card').forEach(card => {
                    card.style.display = 'flex';
                    card.style.opacity = '0';
                    requestAnimationFrame(() => {
                        card.style.transition = 'opacity 0.3s ease-out';
                        card.style.opacity = '1';
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('Error loading GitHub data:', error);
        ui.showError('Failed to load GitHub projects. Please try again later.');
    }
}

// Update UI with animated counters for statistics
function updateGitHubStatsWithAnimation(stats) {
    animateCounter('repo-count', stats.repoCount);
    animateCounter('stars-count', stats.starsCount);
    animateCounter('commits-count', stats.commitsCount);
}

// Function to animate counting up
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // If target is not a number or we're on mobile, just set the value directly
    if (isNaN(parseInt(targetValue)) || window.innerWidth < 768) {
        element.textContent = targetValue;
        return;
    }
    
    // Convert to number for animation
    const target = parseInt(targetValue);
    let current = 0;
    
    // Adjust animation parameters based on screen size and device performance
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1500;
    const increment = Math.max(1, Math.floor(target / (window.innerWidth < 1024 ? 25 : 50)));
    const stepTime = Math.max(16, duration / (target / increment)); // Ensure minimum 16ms (60fps)
    
    // Clear any existing animation
    if (element._countInterval) {
        clearInterval(element._countInterval);
    }
    
    // Use requestAnimationFrame for smoother animation
    let lastTime = performance.now();
    const animate = (currentTime) => {
        const deltaTime = currentTime - lastTime;
        
        if (deltaTime >= stepTime) {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                return;
            }
            element.textContent = current;
            lastTime = currentTime;
            requestAnimationFrame(animate);
        } else {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// Update the initHeroAnimation function to include timeline item initialization
function initHeroAnimation() {
    const animatedBg = document.getElementById('animated-bg');
    
    if (!animatedBg) return;
    
    // Clear existing content completely
    animatedBg.innerHTML = '';
    
    // Don't create any new elements at all - leave the background empty
    
    // Force tech items and timeline visible on desktop after a short delay
    setTimeout(() => {
        const skills = document.getElementById('skills');
        if (skills) {
            const techItems = skills.querySelectorAll('.tech-item');
            techItems.forEach((item, index) => {
                // Set custom property for staggered delay
                item.style.setProperty('--item-index', index);
            });
            
            // Add class to parent to trigger fallback CSS animations
            if (window.innerWidth >= 768) {
                skills.classList.add('skills-section-visible');
            } else {
                // Force timeline visibility on mobile immediately
                const timeline = document.querySelector('.timeline');
                if (timeline) {
                    timeline.classList.add('timeline-visible');
                    
                    // Force individual items visible on mobile
                    const timelineItems = timeline.querySelectorAll('.timeline-item');
                    timelineItems.forEach(item => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    });
                }
            }
        }
    }, 1000);
}

// Add debouncing for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add intersection observer for lazy loading
const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
});
