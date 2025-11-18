
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronLeft, ChevronRight, Shield, Code, Terminal, Cpu, GraduationCap, Users, Zap, MessageSquare, Mail, Github, Linkedin } from 'lucide-react';
import FluidBackground from './components/FluidBackground';
import GradientText from './components/GlitchText';
import CustomCursor from './components/CustomCursor';
import ProjectCard from './components/ArtistCard';
import AIChat from './components/AIChat';
import { Project } from './types';

// Projects Data simulating Wian's skills
const PROJECTS: Project[] = [
  { 
    id: '1', 
    title: 'Network Sentinel', 
    category: 'Python / Cybersecurity', 
    year: '2024', 
    image: 'https://images.unsplash.com/photo-1558494949-efc5e60c9480?q=80&w=1000&auto=format&fit=crop',
    description: 'A Python-based network traffic analyzer designed to detect anomalies and potential security breaches in real-time. Features packet sniffing and automated log generation.'
  },
  { 
    id: '2', 
    title: 'SecureChat', 
    category: 'Flutter / Dart', 
    year: '2024', 
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
    description: 'A cross-platform mobile messaging application focusing on end-to-end encryption. Built with Flutter, ensuring privacy and data integrity for users.'
  },
  { 
    id: '3', 
    title: 'Portfolio V1', 
    category: 'React / TypeScript', 
    year: '2025', 
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000&auto=format&fit=crop',
    description: 'An interactive portfolio website showcasing my journey as a developer. Utilizes Framer Motion for animations and Tailwind CSS for responsive design.'
  },
  { 
    id: '4', 
    title: 'Linux Hardener', 
    category: 'Bash / Linux', 
    year: '2024', 
    image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca52?q=80&w=1000&auto=format&fit=crop',
    description: 'Automated bash script suite for hardening Linux servers. Disables unused services, configures firewalls, and audits user permissions.'
  },
  { 
    id: '5', 
    title: 'Ethical Hack Lab', 
    category: 'Documentation', 
    year: '2024', 
    image: 'https://images.unsplash.com/photo-1563206767-5b1d97281917?q=80&w=1000&auto=format&fit=crop',
    description: 'Comprehensive documentation and reports from controlled penetration testing environments, focusing on vulnerability assessment and mitigation strategies.'
  },
  { 
    id: '6', 
    title: 'Visual CSS Art', 
    category: 'HTML5 / CSS3', 
    year: '2023', 
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop',
    description: 'A collection of pure CSS experiments and visual designs, demonstrating the creative potential of modern web styling techniques.'
  },
];

const TECH_STACK = [
  { name: 'Python', color: 'bg-[#3776AB]' },
  { name: 'Java', color: 'bg-[#007396]' },
  { name: 'Flutter/Dart', color: 'bg-[#02569B]' },
  { name: 'HTML5', color: 'bg-[#E34F26]' },
  { name: 'CSS3', color: 'bg-[#1572B6]' },
  { name: 'Linux', color: 'bg-[#FCC624] text-black' },
  { name: 'Git', color: 'bg-[#F05032]' },
  { name: 'TypeScript', color: 'bg-[#3178C6]' },
];

