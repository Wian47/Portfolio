/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import Grain from './components/Grain';
import CustomCursor from './components/CustomCursor';
import ProjectCard from './components/ProjectCard';
import Reveal from './components/Reveal';
import { Project } from './types';
import { fetchGitHubProjects } from './utils/github';
import { usePerfTier } from './utils/perf';
import trueNASLogo from './assets/TrueNAS.png';
import zimaOSLogo from './assets/ZimaOS.png';

const TECH_STACK = [
  'Python', 'C / C++', 'Go', 'Bash', 'PowerShell', 'SQL', 'JavaScript',
  'Linux', 'Git', 'TrueNAS', 'ZimaOS', 'PenTest+ (Coursework)',
  'CASP+ (Coursework)', 'CompTIA A+ (Coursework)', 'CompTIA Network+ (Coursework)'
];

const SECTIONS = [
  { id: 'about', index: '01', label: 'About' },
  { id: 'work', index: '02', label: 'Work' },
  { id: 'contact', index: '03', label: 'Contact' }
];

const PROFILE = [
  { label: 'Studies', value: "Bachelor's Degree in Cyber Security at Eduvos (Block 4, in progress) — following a completed Higher Certificate in Information Systems (Feb 2024 – Dec 2025)" },
  { label: 'Focus', value: 'IT Support, Server Deployment, and Network Security' },
  { label: 'Tech', value: 'Fluent in Python, Bash, and Network Protocols' },
  { label: 'Goal', value: 'Securing digital environments and critical infrastructure' },
  { label: 'Ask me about', value: 'TrueNAS Deployments, Home Lab Infrastructure, and Penetration Testing' }
];

const CONTACT = [
  { name: 'Email', value: 'wian.schoeman1@gmail.com', href: 'mailto:wian.schoeman1@gmail.com' },
  { name: 'GitHub', value: '@Wian47', href: 'https://github.com/Wian47' },
  { name: 'X', value: '@WianS47', href: 'https://x.com/WianS47' }
];

const YEAR = new Date().getFullYear().toString();

const MANUAL_PROJECTS: Project[] = [
  {
    id: 'truenas-deployment',
    title: 'Small Business TrueNAS Deployment',
    category: 'TrueNAS / Server Administration',
    image: trueNASLogo,
    year: YEAR,
    description: `The Challenge: The client relied on expensive, recurring third-party cloud storage and had a legacy HP ProLiant MicroServer Gen7 gathering dust.

The Solution: I repurposed the legacy hardware, installing and configuring TrueNAS to create a robust, on-premises Network-Attached Storage (NAS) solution.

Key Implementations:
• Configured secure local network access (SMB shares) for company employees.
• Implemented automated backup routines to ensure data integrity.
• Managed user permissions and access controls.

The Outcome: Successfully eliminated monthly cloud storage fees while increasing local file transfer speeds and maintaining strict data ownership.`
  },
  {
    id: 'zimaos-home-server',
    title: 'ZimaOS Home Server & VPN Infrastructure',
    category: 'ZimaOS / Networking / VPN',
    image: zimaOSLogo,
    year: YEAR,
    description: `The Project: Engineered a comprehensive, self-hosted cloud and media environment to bypass reliance on big-tech data silos.
Hardware: Dell OptiPlex 3060 Micro.

Key Implementations:
• Deployed ZimaOS as the base operating system for streamlined container management.
• Hosted Nextcloud for secure file synchronization and document management.
• Deployed Immich for high-performance photo and video backup.
• Engineered a zero-trust network perimeter using Tailscale (WireGuard), allowing secure, encrypted remote access to the internal network from anywhere in the world without exposing ports to the public internet.`
  }
];

