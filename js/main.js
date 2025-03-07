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
    
    // Add CSS class for page loading animation
    document.body.classList.add('loaded');
    
    // Add scroll handler to check for tech section visibility
    window.addEventListener('scroll', function() {
        const skills = document.getElementById('skills');
        
        if (skills) {
            const rect = skills.getBoundingClientRect();
            const isVisible = (
                rect.top < window.innerHeight && 
                rect.bottom > 0
            );
            
            if (isVisible) {
                skills.classList.add('skills-section-visible');
            }
        }
    });
    
    // Check immediately after load
    setTimeout(() => {
        const skills = document.getElementById('skills');
        
        if (skills) {
            const rect = skills.getBoundingClientRect();
            const isVisible = (
                rect.top < window.innerHeight && 
                rect.bottom > 0
            );
            
            if (isVisible) {
                skills.classList.add('skills-section-visible');
            }
        }
    }, 300);

    // Add a final fallback for skill bars in case they don't animate properly
    setTimeout(() => {
        const skillBars = document.querySelectorAll('.skill-progress');
        skillBars.forEach(bar => {
            const targetWidth = bar.getAttribute('data-width') || bar.style.width || '0%';
            if (bar.style.width === '0px' || bar.style.width === '0%' || !bar.style.width) {
                console.log('Applying final fallback for skill bar:', targetWidth);
                bar.classList.add('force-show');
                bar.style.width = targetWidth;
            }
        });
    }, 3000);
});

// Load GitHub data and update UI
async function loadGitHubData(github, ui) {
    try {
        // Show loading state
        ui.showLoading();
        
        // Get GitHub stats
        const stats = await github.getStats();
        updateGitHubStatsWithAnimation(stats);
        
        // Get repositories
        const repos = await github.getRepositories();
        if (!repos || repos.length === 0) {
            throw new Error('No repositories found');
        }
        
        // Format and display projects
        const formattedRepos = github.formatRepositories(repos);
        ui.updateProjectsDisplay(formattedRepos);
        
        // Add this after projects are displayed
        // Set proper display style for all project cards
        setTimeout(() => {
            document.querySelectorAll('.project-card').forEach(card => {
                card.style.display = 'flex';
            });
        }, 300);
        
    } catch (error) {
        console.error('Error loading GitHub data:', error);
        document.getElementById('projects-container').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load GitHub projects. Please try again later.</p>
            </div>
        `;
        
        // Show some fallback data for stats
        updateGitHubStatsWithAnimation({
            repoCount: '-',
            starsCount: '-',
            commitsCount: '-'
        });
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
    
    // If target is not a number, just set the value
    if (isNaN(parseInt(targetValue))) {
        element.textContent = targetValue;
        return;
    }
    
    // Convert to number for animation
    const target = parseInt(targetValue);
    let current = 0;
    const increment = Math.max(1, Math.floor(target / 50)); // Adjust speed based on value
    const duration = 1500; // Animation duration in ms
    const stepTime = duration / (target / increment);
    
    // Clear any existing animation
    if (element._countInterval) {
        clearInterval(element._countInterval);
    }
    
    // Create animation interval
    element._countInterval = setInterval(() => {
        current += increment;
        
        // If we've reached or exceeded the target
        if (current >= target) {
            element.textContent = target;
            clearInterval(element._countInterval);
            element._countInterval = null;
        } else {
            element.textContent = current;
        }
    }, stepTime);
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
