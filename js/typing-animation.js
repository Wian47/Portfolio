/**
 * Typing animation for the hero section
 */
document.addEventListener('DOMContentLoaded', function() {
    const heroTitle = document.querySelector('.hero h1');
    
    if(!heroTitle) return;
    
    // Store the complete text including the greeting and name
    const fullText = "Hi, I'm <span class='highlight'>Wian</span>";
    
    // Function to initialize typing animation
    function initTypingAnimation() {
        // First clear the content
        heroTitle.innerHTML = '';
        
        // Create a span to hold the typing text
        const typingSpan = document.createElement('span');
        typingSpan.classList.add('typing-text');
        heroTitle.appendChild(typingSpan);
        
        // Add the span for cursor
        const cursorSpan = document.createElement('span');
        cursorSpan.classList.add('cursor');
        cursorSpan.textContent = '|';
        heroTitle.appendChild(cursorSpan);
        
        let tempContent = '';
        let charIndex = 0;
        
        // Function to type characters one by one
        function typeChar() {
            if (charIndex < fullText.length) {
                // Check if we're at the start of the highlight span
                if (fullText.substring(charIndex).startsWith("<span class='highlight'>")) {
                    tempContent += "<span class='highlight'>";
                    charIndex += "<span class='highlight'>".length;
                } 
                // Check if we're at the end of the highlight span
                else if (fullText.substring(charIndex).startsWith("</span>")) {
                    tempContent += "</span>";
                    charIndex += "</span>".length;
                } else {
                    // Regular character
                    tempContent += fullText.charAt(charIndex);
                    charIndex++;
                }
                
                typingSpan.innerHTML = tempContent;
                
                // Slightly slower typing - between 50-80ms between characters
                setTimeout(typeChar, Math.random() * 30 + 50);
            } else {
                // Done typing, remove cursor after a delay
                setTimeout(() => {
                    cursorSpan.style.display = 'none';
                }, 1500); // Longer display of cursor at the end
            }
        }
        
        // Start typing after a short delay
        setTimeout(typeChar, 400); // Slight delay before starting
    }
    
    // Start the animation when the page loads
    initTypingAnimation();
});
