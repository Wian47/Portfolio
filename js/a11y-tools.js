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
                <div class="resume-header">
                    <h1>Wian Schoeman</h1>
                    <h2>Cyber Security Student &amp; Web Developer</h2>
                    
                    <div class="resume-contact">
                        <div class="resume-contact-item">
                            <span>📧</span>
                            <span>wian.schoeman1@gmail.com</span>
                        </div>
                        <div class="resume-contact-item">
                            <span>📍</span>
                            <span>Bedfordview, Gauteng, South Africa</span>
                        </div>
                        <div class="resume-contact-item">
                            <span>🔗</span>
                            <span>github.com/Wian47</span>
                        </div>
                    </div>
                </div>
                
                <section class="resume-section">
                    <h3>PROFESSIONAL SUMMARY</h3>
                    <p>Aspiring Cyber Security Professional &amp; Web Developer with a passion for protecting digital assets while creating engaging web experiences. Committed to continuous learning and skill development in network security, ethical hacking, and web technologies.</p>
                </section>
                
                <section class="resume-section">
                    <h3>EDUCATION</h3>
                    <div class="resume-item">
                        <h4>Cyber Security Studies</h4>
                        <p class="resume-item-date">Eduvos, Bedfordview, Gauteng | 2024-Present</p>
                        <p>Focusing on network security, ethical hacking, and digital forensics to protect systems and data from emerging threats.</p>
                    </div>
                </section>
                
                <section class="resume-section">
                    <h3>CERTIFICATIONS &amp; TRAINING</h3>
                    <div class="resume-item">
                        <h4>CompTIA Security+ (ITSPA0-MPT)</h4>
                        <p class="resume-item-date">Eduvos, 2024</p>
                        <p>Comprehensive security certification covering network security, compliance, and operational security.</p>
                    </div>
                    <div class="resume-item">
                        <h4>CompTIA A+ (ITVAA0-MPT)</h4>
                        <p class="resume-item-date">Eduvos, 2024</p>
                        <p>Foundation certification for IT operational roles, covering hardware and software troubleshooting.</p>
                    </div>
                    <div class="resume-item">
                        <h4>CompTIA Network+ (ITVNA0-MPT)</h4>
                        <p class="resume-item-date">Eduvos, 2024</p>
                        <p>Networking certification covering design, configuration, management, and troubleshooting.</p>
                    </div>
                </section>
                
                <section class="resume-section">
                    <h3>SKILLS</h3>
                    <div class="skills-list">
                        <div class="skill-category">
                            <h4>Cyber Security</h4>
                            <ul>
                                <li>Network Security</li>
                                <li>Ethical Hacking</li>
                                <li>IT Support</li>
                                <li>Digital Forensics (Basic)</li>
                            </ul>
                        </div>
                        <div class="skill-category">
                            <h4>Programming</h4>
                            <ul>
                                <li>Python</li>
                                <li>JavaScript</li>
                                <li>Flutter/Dart</li>
                                <li>Git Version Control</li>
                            </ul>
                        </div>
                        <div class="skill-category">
                            <h4>Web Development</h4>
                            <ul>
                                <li>HTML5</li>
                                <li>CSS3</li>
                                <li>Responsive Design</li>
                                <li>React (Basic)</li>
                            </ul>
                        </div>
                    </div>
                </section>
                
                <section class="resume-section">
                    <h3>PROFESSIONAL INTERESTS</h3>
                    <p>Network security, ethical hacking, web application security, responsive web development, and open-source security initiatives.</p>
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
                <title>Wian Schoeman - Resume</title>
                <style>
                    /* Core print styles */
                    body {
                        font-family: 'Arial', 'Helvetica', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                        background-color: white;
                    }
                    
                    /* Resume header styles */
                    .resume-header {
                        border-bottom: 2px solid #3a86ff;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        text-align: center;
                    }
                    
                    .resume-header h1 {
                        color: #3a86ff;
                        margin: 0 0 5px 0;
                        font-size: 28pt;
                    }
                    
                    .resume-header h2 {
                        font-size: 16pt;
                        font-weight: normal;
                        margin: 0 0 12px 0;
                    }
                    
                    .resume-contact {
                        display: flex;
                        justify-content: center;
                        flex-wrap: wrap;
                        gap: 15px;
                        margin: 10px 0;
                    }
                    
                    .resume-contact-item {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                    
                    /* Section styling */
                    .resume-section {
                        margin-bottom: 20px;
                        page-break-inside: avoid;
                    }
                    
                    .resume-section h3 {
                        color: #3a86ff;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                        margin-top: 22px;
                        margin-bottom: 12px;
                        font-size: 14pt;
                    }
                    
                    .resume-item {
                        margin-bottom: 15px;
                        page-break-inside: avoid;
                    }
                    
                    .resume-item h4 {
                        margin: 0 0 5px 0;
                        font-size: 12pt;
                    }
                    
                    .resume-item p {
                        margin: 0 0 5px 0;
                        font-size: 11pt;
                    }
                    
                    .resume-item-date {
                        font-style: italic;
                        color: #555;
                    }
                    
                    /* Skills layout */
                    .skills-list {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    
                    .skill-category {
                        page-break-inside: avoid;
                    }
                    
                    .skill-category h4 {
                        margin: 0 0 8px 0;
                        font-size: 12pt;
                        color: #3a86ff;
                    }
                    
                    .skill-category ul {
                        padding-left: 20px;
                        margin: 0;
                    }
                    
                    .skill-category li {
                        margin-bottom: 3px;
                        font-size: 11pt;
                    }
                    
                    .resume-projects {
                        margin-bottom: 20px;
                    }
                    
                    .project-item {
                        margin-bottom: 10px;
                    }
                    
                    .project-item h4 {
                        margin: 0 0 3px 0;
                    }
                    
                    /* Make sure page breaks are handled properly */
                    h1, h2, h3, h4 {
                        page-break-after: avoid;
                    }
                    
                    .resume-item, .skill-category {
                        page-break-inside: avoid;
                    }
                    
                    @media print {
                        body {
                            padding: 0;
                            margin: 0;
                        }
                        
                        .resume-header {
                            padding-top: 20px;
                        }
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
