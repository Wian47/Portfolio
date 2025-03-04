/**
 * Enhanced ProjectImages utility
 * Handles project image loading with robust fallbacks and detailed logging
 */

const ProjectImages = {
    // Base path for project images
    basePath: 'assets/projects/',
    
    // Possible file extensions to try (in order of preference)
    fileExtensions: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    
    // Cache for successful image paths to improve performance
    pathCache: {},
    
    // Debug mode flag - set to true for verbose logging
    debug: true,
    
    /**
     * Get the appropriate image path for a repository
     * @param {string} repoName - Repository name
     * @returns {string} Path to the image
     */
    getImagePath: function(repoName) {
        if (!repoName) {
            this.log('No repo name provided, returning default code image');
            return this.getCategoryImage('code');
        }
        
        // Check if we already have a cached path for this repo
        if (this.pathCache[repoName]) {
            this.log(`Using cached path for ${repoName}: ${this.pathCache[repoName]}`);
            return this.pathCache[repoName];
        }
        
        // Normalize repository name (remove spaces, convert to lowercase)
        const normalizedName = this.normalizeRepoName(repoName);
        this.log(`Looking for image for repo: ${repoName} (normalized: ${normalizedName})`);
        
        // First, check for custom mapping
        if (this.customMappings[normalizedName]) {
            const customPath = this.customMappings[normalizedName];
            this.log(`Found custom mapping for ${normalizedName}: ${customPath}`);
            this.pathCache[repoName] = customPath;
            return customPath;
        }
        
        // Use first extension as default path for src attribute
        // (the onerror handler will try other extensions if this fails)
        const imagePath = `${this.basePath}${normalizedName}.${this.fileExtensions[0]}`;
        
        this.log(`Generated standard path for ${repoName}: ${imagePath}`);
        return imagePath;
    },
    
    /**
     * Get default image for a specific project category
     * @param {string} category - Project category (web, api, app, code)
     * @returns {string} Path to the category default image
     */
    getCategoryImage: function(category) {
        // Default to 'code' if category is invalid
        if (!category || typeof category !== 'string') {
            category = 'code';
        }
        
        category = category.toLowerCase();
        const imagePath = `${this.basePath}default-${category}.jpg`;
        this.log(`Using category fallback for ${category}: ${imagePath}`);
        return imagePath;
    },
    
    /**
     * Map repositories to custom image paths
     * These are checked first before attempting standard paths
     */
    customMappings: {
        // Your actual projects
        'purplewebeditor': 'assets/projects/Purple Web Editor.png',
        'todolistapp': 'assets/projects/To Do List App.png',
        'portfolio': 'assets/projects/Portfolio.png',
        'webapplicationvulnerabilityscanner': 'assets/projects/Web-Application-Vulnerability-Scanner.png',
        'passwordchecker': 'assets/projects/Password Checker.png'
    },
    
    /**
     * Map repositories to specific categories
     * Used for determining fallback images and filtering
     */
    repoCategories: {
        // Your actual projects with updated categories
        'purplewebeditor': 'web',      // Web category
        'todolistapp': 'web',          // Changed from 'app' to 'web'
        'portfolio': 'web',            // Already web
        'webapplicationvulnerabilityscanner': 'app', // Changed from 'api' to 'app'
        'passwordchecker': 'web'       // Changed from 'app' to 'web'
    },
    
    /**
     * Normalize repository name by removing special characters and spaces
     * @param {string} name - Repository name to normalize
     * @returns {string} Normalized name
     */
    normalizeRepoName: function(name) {
        if (!name) return '';
        
        return name.toLowerCase()
            .replace(/-/g, '')
            .replace(/_/g, '')
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, ''); // Remove any non-alphanumeric chars
    },
    
    /**
     * Log a message if debug mode is enabled
     * @param {string} message - Message to log
     */
    log: function(message) {
        if (this.debug) {
            console.log(`[ProjectImages] ${message}`);
        }
    },
    
    /**
     * Try loading an image with different file extensions
     * @param {HTMLImageElement} imgElement - The img element to update
     * @param {string} baseUrl - Base URL without extension
     * @param {number} index - Current index in the extensions array
     * @param {string} fallbackUrl - Ultimate fallback URL if all extensions fail
     */
    tryNextExtension: function(imgElement, baseUrl, index, fallbackUrl) {
        if (index >= this.fileExtensions.length) {
            // We've tried all extensions, use the fallback
            this.log(`All extensions failed for ${baseUrl}, using fallback: ${fallbackUrl}`);
            imgElement.src = fallbackUrl;
            return;
        }
        
        const extension = this.fileExtensions[index];
        const newSrc = `${baseUrl}.${extension}`;
        
        this.log(`Trying extension ${extension} for ${baseUrl}`);
        
        // Set up the error handler for this attempt
        imgElement.onerror = () => {
            this.log(`Failed with extension ${extension}`);
            this.tryNextExtension(imgElement, baseUrl, index + 1, fallbackUrl);
        };
        
        // Try this extension
        imgElement.src = newSrc;
    }
};

// Set up global handler for project images
window.projectImageErrorHandler = function(img, repoName, category) {
    const baseUrl = ProjectImages.basePath + ProjectImages.normalizeRepoName(repoName);
    const fallbackUrl = ProjectImages.getCategoryImage(category);
    
    // Clear any existing error handler
    img.onerror = null;
    
    // Try loading with different extensions
    ProjectImages.tryNextExtension(img, baseUrl, 0, fallbackUrl);
    
    return true; // Prevent default error handling
};

// Log when ProjectImages is loaded
console.log('Enhanced ProjectImages utility loaded');

// Test the image paths for common repositories
if (window.location.search.includes('debug=true')) {
    console.group('Testing ProjectImages paths');
    [
        'portfolio',
        'todo-app',
        'weather-app',
        'calculator'
    ].forEach(repo => {
        const path = ProjectImages.getImagePath(repo);
        console.log(`${repo} -> ${path}`);
    });
    console.groupEnd();
}
