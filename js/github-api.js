// GitHub API integration
class GitHubAPI {
    constructor(username) {
        this.username = username;
        this.baseURL = 'https://api.github.com/users/';
        this.reposURL = `${this.baseURL}${username}/repos`;
        this.userURL = `${this.baseURL}${username}`;
        this.repoCache = null;
        this.userCache = null;
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

    // Fetch all repositories
    async getRepositories() {
        if (this.repoCache) return this.repoCache;
        
        try {
            const response = await fetch(`${this.reposURL}?sort=updated&per_page=100`);
            
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }
            
            const repos = await response.json();
            this.repoCache = repos.filter(repo => !repo.fork); // Filter out forked repos
            return this.repoCache;
        } catch (error) {
            console.error('Error fetching repositories:', error);
            return [];
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

    // Calculate GitHub statistics
    async getStats() {
        try {
            const repos = await this.getRepositories();
            const profile = await this.getUserProfile();
            
            if (!repos || !profile) {
                return {
                    repoCount: '-',
                    starsCount: '-',
                    commitsCount: '-'
                };
            }

            // Total stars count
            const starsCount = repos.reduce((total, repo) => total + repo.stargazers_count, 0);
            
            return {
                repoCount: repos.length,
                starsCount,
                commitsCount: '−' // Exact commits require multiple API calls, not practical here
            };
        } catch (error) {
            console.error('Error calculating GitHub stats:', error);
            return {
                repoCount: '-',
                starsCount: '-',
                commitsCount: '-'
            };
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

    // Format repositories for display
    formatRepositories(repos) {
        return repos.map(repo => {
            return {
                id: repo.id,
                name: repo.name,
                description: repo.description || 'No description available',
                language: repo.language || 'Not specified',
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                url: repo.html_url,
                homepage: repo.homepage,
                topics: repo.topics || [],
                category: this.getProjectCategory(repo),
                updatedAt: new Date(repo.updated_at).toLocaleDateString(),
                createdAt: new Date(repo.created_at).toLocaleDateString()
            };
        });
    }
}
