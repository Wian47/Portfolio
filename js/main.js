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
    
    // Create background pattern - modified to feel more "security" focused
    const pattern = document.createElement('div');
    pattern.classList.add('hero-pattern');
    animatedBg.appendChild(pattern);
    
    // Add binary/code-like elements
    for (let i = 0; i < 15; i++) {
        const codeElement = document.createElement('div');
        codeElement.classList.add('code-element');
        codeElement.style.position = 'absolute';
        codeElement.style.color = 'var(--primary-color)';
        codeElement.style.opacity = Math.random() * 0.1 + 0.05;
        codeElement.style.fontSize = `${Math.random() * 12 + 8}px`;
        codeElement.style.fontFamily = 'monospace';
        codeElement.style.left = `${Math.random() * 100}%`;
        codeElement.style.top = `${Math.random() * 100}%`;
        codeElement.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        // Add binary/hexadecimal content
        const content = Math.random() > 0.5 ? 
            '01010101010101' : 
            '0xF8A1D937E2C4';
        codeElement.textContent = content;
        
        animatedBg.appendChild(codeElement);
    }
    
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
        
        // Cyber security color palette
        const colors = [
            'var(--primary-color)', 
            'var(--secondary-color)',
            'var(--highlight-color)',
            '#3a0ca3'  // Additional deep purple
        ];
        floatingEl.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Add animation with random duration and delay
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * 5;
        floatingEl.style.animation = `float ${duration}s ease-in-out ${delay}s infinite alternate`;
        
        animatedBg.appendChild(floatingEl);
    }
    
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
            }
        }
    }, 1000);
}
