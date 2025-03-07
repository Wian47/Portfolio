/**
 * Project search functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create search input
    const searchContainer = document.createElement('div');
    searchContainer.className = 'project-search';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'project-search-input';
    searchInput.placeholder = 'Search projects...';
    
    const searchIcon = document.createElement('i');
    searchIcon.className = 'fas fa-search';
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    
    // Insert search before project filters
    const projectFilters = document.querySelector('.project-filters');
    if (projectFilters && projectFilters.parentNode) {
        projectFilters.parentNode.insertBefore(searchContainer, projectFilters);
    }
    
    // Add search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const projects = document.querySelectorAll('.project-card');
        
        projects.forEach(project => {
            const title = project.querySelector('h3').textContent.toLowerCase();
            const description = project.querySelector('p').textContent.toLowerCase();
            const tags = Array.from(project.querySelectorAll('.project-tag'))
                .map(tag => tag.textContent.toLowerCase());
            
            // Check if project matches the search term
            const matchesSearch = title.includes(searchTerm) || 
                              description.includes(searchTerm) ||
                              tags.some(tag => tag.includes(searchTerm));
            
            // Only modify display style if filter state isn't already controlling it
            if (searchTerm === '') {
                // If search is empty, revert to normal filtering
                const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
                const projectCategory = project.dataset.category;
                
                if (activeFilter === 'all' || activeFilter === projectCategory) {
                    project.style.display = 'flex';
                }
            } else {
                // Otherwise apply search filtering
                if (matchesSearch) {
                    project.style.display = 'flex';
                    // Add highlight class
                    project.classList.add('search-highlight');
                } else {
                    project.style.display = 'none';
                    project.classList.remove('search-highlight');
                }
            }
        });
        
        // Update the active class on filter buttons
        if (searchTerm !== '') {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
        }
    });
    
    // Clear search when clicking filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            searchInput.value = '';
            document.querySelectorAll('.project-card').forEach(card => {
                card.classList.remove('search-highlight');
            });
        });
    });
});
