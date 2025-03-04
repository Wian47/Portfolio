// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI Controller
    const ui = new UIController();
    
    // Initialize GitHub API with your username
    const github = new GitHubAPI('Wian47');
    
    // Initialize hero section animation with improved background
    initHeroAnimation();
    
    // Load GitHub data
    loadGitHubData(github, ui);
    
    // Add CSS class for page loading animation
    document.body.classList.add('loaded');
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

// Initialize the animated background in hero section
function initHeroAnimation() {
    const animatedBg = document.getElementById('animated-bg');
    
    if (!animatedBg) return;
    
    // Clear existing content
    animatedBg.innerHTML = '';
    
    // Create background pattern
    const pattern = document.createElement('div');
    pattern.classList.add('hero-pattern');
    animatedBg.appendChild(pattern);
    
    // Add floating elements for depth
    for (let i = 0; i < 5; i++) {
        const floatingEl = document.createElement('div');
        floatingEl.classList.add('floating-element');
        
        const size = Math.random() * 150 + 100;
        floatingEl.style.width = `${size}px`;
        floatingEl.style.height = `${size}px`;
        floatingEl.style.left = `${Math.random() * 90}%`;
        floatingEl.style.top = `${Math.random() * 90}%`;
        floatingEl.style.opacity = Math.random() * 0.07 + 0.03;
        
        // Random color from theme
        const colors = [
            'var(--primary-color)', 
            'var(--secondary-color)', 
            'var(--highlight-color)'
        ];
        floatingEl.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Add animation with random duration and delay
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * 5;
        floatingEl.style.animation = `float ${duration}s ease-in-out ${delay}s infinite alternate`;
        
        animatedBg.appendChild(floatingEl);
    }
}
