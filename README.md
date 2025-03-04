# Personal Portfolio Website

A dynamic, modern portfolio website that showcases my development skills, projects, and technical expertise using vanilla HTML, CSS, and JavaScript with GitHub API integration.

## Features

- **GitHub API Integration**: Dynamically fetches and displays my GitHub repositories
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: User preference-based theme switching with local storage persistence
- **Project Filtering**: Filter projects by category (web, API, applications)
- **Interactive UI**: Smooth animations, transitions, and micro-interactions
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
│   └── notifications.css   # Notification component styles
├── js/
│   ├── github-api.js       # GitHub API integration
│   ├── ui-interactions.js  # UI components and interactions
│   └── main.js            # Application initialization
├── assets/
│   ├── favicon.ico         # Site favicon
│   └── images/             # Project images
└── README.md               # Project documentation
```

## Setup and Usage

1. Clone the repository
2. Open `index.html` in your browser
3. No build tools or dependencies required!

## Features

### GitHub Integration

The portfolio automatically pulls my latest repositories from GitHub and displays them as interactive project cards. Each project includes:

- Project name and description
- Primary language used
- Topics/tags
- Links to GitHub repository and live demo (if available)
- Detailed view with additional information

### Theme Switching

The site offers both light and dark themes that respect the user's system preferences but can also be toggled manually. Theme choices are saved to local storage for persistence between visits.

### Responsive Layout

The design adapts to different screen sizes:
- **Desktop**: Full layout with multiple columns
- **Tablet**: Adjusted spacing and layout
- **Mobile**: Single column layout with mobile navigation

## Customization

To use this portfolio for your own projects:

1. Update the GitHub username in `main.js` to your own
2. Modify personal information in `index.html`
3. Customize colors and styling in `css/styles.css`

## License

MIT License - feel free to use and modify for your own portfolio!