const App: React.FC = () => {
  const isLite = usePerfTier() === 'lite';
  const [projects, setProjects] = useState<Project[]>(MANUAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchGitHubProjects().then((githubProjects) => {
      if (githubProjects.length > 0) setProjects([...MANUAL_PROJECTS, ...githubProjects]);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keep the page still behind the modal
  useEffect(() => {
    document.body.style.overflow = selectedProject ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
      if (e.key === 'ArrowLeft') navigateProject(-1);
      if (e.key === 'ArrowRight') navigateProject(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProject, projects]);

  const navigateProject = (step: number) => {
    setSelectedProject((current) => {
      if (!current) return current;
      const i = projects.findIndex((p) => p.id === current.id);
      return projects[(i + step + projects.length) % projects.length];
    });
  };

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 80,
      behavior: isLite ? 'auto' : 'smooth'
    });
  };

  return (
    <div className={`relative min-h-screen bg-ink text-paper ${isLite ? '' : 'md:cursor-none'}`}>
      <CustomCursor />
      <Grain />

      {/* ── Masthead ───────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${
          scrolled
            ? `border-ink-line ${isLite ? 'bg-ink' : 'bg-ink/85 backdrop-blur-md'}`
            : 'border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-12">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: isLite ? 'auto' : 'smooth' })}
            className="font-display text-xl tracking-tight text-paper"
            data-hover="true"
            aria-label="Back to top"
          >
            Wian<span className="text-ember">.</span>
          </button>

          <nav className="hidden items-center gap-10 md:flex">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                data-hover="true"
                className="group flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-label text-paper-dim transition-colors hover:text-paper"
              >
                <span className="text-ember/70">{s.index}</span>
                {s.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-paper md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col items-start justify-center gap-2 bg-ink px-8 md:hidden"
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="flex items-baseline gap-4 py-2 text-left"
              >
                <span className="font-mono text-[10px] tracking-label text-ember">{s.index}</span>
                <span className="font-display text-5xl text-paper">{s.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-center px-6 pb-24 pt-32 md:px-12">
        <p
          className="fade-in font-mono text-[10px] uppercase tracking-label text-paper-dim"
          style={{ '--fade-delay': '150ms' } as React.CSSProperties}
        >
          Cyber Security <span className="text-ember">·</span> Systems Administration
        </p>

        <h1 className="mt-8 font-display leading-[0.88] tracking-tight text-paper">
          <span className="rise-mask pb-[0.06em] text-[19vw] md:text-[13vw]">
            <span className="rise-line" style={{ '--rise-delay': '250ms' } as React.CSSProperties}>Wian</span>
          </span>
          <span className="rise-mask pb-[0.06em] text-[19vw] italic md:text-[13vw]">
            <span className="rise-line" style={{ '--rise-delay': '400ms' } as React.CSSProperties}>Schoeman</span>
          </span>
        </h1>

        <div className="mt-12 grid gap-8 md:grid-cols-12">
          <div
            className="fade-in md:col-span-5 md:col-start-7"
            style={{ '--fade-delay': '750ms' } as React.CSSProperties}
          >
            <div className="mb-6 h-px w-full bg-ink-line" />
            <p className="max-w-md text-[15px] leading-relaxed text-paper-dim">
              Aspiring Cyber Security &amp; IT Operations professional. Blending a strong
              foundation in network defence with hands-on system administration and
              infrastructure troubleshooting.
            </p>
          </div>
        </div>

        <div
          className="fade-in absolute bottom-8 left-6 font-mono text-[10px] uppercase tracking-label text-paper-faint md:left-12"
          style={{ '--fade-delay': '1000ms' } as React.CSSProperties}
        >
          Scroll
        </div>
      </section>

      {/* ── 01 About ───────────────────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-40">
        <Reveal className="flex items-baseline gap-6">
          <span className="font-mono text-[10px] tracking-label text-ember">01</span>
          <h2 className="font-display text-5xl text-paper md:text-7xl">About</h2>
        </Reveal>
        <Reveal className="mt-8" delay={100}>
          <div className="rule-draw h-px w-full bg-ink-line" />
        </Reveal>

        <div className="mt-16 grid gap-16 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <Reveal>
              <p className="font-display text-2xl leading-snug text-paper md:text-[2rem]">
                I design, deploy and defend the systems that quietly keep everything
                else running.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-paper-dim">
                Aspiring Cyber Security and IT Operations professional currently pursuing a
                Bachelor's Degree in Cyber Security at Eduvos, having completed a Higher
                Certificate in Information Systems. I blend a strong academic foundation in
                ethical hacking, network defence and security analysis with practical,
                hands-on experience in systems administration and infrastructure deployment.
                Proven ability to design, deploy and manage secure server environments,
                coupled with a high technical aptitude for mastering complex platforms.
              </p>
            </Reveal>

            <dl className="mt-14 border-t border-ink-line">
              {PROFILE.map((row, i) => (
                <Reveal key={row.label} delay={i * 70}>
                  <div className="grid grid-cols-1 gap-2 border-b border-ink-line py-5 md:grid-cols-4 md:gap-6">
                    <dt className="font-mono text-[10px] uppercase tracking-label text-paper-faint">
                      {row.label}
                    </dt>
                    <dd className="text-[15px] leading-relaxed text-paper-dim md:col-span-3">
                      {row.value}
                    </dd>
                  </div>
                </Reveal>
              ))}
              <Reveal delay={PROFILE.length * 70}>
                <div className="grid grid-cols-1 gap-2 border-b border-ink-line py-5 md:grid-cols-4 md:gap-6">
                  <dt className="font-mono text-[10px] uppercase tracking-label text-paper-faint">
                    Reach me
                  </dt>
                  <dd className="md:col-span-3">
                    <a
                      href="mailto:wian.schoeman1@gmail.com"
                      data-hover="true"
                      className="text-[15px] text-paper underline decoration-ember/50 underline-offset-4 transition-colors hover:decoration-ember"
                    >
                      wian.schoeman1@gmail.com
                    </a>
                  </dd>
                </div>
              </Reveal>
            </dl>
          </div>

          {/* Console panel — a quiet nod to the work itself */}
          <div className="md:col-span-5">
            <Reveal delay={160}>
              <div className="sticky top-28 border border-ink-line bg-ink-raised">
                <div className="flex items-center justify-between border-b border-ink-line px-5 py-3">
                  <span className="font-mono text-[10px] tracking-label text-paper-faint">
                    wian@homelab
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                </div>
                <div className="space-y-2 p-5 font-mono text-[11px] leading-relaxed text-paper-dim">
                  <p><span className="text-ember">$</span> ./init_portfolio.sh</p>
                  <p className="text-paper-faint">&gt; loading modules</p>
                  <p className="text-paper-faint">&gt; accessing secure vault</p>
                  <p className="text-paper-faint">&gt; decrypting project files</p>
                  <p className="text-paper">&gt; ok</p>
                  <div className="my-4 h-px w-full bg-ink-line" />
                  <p className="text-paper-faint">
                    Fun fact — I love exploring emerging security technologies and new
                    programming languages.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Toolkit */}
        <Reveal className="mt-24">
          <h3 className="font-mono text-[10px] uppercase tracking-label text-paper-faint">
            Toolkit
          </h3>
        </Reveal>
        <div className="mt-6 flex flex-wrap gap-2">
          {TECH_STACK.map((tech, i) => (
            <Reveal key={tech} delay={i * 35}>
              <span className="inline-block border border-ink-line px-3 py-2 font-mono text-[11px] text-paper-dim transition-colors duration-500 hover:border-ember/40 hover:text-paper">
                {tech}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 02 Work ────────────────────────────────────────────────── */}
      <section id="work" className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-40">
        <Reveal className="flex items-baseline gap-6">
          <span className="font-mono text-[10px] tracking-label text-ember">02</span>
          <h2 className="font-display text-5xl text-paper md:text-7xl">Selected Work</h2>
        </Reveal>
        <Reveal className="mt-8" delay={100}>
          <div className="rule-draw h-px w-full bg-ink-line" />
        </Reveal>

        <div className="mt-16 grid gap-x-10 gap-y-20 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={(i % 3) * 110}>
              <ProjectCard
                project={project}
                index={i}
                onClick={() => setSelectedProject(project)}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 03 Contact ─────────────────────────────────────────────── */}
      <section id="contact" className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-40">
        <Reveal className="flex items-baseline gap-6">
          <span className="font-mono text-[10px] tracking-label text-ember">03</span>
          <h2 className="font-display text-5xl text-paper md:text-7xl">Contact</h2>
        </Reveal>
        <Reveal className="mt-8" delay={100}>
          <div className="rule-draw h-px w-full bg-ink-line" />
        </Reveal>

        <Reveal className="mt-16">
          <p className="max-w-3xl font-display text-3xl leading-snug text-paper md:text-5xl">
            Let's build and secure <span className="italic">resilient systems</span>.
          </p>
        </Reveal>

        <div className="mt-16 border-t border-ink-line">
          {CONTACT.map((item, i) => (
            <Reveal key={item.name} delay={i * 90}>
              <a
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                data-hover="true"
                className="group flex items-center justify-between gap-6 border-b border-ink-line py-7 transition-colors duration-500 hover:border-ember/40"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-8">
                  <span className="font-mono text-[10px] uppercase tracking-label text-paper-faint md:w-20 md:flex-shrink-0">
                    {item.name}
                  </span>
                  <span className="font-display text-2xl text-paper transition-colors duration-500 group-hover:text-ember md:text-3xl">
                    {item.value}
                  </span>
                </div>
                <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-paper-faint transition-all duration-500 ease-editorial group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ember" />
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Colophon ───────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-[1400px] px-6 pb-12 pt-16 md:px-12">
        <div className="flex flex-col gap-4 border-t border-ink-line pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-label text-paper-faint">
            © {YEAR} Wian Schoeman
          </p>
          <p className="font-mono text-[10px] uppercase tracking-label text-paper-faint">
            Cyber Security <span className="text-ember">·</span> Systems Administration
          </p>
        </div>
      </footer>

      {/* ── Project detail ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelectedProject(null)}
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 ${
              isLite ? 'bg-ink/95' : 'bg-ink/90 backdrop-blur-sm'
            }`}
            style={{ cursor: 'auto' }}
          >
            <motion.div
              initial={{ opacity: 0, y: isLite ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isLite ? 0 : 16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden border border-ink-line bg-ink-raised md:flex-row"
            >
              <button
                onClick={() => setSelectedProject(null)}
                data-hover="true"
                aria-label="Close"
                className="absolute right-4 top-4 z-20 border border-ink-line bg-ink/70 p-2 text-paper-dim transition-colors hover:border-ember/50 hover:text-paper"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex h-56 flex-shrink-0 items-center justify-center overflow-hidden border-b border-ink-line bg-ink md:h-auto md:w-1/2 md:border-b-0 md:border-r">
                {selectedProject.image ? (
                  <img
                    key={selectedProject.id}
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain p-8"
                  />
                ) : (
                  <span className="font-display text-7xl text-paper-faint/30">
                    {selectedProject.title.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex min-h-0 w-full flex-col overflow-y-auto p-8 md:w-1/2 md:p-12">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-label text-paper-faint">
                  <span>{selectedProject.category}</span>
                  <span>{selectedProject.year}</span>
                </div>

                <h3 className="mt-6 font-display text-3xl leading-tight text-paper md:text-4xl">
                  {selectedProject.title}
                </h3>

                <div className="my-8 h-px w-16 bg-ember" />

                <p className="whitespace-pre-line text-[15px] leading-relaxed text-paper-dim">
                  {selectedProject.description}
                </p>

                {selectedProject.link && (
                  <a
                    href={selectedProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-hover="true"
                    className="group mt-10 inline-flex items-center gap-3 self-start border-b border-ember pb-1 font-mono text-[11px] uppercase tracking-label text-paper transition-colors hover:text-ember"
                  >
                    View source
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                )}

                <div className="mt-auto flex items-center gap-3 pt-10">
                  <button
                    onClick={() => navigateProject(-1)}
                    data-hover="true"
                    aria-label="Previous project"
                    className="border border-ink-line p-3 text-paper-dim transition-colors hover:border-ember/50 hover:text-paper"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigateProject(1)}
                    data-hover="true"
                    aria-label="Next project"
                    className="border border-ink-line p-3 text-paper-dim transition-colors hover:border-ember/50 hover:text-paper"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
