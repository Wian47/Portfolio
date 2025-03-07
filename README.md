# Personal Portfolio Website

A dynamic, modern portfolio website that showcases my development skills, projects, and technical expertise using vanilla HTML, CSS, and JavaScript with GitHub API integration.

## 🔗 [View Live Website](https://wian47.github.io/Portfolio/)

![image](https://github.com/user-attachments/assets/ba2cadee-134f-4bd9-9d60-a62ed7a228a3)

![image](https://github.com/user-attachments/assets/82f55c39-16ed-4652-b107-b620b979495b)

![image](https://github.com/user-attachments/assets/3b31d991-dfb9-4ef0-a099-e704d5b1fbcd)

![image](https://github.com/user-attachments/assets/9fb24b28-f011-4970-a841-9e1fa4a577e8)


## Features

- **GitHub API Integration**: Dynamically fetches and displays my GitHub repositories
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: User preference-based theme switching with local storage persistence
- **Project Filtering**: Filter projects by category (web, API, applications)
- **Interactive UI**: Smooth animations and micro-interactions
- **Enhanced Timeline**: Interactive timeline for showing learning path and certifications
- **Contact Form**: Form validation and submission handling
- **Accessibility Features**: ARIA roles and keyboard navigation support

## Technologies Used

- **HTML5**: Semantic markup for improved accessibility and SEO
- **CSS3**: Custom properties, flexbox, grid, animations, and media queries
- **JavaScript**: ES6+, async/await, DOM manipulation, Intersection Observer API
- **GitHub REST API**: Fetching repository data and user information

## Project Structure

```
portfolio/
├── index.html              # Main HTML document
├── css/
│   ├── styles.css          # Main styles
│   ├── animations.css      # Animation definitions
│   ├── notifications.css   # Notification component styles
│   └── timeline.css        # Timeline component styles
├── js/
│   ├── github-api.js       # GitHub API integration
│   ├── ui-interactions.js  # UI components and interactions
│   ├── main.js            # Application initialization
│   ├── validate.js        # Form validation
│   └── fallback.js        # Fallback handlers
└── README.md               # Project documentation
```

## Setup and Usage

### View Online
Visit the live website at [https://wian47.github.io/Portfolio/](https://wian47.github.io/Portfolio/)

## Key Features

### GitHub Integration

The portfolio automatically pulls my latest repositories from GitHub and displays them as interactive project cards. Each project includes:

- Project name and description
- Primary language used
- Topics/tags
- Links to GitHub repository and live demo (if available)
- Detailed view with additional information

### Enhanced Dark Mode

The site offers both light and dark themes that respect the user's system preferences but can also be toggled manually. The dark mode has been specially optimized to eliminate visual artifacts and ensure a seamless experience.

### Responsive Layout

The design adapts to different screen sizes:
- **Desktop**: Full layout with multiple columns
- **Tablet**: Adjusted spacing and layout
- **Mobile**: Single column layout with mobile navigation and optimized timeline display

### Interactive Timeline

The learning path timeline provides a visual representation of my educational journey and certification path, with:

- Animated timeline dots
- Smooth reveal animations
- Special styling for future goals
- Mobile-optimized layout
