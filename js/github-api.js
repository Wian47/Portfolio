// GitHub API integration
class GitHubAPI {
    constructor(username) {
        this.username = username;
        this.apiBaseUrl = 'https://api.github.com';
        this.perPage = 100; // Maximum items per page
        this.cacheTime = 3600000; // Cache time in milliseconds (1 hour)
    }

    // Fetch user profile data
    async getUserProfile() {
        if (this.userCache) return this.userCache;
        
        try {
            const response = await fetch(this.userURL);
            
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }
            
            const userData = await response.json();
            this.userCache = userData;
            return userData;
        } catch (error) {
            console.error('Error fetching GitHub profile:', error);
            return null;
        }
    }

    // Get repositories
    async getRepositories() {
        try {
            // Try to get repos from sessionStorage first
            const cachedRepos = this.getFromCache('github_repos');
            if (cachedRepos) {
                // Before returning cached repos, filter out profile README repository
                const filteredCache = cachedRepos.filter(repo => 
                    repo.name.toLowerCase() !== this.username.toLowerCase());
                if (filteredCache.length !== cachedRepos.length) {
                    console.log(`Removed profile README from cache`);
                    this.saveToCache('github_repos', filteredCache);
                    return filteredCache;
                }
                return cachedRepos;
            }
            
            // Fetch repositories
            const reposResponse = await fetch(
                `${this.apiBaseUrl}/users/${this.username}/repos?per_page=${this.perPage}&sort=updated`
            );
            const repos = await reposResponse.json();
            
            // Handle API error responses
            if (repos.message) {
                throw new Error(`API Error: ${repos.message}`);
            }
            
            console.log(`Fetched ${repos.length} repositories, excluding forks and profile README`);
            
            // Extra logging
            repos.forEach(repo => {
                if (repo.name.toLowerCase() === this.username.toLowerCase()) {
                    console.log(`Found profile README repo: ${repo.name}`);
                }
            });
            
            // Filter out forked repositories and profile README
            const ownRepos = repos.filter(repo => {
                // Check if it's not a fork and not the profile README
                const isProfileReadme = repo.name.toLowerCase() === this.username.toLowerCase();
                if (isProfileReadme) {
                    console.log(`Excluding profile README repository: ${repo.name}`);
                }
                return !repo.fork && !isProfileReadme;
            }).sort((a, b) => b.stargazers_count - a.stargazers_count);
            
            console.log(`After filtering: ${ownRepos.length} repositories`);
            
            // Extra verification to remove profile README
            const finalRepos = ownRepos.filter(repo => repo.name.toLowerCase() !== this.username.toLowerCase());
            
            // Cache the results
            this.saveToCache('github_repos', finalRepos);
            
            return finalRepos;
        } catch (error) {
            console.error('Error fetching repositories:', error);
            throw error;
        }
    }

    // New method to fetch profile README.md content
    async getProfileReadme() {
        try {
            // GitHub API endpoint for README file in special username/username repo
            const readmeUrl = `https://api.github.com/repos/${this.username}/${this.username}/readme`;
            const response = await fetch(readmeUrl);
            
            if (!response.ok) {
                console.warn('Profile README not found, fallback to default content');
                return null;
            }
            
            const data = await response.json();
            // GitHub returns README content as base64 encoded
            const content = atob(data.content);
            return content;
            
        } catch (error) {
            console.error('Error fetching profile README:', error);
            return null;
        }
    }

    // Get GitHub statistics
    async getStats() {
        try {
            // Try to get stats from sessionStorage first
            const cachedStats = this.getFromCache('github_stats');
            if (cachedStats) {
                return cachedStats;
            }
            
            // Get user profile data
            const profileResponse = await fetch(`${this.apiBaseUrl}/users/${this.username}`);
            const profileData = await profileResponse.json();
            
            // Get repositories
            const repos = await this.getRepositories();
            
            // Calculate total stars
            const starsCount = repos.reduce((total, repo) => total + repo.stargazers_count, 0);
            
            // Get commit count from contribution calendar
            // Since this requires scraping, we'll use a placeholder for now
            const commitsCount = profileData.public_repos * 15; // Rough approximation
            
            // Compile stats
            const stats = {
                repoCount: profileData.public_repos,
                starsCount: starsCount,
                commitsCount: commitsCount
            };
            
            // Cache the results
            this.saveToCache('github_stats', stats);
            
            return stats;
        } catch (error) {
            console.error('Error fetching GitHub stats:', error);
            throw error;
        }
    }

    // Get languages used across repositories
    async getLanguages() {
        try {
            const repos = await this.getRepositories();
            const languagesMap = {};
            
            repos.forEach(repo => {
                if (repo.language) {
                    languagesMap[repo.language] = (languagesMap[repo.language] || 0) + 1;
                }
            });
            
            return Object.entries(languagesMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
        } catch (error) {
            console.error('Error getting language stats:', error);
            return [];
        }
    }

    // Determine project category based on topics or repo contents
    getProjectCategory(repo) {
        const name = repo.name.toLowerCase();
        const description = repo.description ? repo.description.toLowerCase() : '';
        const topics = repo.topics || [];
        
        // Check for web projects
        if (
            name.includes('web') || 
            description.includes('website') || 
            description.includes('web app') ||
            topics.includes('website') ||
            topics.includes('web') ||
            repo.language === 'HTML' ||
            repo.language === 'CSS'
        ) {
            return 'web';
        }
        
        // Check for API projects
        if (
            name.includes('api') || 
            description.includes('api') ||
            topics.includes('api') ||
            topics.includes('rest-api')
        ) {
            return 'api';
        }
        
        // Check for applications
        if (
            name.includes('app') ||
            description.includes('application') ||
            topics.includes('application')
        ) {
            return 'app';
        }
        
        return 'other';
    }

    // Format repositories for display with improved categorization
    formatRepositories(repos) {
        return repos.map((repo, index) => {
            // Store the original repo name before formatting
            const originalName = repo.name;
            
            // Parse dates
            const createdAt = new Date(repo.created_at).toLocaleDateString();
            const updatedAt = new Date(repo.updated_at).toLocaleDateString();
            
            // Get the normalized name for mapping lookups
            const normalizedName = repo.name.toLowerCase()
                .replace(/-/g, '')
                .replace(/_/g, '')
                .replace(/\s+/g, '');
            
            console.log(`Repository ${index}: "${repo.name}" (normalized: "${normalizedName}")`);
            
            // Always check for our specific projects first
            let category = 'code'; // Default category
            
            // Hard-coded category assignments for your specific projects
            switch(normalizedName) {
                case 'purplewebeditor':
                case 'portfolio':
                case 'todolistapp':
                case 'todo':
                case 'todolist':
                case 'passwordchecker':
                case 'passwordcheck':
                    category = 'web'; // All these should be 'web' now
                    break;
                case 'webapplicationvulnerabilityscanner':
                    category = 'app'; // Changed from 'api' to 'app'
                    break;
                default:
                    // If not one of the specified projects, check ProjectImages mapping
                    if (window.ProjectImages && ProjectImages.repoCategories[normalizedName]) {
                        category = ProjectImages.repoCategories[normalizedName];
                    }
                    // Then use regular categorization logic
                    else if (repo.topics && repo.topics.length > 0) {
                        if (repo.topics.includes('web') || repo.topics.includes('website')) {
                            category = 'web';
                        } else if (repo.topics.includes('app') || repo.topics.includes('application')) {
                            category = 'app';
                        }
                    }
                    // Fallback to name/description
                    else {
                        const name = repo.name.toLowerCase();
                        const description = repo.description ? repo.description.toLowerCase() : '';
                        
                        if (name.includes('web') || name.includes('site') || 
                            description.includes('website') || description.includes('web app') ||
                            repo.language === 'HTML' || repo.language === 'CSS') {
                            category = 'web';
                        } else if (name.includes('app') || name.includes('mobile') || 
                                 description.includes('application') || description.includes('mobile')) {
                            category = 'app';
                        }
                    }
            }
            
            // Get image path using ProjectImages utility (FIXED: added missing variable)
            let imagePath = null;
            if (window.ProjectImages) {
                imagePath = ProjectImages.getImagePath(repo.name);
            }
            
            // Format the repository data with the updated category
            return {
                id: index,
                original_name: originalName, // Store the original name
                name: repo.name.replace(/-/g, ' ').replace(/_/g, ' '),
                description: repo.description || `A ${category} project.`,
                url: repo.html_url,
                homepage: repo.homepage,
                language: repo.language || 'Text',
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                category: category,
                topics: repo.topics || [],
                createdAt: createdAt,
                updatedAt: updatedAt,
                html_url: repo.html_url // Ensure this is available for links
            };
        });
    }

    // Save data to sessionStorage with timestamp
    saveToCache(key, data) {
        const cache = {
            data: data,
            timestamp: new Date().getTime()
        };
        sessionStorage.setItem(key, JSON.stringify(cache));
    }
    
    // Get data from sessionStorage if it's still valid
    getFromCache(key) {
        const cacheString = sessionStorage.getItem(key);
        if (!cacheString) return null;
        
        const cache = JSON.parse(cacheString);
        const now = new Date().getTime();
        
        // Check if cache is still valid
        if (now - cache.timestamp < this.cacheTime) {
            return cache.data;
        }
        
        // Cache expired, remove it
        sessionStorage.removeItem(key);
        return null;
    }

    // Find function that creates project elements
    createProjectElement(repo) {
        // Create project card
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.category = repo.category;
        projectCard.dataset.repoName = repo.name;
        
        // Simplified image path selection - directly use our mapping
        let imagePath;
        
        // Use the global getProjectImage function if available
        if (window.getProjectImage) {
            imagePath = window.getProjectImage(repo.name, repo.category);
            console.log(`Using direct image mapping for ${repo.name}: ${imagePath}`);
        } 
        // Fallback to direct lookup in the PROJECT_IMAGES object
        else if (window.PROJECT_IMAGES) {
            const lowerName = repo.name.toLowerCase();
            imagePath = window.PROJECT_IMAGES[lowerName] || 
                       window.PROJECT_IMAGES[`_default_${repo.category}`] || 
                       window.PROJECT_IMAGES['_default_code'];
        }
        // Last resort fallback
        else {
            imagePath = 'assets/projects/Portfolio.png'; // Default fallback
        }
        
        // Build the project card HTML
        projectCard.innerHTML = `
            <div class="project-image">
                <img src="${imagePath}" alt="${repo.name}" data-category="${repo.category}" data-original-name="${repo.original_name || ''}"
                     onerror="this.src='assets/projects/Portfolio.png'">
            </div>
            <div class="project-details">
                <h3>${repo.name}</h3>
                <p>${repo.description || 'No description available'}</p>
                <div class="project-meta">
                    <span class="project-date">Updated: ${repo.updatedAt}</span>
                    <span class="project-lang">${repo.language || 'N/A'}</span>
                </div>
                <div class="project-actions">
                    <button class="btn details-btn" data-repo-name="${repo.name}">Details</button>
                    <a href="${repo.html_url}" target="_blank" class="btn github-btn" rel="noopener">
                        <i class="fab fa-github"></i> GitHub
                    </a>
                    ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" class="btn live-btn" rel="noopener">
                        <i class="fas fa-external-link-alt"></i> Live
                    </a>` : ''}
                    <button class="btn share-btn" data-repo-name="${repo.name}" data-repo-url="${repo.html_url}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add project card click event
        const detailsBtn = projectCard.querySelector('.details-btn');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                this.showProjectDetails(repo);
            });
        }
        
        // Add share button functionality if available
        const shareBtn = projectCard.querySelector('.share-btn');
        if (shareBtn && window.ProjectShare) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const repoName = shareBtn.dataset.repoName;
                const repoUrl = shareBtn.dataset.repoUrl;
                window.ProjectShare.shareProject(repoName, repoUrl);
            });
        }
        
        return projectCard;
    }

    // Display projects in the UI with better error handling
    displayProjects(repos) {
        console.log('Displaying projects:', repos.length);
        
        // Get container
        const container = document.getElementById('projects-container');
        if (!container) {
            console.error('Projects container not found');
            return;
        }
        
        // Clear loading indicator
        container.innerHTML = '';
        
        // Check if we have projects
        if (!repos || repos.length === 0) {
            container.innerHTML = `
                <div class="no-projects">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No projects available. Please check your GitHub connection.</p>
                </div>
            `;
            return;
        }
        
        // Display projects
        repos.forEach(repo => {
            try {
                const projectElement = this.createProjectElement(repo);
                container.appendChild(projectElement);
            } catch (err) {
                console.error(`Error creating project element for ${repo.name}:`, err);
                
                // Create a basic error fallback card
                const errorCard = document.createElement('div');
                errorCard.className = 'project-card error-card';
                errorCard.innerHTML = `
                    <div class="project-image">
                        <img src="assets/projects/default-code.jpg" alt="${repo.name || 'Unknown Project'}">
                    </div>
                    <div class="project-details">
                        <h3>${repo.name || 'Unknown Project'}</h3>
                        <p>${repo.description || 'No description available'}</p>
                        <div class="project-meta">
                            <span class="project-date">Error loading project details</span>
                        </div>
                    </div>
                `;
                container.appendChild(errorCard);
            }
        });
        
        // Run optimizeProjectImages after projects are loaded
        if (window.optimizeProjectImages) {
            setTimeout(() => {
                window.optimizeProjectImages();
                console.log('Ran optimizeProjectImages after loading projects');
            }, 500);
        }
    }
}
