/**
 * Direct project image mapping
 * Simply maps repository names to specific image files
 */

// Direct mapping of project names to image files (relative paths)
window.PROJECT_IMAGES = {
  // Exact mappings - case insensitive
  'password checker': 'assets/projects/Password Checker.png',
  'portfolio': 'assets/projects/Portfolio.png',
  'purple web editor': 'assets/projects/Purple Web Editor.png',
  'to do list app': 'assets/projects/To Do List App.png',
  'todo list app': 'assets/projects/To Do List App.png',
  'web application vulnerability scanner': 'assets/projects/Web-Application-Vulnerability-Scanner.png',
  
  // Default for each category
  '_default_web': 'assets/projects/Portfolio.png',
  '_default_app': 'assets/projects/Web-Application-Vulnerability-Scanner.png',
  '_default_code': 'assets/projects/Password Checker.png'
};

// Simple function to get project image
function getProjectImage(projectName, category = 'code') {
  if (!projectName) return window.PROJECT_IMAGES['_default_code'];
  
  // Try exact match (case insensitive)
  const lowerName = projectName.toLowerCase();
  if (window.PROJECT_IMAGES[lowerName]) {
    return window.PROJECT_IMAGES[lowerName];
  }
  
  // Try with common variations
  if (lowerName.includes('password') || lowerName.includes('checker')) {
    return window.PROJECT_IMAGES['password checker'];
  }
  
  if (lowerName.includes('todo') || lowerName.includes('list')) {
    return window.PROJECT_IMAGES['to do list app'];
  }
  
  if (lowerName.includes('portfolio')) {
    return window.PROJECT_IMAGES['portfolio'];
  }
  
  if (lowerName.includes('editor') || lowerName.includes('purple')) {
    return window.PROJECT_IMAGES['purple web editor'];
  }
  
  if (lowerName.includes('vulnerability') || lowerName.includes('scanner')) {
    return window.PROJECT_IMAGES['web application vulnerability scanner'];
  }
  
  // Fallback to category default
  return window.PROJECT_IMAGES[`_default_${category}`] || window.PROJECT_IMAGES['_default_code'];
}

// Override the ProjectImages.getImagePath function if it exists
if (window.ProjectImages) {
  const originalFunction = window.ProjectImages.getImagePath;
  window.ProjectImages.getImagePath = function(repoName) {
    // Use direct mapping first
    const directImage = getProjectImage(repoName);
    if (directImage) {
      console.log(`[DirectImages] Using direct image for ${repoName}: ${directImage}`);
      return directImage;
    }
    
    // Fall back to original function
    return originalFunction.call(window.ProjectImages, repoName);
  };
}

// Make function available globally
window.getProjectImage = getProjectImage;

console.log('[DirectImages] Loaded direct project image mappings'); 