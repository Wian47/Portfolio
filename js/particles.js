/**
 * Particle animation system for portfolio background
 * Creates a subtle, interactive particle effect that matches the current theme
 */

class ParticleBackground {
    constructor(options = {}) {
        // Default configuration
        this.config = {
            selector: options.selector || '.particle-background',
            particleCount: options.particleCount || 50,
            particleSize: options.particleSize || 3, // Increased from 2
            particleOpacity: options.particleOpacity || 0.5, // Increased from 0.3
            particleSpeed: options.particleSpeed || 0.5,
            lineOpacity: options.lineOpacity || 0.2, // Increased from 0.1
            maxDistance: options.maxDistance || 150,
            interactivity: options.interactivity !== undefined ? options.interactivity : true,
            colors: options.colors || null
        };
        
        // Canvas context and dimensions
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        
        // Particles array
        this.particles = [];
        
        // Mouse position for interactivity
        this.mouse = {
            x: null,
            y: null,
            radius: 100
        };
        
        // Animation state
        this.animationFrame = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the particle background
     */
    init() {
        // Create canvas if it doesn't exist
        const container = document.querySelector(this.config.selector);
        if (!container) {
            console.error(`Particle container (${this.config.selector}) not found!`);
            return;
        }
        
        // Create canvas element with modifications for global visibility
        this.canvas = document.createElement('canvas');
        this.canvas.style.zIndex = "-1"; // Place behind all content but still visible
        this.canvas.style.pointerEvents = "none"; // Ensure clicks pass through
        this.canvas.style.position = "absolute"; // Position absolutely within the fixed container
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas dimensions
        this.resize();
        
        // Add resize event listener
        window.addEventListener('resize', () => this.resize());
        
        // Add mouse move event listener for interactivity
        if (this.config.interactivity) {
            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
            
            // Reset mouse position when mouse leaves window
            window.addEventListener('mouseout', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });
        }
        
        // Create particles
        this.createParticles();
        
        // Start animation
        this.animate();
        
        console.log('Particle background initialized');
    }
    
    /**
     * Update canvas dimensions on resize
     */
    resize() {
        const container = document.querySelector(this.config.selector);
        if (!container) return;
        
        this.width = container.offsetWidth;
        this.height = container.offsetHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Recreate particles on resize
        if (this.particles.length) {
            this.particles = [];
            this.createParticles();
        }
    }
    
    /**
     * Create particles based on configuration
     */
    createParticles() {
        // Get theme colors if no colors provided
        const colors = this.config.colors || this.getThemeColors();
        
        for (let i = 0; i < this.config.particleCount; i++) {
            const size = (Math.random() * this.config.particleSize) + 0.5;
            const x = Math.random() * (this.width - size * 2) + size;
            const y = Math.random() * (this.height - size * 2) + size;
            const directionX = (Math.random() * 2) - 1;
            const directionY = (Math.random() * 2) - 1;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push({
                x,
                y,
                size,
                directionX: directionX * this.config.particleSpeed,
                directionY: directionY * this.config.particleSpeed,
                color,
                opacity: Math.random() * this.config.particleOpacity
            });
        }
    }
    
    /**
     * Draw particles and connections
     */
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw particles and check connections
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${p1.color}, ${p1.opacity})`;
            this.ctx.fill();
            
            // Check for connections with other particles
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const distance = this.getDistance(p1, p2);
                
                if (distance < this.config.maxDistance) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(${p1.color}, ${this.config.lineOpacity * (1 - distance / this.config.maxDistance)})`;
                    this.ctx.lineWidth = p1.size / 3;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
            
            // Draw connections to mouse if in range
            if (this.config.interactivity && this.mouse.x && this.mouse.y) {
                const mouseDistance = this.getDistance(p1, this.mouse);
                if (mouseDistance < this.mouse.radius) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(${p1.color}, ${this.config.lineOpacity * (1 - mouseDistance / this.mouse.radius)})`;
                    this.ctx.lineWidth = p1.size / 3;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * Update particle positions
     */
    update() {
        for (const particle of this.particles) {
            // Move particles
            particle.x += particle.directionX;
            particle.y += particle.directionY;
            
            // Bounce off edges
            if (particle.x > this.width - particle.size || particle.x < particle.size) {
                particle.directionX = -particle.directionX;
            }
            
            if (particle.y > this.height - particle.size || particle.y < particle.size) {
                particle.directionY = -particle.directionY;
            }
            
            // Mouse interactivity
            if (this.config.interactivity && this.mouse.x && this.mouse.y) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouse.radius) {
                    const forceX = dx / distance;
                    const forceY = dy / distance;
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    
                    particle.x += forceX * force * 2;
                    particle.y += forceY * force * 2;
                }
            }
        }
    }
    
    /**
     * Main animation loop
     */
    animate() {
        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Get distance between two points
     */
    getDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get colors from current theme
     */
    getThemeColors() {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        
        // Default colors for light theme - with increased contrast
        let colors = [
            '25, 95, 200',    // darker blue for better visibility in light mode
            '95, 15, 180',    // darker purple for better visibility in light mode
            '220, 150, 5'     // darker yellow for better visibility in light mode
        ];
        
        // Override for dark theme
        if (isDarkTheme) {
            colors = [
                '76, 201, 240',  // primary cyan
                '114, 9, 183',   // secondary purple
                '247, 37, 133'   // highlight pink
            ];
        }
        
        return colors;
    }
    
    /**
     * Pause animation
     */
    pause() {
        cancelAnimationFrame(this.animationFrame);
    }
    
    /**
     * Resume animation
     */
    resume() {
        this.animate();
    }
    
    /**
     * Update particle colors based on current theme
     */
    updateColors() {
        const colors = this.getThemeColors();
        
        for (const particle of this.particles) {
            particle.color = colors[Math.floor(Math.random() * colors.length)];
        }
    }
}

// Initialize particle background when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create particle container if it doesn't exist
    if (!document.querySelector('.particle-background')) {
        const container = document.createElement('div');
        container.className = 'particle-background';
        container.style.pointerEvents = "none"; // Ensure clicks pass through
        container.style.zIndex = "-1"; // Behind all content but still visible
        
        // Insert at the beginning of body for global coverage
        document.body.insertBefore(container, document.body.firstChild);
    }
    
    // Initialize particles with adjusted settings for better visibility
    const isMobile = window.innerWidth < 768;
    const particles = new ParticleBackground({
        particleCount: isMobile ? 35 : 60, // Increased particle count
        particleSize: isMobile ? 2 : 3,    // Increased size
        particleOpacity: 0.5,              // Increased opacity
        lineOpacity: 0.2                   // Increased line opacity
    });
    
    // Update colors when theme changes
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
        // Wait for theme change to complete
        setTimeout(() => particles.updateColors(), 300);
    });
    
    // Expose to window for debugging
    window.particles = particles;
});
