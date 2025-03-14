/**
 * Force-Images.js - Forcibly sets the correct images for specific projects
 * This script runs after everything else and directly modifies the DOM
 */

// Wait until window is fully loaded
window.addEventListener('load', function() {
  console.log("FORCE IMAGES: Running image override script");
  
  // Force image assignments
  setTimeout(forceCorrectImages, 1000);  // 1 second after load
  setTimeout(forceCorrectImages, 3000);  // 3 seconds after load
  setTimeout(forceCorrectImages, 6000);  // 6 seconds after load
});

// Force the correct images regardless of what's already loaded
function forceCorrectImages() {
  console.log("FORCE IMAGES: Applying forced image assignments");
  
  const projectCards = document.querySelectorAll('.project-card');
  if (projectCards.length === 0) {
    console.log("FORCE IMAGES: No project cards found yet, will retry later");
    return;
  }
  
  console.log(`FORCE IMAGES: Found ${projectCards.length} project cards to process`);
  
  // Process each project card
  projectCards.forEach(card => {
    const title = card.querySelector('h3');
    if (!title) return;
    
    const projectName = title.textContent.trim().toLowerCase();
    console.log(`FORCE IMAGES: Processing project "${projectName}"`);
    
    let imagePath = null;
    
    // Direct string matching for exact names
    if (projectName.includes('password') || projectName.includes('check')) {
      imagePath = 'assets/projects/Password Checker.png';
    }
    else if (projectName.includes('todo') || projectName.includes('list')) {
      imagePath = 'assets/projects/To Do List App.png';
    }
    else if (projectName.includes('portfolio')) {
      imagePath = 'assets/projects/Portfolio.png';
    }
    else if (projectName.includes('purple') || projectName.includes('editor')) {
      imagePath = 'assets/projects/Purple Web Editor.png';
    }
    else if (projectName.includes('vulnerability') || projectName.includes('scanner')) {
      imagePath = 'assets/projects/Web-Application-Vulnerability-Scanner.png';
    }
    
    // If we found a match, update the image
    if (imagePath) {
      const imgElement = card.querySelector('img');
      if (imgElement) {
        console.log(`FORCE IMAGES: Setting "${projectName}" image to ${imagePath}`);
        
        // Set both src and a backup to prevent future overwrites
        imgElement.setAttribute('data-forced-src', imagePath);
        imgElement.setAttribute('src', imagePath);
        
        // Add a strongly enforced onerror handler
        imgElement.onerror = function() {
          console.log(`FORCE IMAGES: Error loading ${imagePath}, trying again`);
          if (this.getAttribute('data-forced-src')) {
            this.src = this.getAttribute('data-forced-src');
          }
        };
      }
    }
  });
  
  // Extra handling for specific projects in case titles don't match
  forceSpecificProjectImage('Password Checker', 'assets/projects/Password Checker.png');
  forceSpecificProjectImage('To Do List App', 'assets/projects/To Do List App.png');
  forceSpecificProjectImage('Purple Web Editor', 'assets/projects/Purple Web Editor.png');
  forceSpecificProjectImage('Portfolio', 'assets/projects/Portfolio.png');
  forceSpecificProjectImage('Web Application Vulnerability Scanner', 'assets/projects/Web-Application-Vulnerability-Scanner.png');
}

// Force image for a specific project by title text (case insensitive)
function forceSpecificProjectImage(targetTitle, imagePath) {
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach(card => {
    const title = card.querySelector('h3');
    if (!title) return;
    
    const titleText = title.textContent.trim();
    
    // Check for various ways the title might match
    if (titleText.toLowerCase().includes(targetTitle.toLowerCase()) ||
        targetTitle.toLowerCase().includes(titleText.toLowerCase())) {
      
      console.log(`FORCE IMAGES: Exact match - Setting "${titleText}" image to ${imagePath}`);
      
      const imgElement = card.querySelector('img');
      if (imgElement) {
        imgElement.setAttribute('data-forced-src', imagePath);
        imgElement.setAttribute('src', imagePath);
      }
    }
  });
} 