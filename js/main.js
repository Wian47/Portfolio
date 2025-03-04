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
        ui.updateGitHubStats(stats);
        
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
        ui.updateGitHubStats({
            repoCount: '-',
            starsCount: '-',
            commitsCount: '-'
        });
    }
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
