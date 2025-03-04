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
            // Parse dates
            const createdAt = new Date(repo.created_at).toLocaleDateString();
            const updatedAt = new Date(repo.updated_at).toLocaleDateString();
            
            // Get the normalized name for mapping lookups (FIXED: removed duplicate declaration)
            const normalizedName = repo.name.toLowerCase()
                .replace(/-/g, '')
                .replace(/_/g, '')
                .replace(/\s+/g, '');
            
            // Always check for our specific projects first
            let category = 'code'; // Default category
            
            // Hard-coded category assignments for your specific projects
            switch(normalizedName) {
                case 'purplewebeditor':
                case 'portfolio':
                case 'todolistapp':
                case 'passwordchecker':
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
                name: repo.name.replace(/-/g, ' ').replace(/_/g, ' '),
                description: repo.description || `A ${category} project.`,
                url: repo.html_url,
                homepage: repo.homepage,
                language: repo.language || 'Text',
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                category: category, // This now contains our updated category
                topics: repo.topics || [],
                createdAt: createdAt,
                updatedAt: updatedAt,
                imagePath: imagePath
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
}