const App: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedProject) return;
      if (e.key === 'ArrowLeft') navigateProject('prev');
      if (e.key === 'ArrowRight') navigateProject('next');
      if (e.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navigateProject = (direction: 'next' | 'prev') => {
    if (!selectedProject) return;
    const currentIndex = PROJECTS.findIndex(p => p.id === selectedProject.id);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % PROJECTS.length;
    } else {
      nextIndex = (currentIndex - 1 + PROJECTS.length) % PROJECTS.length;
    }
    setSelectedProject(PROJECTS[nextIndex]);
  };
  
  return (
    <div className="relative min-h-screen text-white selection:bg-[#6c5ce7] selection:text-white cursor-auto md:cursor-none overflow-x-hidden">
      <CustomCursor />
      <FluidBackground />
      <AIChat />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-8 py-6 mix-blend-difference">
        <div className="font-heading text-xl md:text-2xl font-bold tracking-tighter text-white cursor-default z-50">WIAN.DEV</div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-10 text-sm font-bold tracking-widest uppercase">
          {['About', 'Projects', 'Contact'].map((item) => (
            <button 
              key={item} 
              onClick={() => scrollToSection(item.toLowerCase())}
              className="hover:text-[#a8fbd3] transition-colors text-white cursor-pointer bg-transparent border-none"
              data-hover="true"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white z-50 relative w-10 h-10 flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
           {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 bg-[#1a1b3b]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {['About', 'Projects', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-4xl font-heading font-bold text-white hover:text-[#a8fbd3] transition-colors uppercase bg-transparent border-none"
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <header className="relative h-[100svh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden px-4">
        <motion.div 
          style={{ y, opacity }}
          className="z-10 text-center flex flex-col items-center w-full max-w-6xl pb-24 md:pb-20"
        >
           {/* Role Tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex items-center gap-3 md:gap-4 text-xs md:text-sm font-mono text-[#a8fbd3] tracking-[0.2em] uppercase mb-6 bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm border border-white/10"
          >
            <Shield className="w-4 h-4" />
            <span>Cyber Security</span>
            <span className="text-white/30">|</span>
            <Code className="w-4 h-4" />
            <span>Web Development</span>
          </motion.div>

          {/* Main Title */}
          <div className="relative w-full flex justify-center items-center flex-col">
             <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-3xl font-light tracking-[0.5em] uppercase mb-4 text-white/80"
            >
              Hi there, I'm
            </motion.h2>
            <GradientText 
              text="WIAN" 
              as="h1" 
              className="text-[20vw] md:text-[18vw] leading-[0.8] font-black tracking-tighter text-center" 
            />
          </div>
          
          <motion.div
             initial={{ scaleX: 0 }}
             animate={{ scaleX: 1 }}
             transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
             className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent mt-8 mb-8"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-base md:text-xl font-light max-w-2xl mx-auto text-white/80 leading-relaxed drop-shadow-lg px-4"
          >
            Aspiring Cyber Security Professional & Web Developer
          </motion.p>
        </motion.div>
      </header>

      {/* ABOUT & TECHNOLOGIES SECTION */}
      <section id="about" className="relative z-10 py-20 md:py-32 bg-black/20 backdrop-blur-sm border-t border-white/10 overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute top-1/2 left-[-20%] w-[50vw] h-[50vw] bg-[#6c5ce7]/20 rounded-full blur-[60px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
            
            {/* Text Content */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <h2 className="text-4xl md:text-6xl font-heading font-bold mb-8 leading-tight flex items-center gap-4">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8fbd3] to-[#4fb7b3]">Me</span>
              </h2>
              
              <div className="prose prose-invert max-w-none text-gray-200 text-lg font-light leading-relaxed">
                <p className="mb-6">
                  Aspiring Cyber Security Professional & Web Developer with a strong foundation in information security and a passion for protecting digital assets. I'm currently pursuing Cyber Security studies and actively learning about network security, ethical hacking, and IT support.
                </p>
                <p className="mb-8">
                  I also love web development—especially designing engaging, visually appealing websites with CSS, which fuels my creative side. My goal is to secure digital environments while crafting dynamic web experiences.
                </p>
                
                <div className="space-y-4 mt-8">
                  {[
                    { icon: GraduationCap, label: 'Studies', text: 'Cyber Security at Eduvos, Bedfordview, Gauteng (since February 2024)' },
                    { icon: Users, label: 'Collaboration', text: 'Interested in cybersecurity projects and open-source security initiatives' },
                    { icon: Code, label: 'Web Development', text: 'Passionate about building engaging websites with creative CSS design' },
                    { icon: Zap, label: 'Seeking Guidance', text: 'Looking to expand my skills in network security and ethical hacking' },
                    { icon: MessageSquare, label: 'Ask Me About', text: 'Cyber security fundamentals, IT support, programming, and web development' },
                    { icon: Mail, label: 'Reach Me', text: 'wian.schoeman1@gmail.com', link: 'mailto:wian.schoeman1@gmail.com' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="mt-1 p-2 rounded-lg bg-white/5 group-hover:bg-[#6c5ce7]/20 transition-colors">
                        <item.icon className="w-4 h-4 text-[#a8fbd3]" />
                      </div>
                      <div>
                        <span className="font-bold text-white mr-2">{item.label}:</span>
                        {item.link ? (
                           <a href={item.link} className="text-[#a8fbd3] hover:underline">{item.text}</a>
                        ) : (
                           <span className="text-gray-300">{item.text}</span>
                        )}
                      </div>
                    </div>
                  ))}
                   <div className="flex items-start gap-4 group mt-4 p-4 bg-[#6c5ce7]/10 rounded-xl border border-[#6c5ce7]/20">
                      <div className="mt-1">
                        <Zap className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <span className="font-bold text-white mr-2">Fun Fact:</span>
                        <span className="text-gray-300">I love exploring emerging security technologies and new programming languages</span>
                      </div>
                    </div>
                </div>
              </div>

              {/* Technologies Section Inline */}
              <div className="mt-12 pt-12 border-t border-white/10">
                <h3 className="text-2xl font-heading font-bold mb-6 text-white">Technologies & Tools</h3>
                <div className="flex flex-wrap gap-3">
                  {TECH_STACK.map((tech, i) => (
                    <motion.span
                      key={i}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide ${tech.color} text-white shadow-lg shadow-black/20 cursor-default`}
                    >
                      {tech.name}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side Graphic */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="relative h-[400px] lg:h-[600px] w-full sticky top-32">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6c5ce7] to-[#a8fbd3] rounded-3xl rotate-3 opacity-20 blur-xl" />
                <div className="relative h-full w-full rounded-3xl overflow-hidden border border-white/10 bg-[#0f1021] flex flex-col items-center justify-center p-8 shadow-2xl">
                   <Terminal className="w-24 h-24 text-[#a8fbd3] mb-6 opacity-80" />
                   <div className="w-full space-y-3 font-mono text-xs md:text-sm opacity-70">
                      <div className="flex gap-2">
                        <span className="text-pink-500">user@wian-dev</span>
                        <span className="text-white">:~$</span>
                        <span className="text-yellow-300">./init_portfolio.sh</span>
                      </div>
                      <div className="text-gray-400 pl-4">
                        > Loading modules...<br/>
                        > Accessing secure vault...<br/>
                        > Decrypting project files...<br/>
                        > <span className="text-green-400">Success!</span>
                      </div>
                      <div className="h-px w-full bg-white/10 my-4" />
                      <div className="flex gap-2 animate-pulse">
                        <span className="text-pink-500">user@wian-dev</span>
                        <span className="text-white">:~$</span>
                        <span className="w-2 h-5 bg-white/50 block" />
                      </div>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PROJECTS SECTION */}
      <section id="projects" className="relative z-10 py-20 md:py-32">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
           <div className="mb-12 md:mb-16 px-4">
             <h2 className="text-5xl md:text-8xl font-heading font-bold uppercase leading-[0.9] drop-shadow-lg break-words">
              Featured <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c5ce7] to-[#a8fbd3]">Projects</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/10 bg-black/20 backdrop-blur-sm">
            {PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / CONNECT SECTION */}
      <section id="contact" className="relative z-10 py-20 md:py-32 px-4 md:px-6 bg-black/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
             <h2 className="text-5xl md:text-8xl font-heading font-bold text-white opacity-90">
               CONNECT
             </h2>
             <p className="text-[#a8fbd3] font-mono uppercase tracking-widest mt-2 relative z-10 text-sm md:text-base">
               Let's secure the future together
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                name: 'Email Me', 
                value: 'wian.schoeman1@gmail.com', 
                icon: Mail, 
                action: 'Send Email',
                href: 'mailto:wian.schoeman1@gmail.com',
                color: 'white', 
                accent: 'bg-white/5' 
              },
              { 
                name: 'GitHub', 
                value: '@wian-dev', 
                icon: Github, 
                action: 'View Profile',
                href: '#',
                color: 'purple', 
                accent: 'bg-[#6c5ce7]/10 border-[#6c5ce7]/50' 
              },
              { 
                name: 'LinkedIn', 
                value: 'Wian Schoeman', 
                icon: Linkedin, 
                action: 'Connect',
                href: '#',
                color: 'teal', 
                accent: 'bg-[#4fb7b3]/10 border-[#4fb7b3]/50' 
              },
            ].map((item, i) => (
              <motion.a
                key={i}
                href={item.href}
                target={i > 0 ? "_blank" : undefined}
                rel="noopener noreferrer"
                whileHover={{ y: -10 }}
                className={`relative p-8 md:p-10 border border-white/10 backdrop-blur-md flex flex-col justify-between min-h-[300px] transition-all duration-300 ${item.accent} group cursor-pointer`}
                data-hover="true"
              >
                <div>
                  <item.icon className={`w-10 h-10 mb-6 ${item.color === 'white' ? 'text-white' : item.color === 'purple' ? 'text-[#6c5ce7]' : 'text-[#4fb7b3]'}`} />
                  <h3 className="text-2xl font-heading font-bold mb-2 text-white">{item.name}</h3>
                  <p className="text-white/60 font-mono text-sm">{item.value}</p>
                </div>
                
                <div className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">
                  {item.action} <ArrowUpRight className="w-4 h-4" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-12 md:py-16 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
             <div className="font-heading text-2xl font-bold tracking-tighter mb-2 text-white">WIAN.DEV</div>
             <div className="flex gap-2 text-xs font-mono text-gray-400">
               <span>&copy; {new Date().getFullYear()} Wian Schoeman</span>
             </div>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github className="w-5 h-5"/></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5"/></a>
            <a href="mailto:wian.schoeman1@gmail.com" className="text-gray-400 hover:text-white transition-colors"><Mail className="w-5 h-5"/></a>
          </div>
        </div>
      </footer>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProject(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-[#1a1b3b] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-[#6c5ce7]/20"
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors"
                data-hover="true"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); navigateProject('prev'); }}
                className="absolute left-4 bottom-4 translate-y-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors border border-white/10 backdrop-blur-sm"
                data-hover="true"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); navigateProject('next'); }}
                className="absolute right-4 bottom-4 translate-y-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors border border-white/10 backdrop-blur-sm md:right-8"
                data-hover="true"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image Side */}
              <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={selectedProject.id}
                    src={selectedProject.image} 
                    alt={selectedProject.title} 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b3b] via-transparent to-transparent md:bg-gradient-to-r" />
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2 p-8 pb-24 md:p-12 flex flex-col justify-center relative">
                <motion.div
                  key={selectedProject.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 text-[#a8fbd3] mb-4">
                     <Cpu className="w-4 h-4" />
                     <span className="font-mono text-sm tracking-widest uppercase">{selectedProject.year}</span>
                  </div>
                  
                  <h3 className="text-3xl md:text-5xl font-heading font-bold uppercase leading-none mb-2 text-white">
                    {selectedProject.title}
                  </h3>
                  
                  <p className="text-lg text-[#6c5ce7] font-bold tracking-widest uppercase mb-6">
                    {selectedProject.category}
                  </p>
                  
                  <div className="h-px w-20 bg-white/20 mb-6" />
                  
                  <p className="text-gray-300 leading-relaxed text-lg font-light mb-8">
                    {selectedProject.description}
                  </p>

                  <div className="flex gap-4">
                     <button className="px-6 py-3 bg-white text-black font-bold uppercase text-xs tracking-widest hover:bg-[#a8fbd3] transition-colors" data-hover="true">
                        View Source
                     </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for Icon display in Contact cards
function ArrowUpRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  )
}

export default App;
