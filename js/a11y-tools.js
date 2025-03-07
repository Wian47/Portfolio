/**
 * Accessibility tools for the portfolio website
 * Includes language switching and other accessibility features
 */

// Initialize the a11y tools object
window.a11yTools = {
    // Initialize accessibility features
    init: function() {
        console.log("Initializing accessibility tools");
        
        // Add print resume button functionality
        this.initPrintResume();
        
        console.log("Accessibility tools initialized.");
    },
    
    // Initialize print resume functionality
    initPrintResume: function() {
        // Find print resume button
        let printBtn = document.getElementById('print-resume-btn');
        
        if (printBtn) {
            // Add click event to the button
            printBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.printResume();
            });
        } else {
            console.warn('Print resume button not found in the DOM');
        }
    },
    
    // Print resume function
    printResume: function() {
        console.log('Printing resume...');
        
        // Create print-only content that will only show during print
        const resumeContent = `
            <div class="print-resume">
                <h1>Wian's Resume</h1>
                <div class="resume-header">
                    <h2>Cyber Security Student & Web Developer</h2>
                    <p>Email: wian.schoeman1@gmail.com</p>
                    <p>Location: Bedfordview, Gauteng, South Africa</p>
                    <p>GitHub: github.com/Wian47</p>
                </div>
                
                <section class="resume-section">
                    <h3>About Me</h3>
                    <p>Aspiring Cyber Security Professional & Web Developer with a passion for protecting digital assets while creating engaging web experiences.</p>
                </section>
                
                <section class="resume-section">
                    <h3>Education</h3>
                    <div class="resume-item">
                        <h4>Cyber Security Studies</h4>
                        <p>Eduvos, Bedfordview, Gauteng | 2024-Present</p>
                    </div>
                </section>
                
                <section class="resume-section">
                    <h3>Certifications & Training</h3>
                    <div class="resume-item">
                        <h4>CompTIA Security+ (ITSPA0-MPT)</h4>
                        <p>Eduvos, 2024</p>
                    </div>
                    <div class="resume-item">
                        <h4>CompTIA A+ (ITVAA0-MPT)</h4>
                        <p>Eduvos, 2024</p>
                    </div>
                    <div class="resume-item">
                        <h4>CompTIA Network+ (ITVNA0-MPT)</h4>
                        <p>Eduvos, 2024</p>
                    </div>
                </section>
                
                <section class="resume-section">
                    <h3>Skills</h3>
                    <div class="skills-list">
                        <div class="skill-category">
                            <h4>Cyber Security</h4>
                            <ul>
                                <li>Network Security</li>
                                <li>Ethical Hacking</li>
                                <li>IT Support</li>
                            </ul>
                        </div>
                        <div class="skill-category">
                            <h4>Programming</h4>
                            <ul>
                                <li>Python</li>
                                <li>JavaScript</li>
                                <li>Flutter/Dart</li>
                            </ul>
                        </div>
                        <div class="skill-category">
                            <h4>Web Development</h4>
                            <ul>
                                <li>HTML5</li>
                                <li>CSS3</li>
                                <li>React</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        `;
        
        // Create and append a hidden iframe to handle printing
        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'absolute';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.opacity = '0';
        document.body.appendChild(printIframe);
        
        // Set up the iframe document with resume content and styles
        const doc = printIframe.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Wian's Resume</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        padding: 20px;
                    }
                    h1 {
                        color: #3a86ff;
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .resume-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 20px;
                    }
                    .resume-header h2 {
                        color: #3a86ff;
                        margin: 0 0 10px 0;
                    }
                    .resume-header p {
                        margin: 5px 0;
                    }
                    .resume-section {
                        margin-bottom: 20px;
                    }
                    .resume-section h3 {
                        color: #3a86ff;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                    }
                    .resume-item {
                        margin-bottom: 15px;
                    }
                    .resume-item h4 {
                        margin: 0 0 5px 0;
                    }
                    .skills-list {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                    }
                    .skill-category ul {
                        padding-left: 20px;
                    }
                </style>
            </head>
            <body>
                ${resumeContent}
            </body>
            </html>
        `);
        doc.close();
        
        // Wait for the content to load, then print
        setTimeout(() => {
            printIframe.contentWindow.print();
            
            // Remove the iframe after printing
            setTimeout(() => {
                document.body.removeChild(printIframe);
            }, 500);
        }, 500);
    }
};

// Initialize a11y tools when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize a11y tools
    window.a11yTools.init();
});
