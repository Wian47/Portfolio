/**
 * Clear-Cache.js - Clears browser cache related to GitHub projects
 */

console.log("CACHE: Attempting to clear cached project data");

// Clear sessionStorage items related to GitHub data
if (window.sessionStorage) {
  console.log("CACHE: Clearing sessionStorage");
  sessionStorage.removeItem('github_repos');
  sessionStorage.removeItem('github_stats');
}

// Clear any project-related localStorage items
if (window.localStorage) {
  console.log("CACHE: Clearing project-related localStorage items");
  // List of keys to clear (based on common patterns)
  const keysToRemove = [];
  
  // Find any keys related to projects or images
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
        key.includes('project') || 
        key.includes('repo') || 
        key.includes('github') || 
        key.includes('image'))) {
      keysToRemove.push(key);
    }
  }
  
  // Remove identified keys
  keysToRemove.forEach(key => {
    console.log(`CACHE: Removing localStorage key: ${key}`);
    localStorage.removeItem(key);
  });
}

console.log("CACHE: Cache clearing complete"); 