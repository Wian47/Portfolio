import { Project } from '../types';

// Import images directly so Vite can process them
import netscanImg from '../assets/netscan.png';
import ulpmImg from '../assets/ulpm.jpg';
import gitsketchImg from '../assets/gitsketch.jpg';
import tsHudImg from '../assets/ts-hud.png';
import gitCleanImg from '../assets/git-clean.png';
import omarchyPrinterImg from '../assets/omarchy-printers.png';
import omarchyRemovableDrivesImg from '../assets/removable-drives.png';

// Repo names make poor headings once the hyphens are stripped ("ts hud",
// "omarchy removable drives"). Anything not listed falls back to that default.
const PROJECT_TITLES: Record<string, string> = {
    'CLI-NetworkScanner': 'CLI Network Scanner',
    'ts-hud': 'TS-HUD',
    'git-clean': 'git-clean',
    'omarchy-printer': 'Omarchy Printers',
    'omarchy-removable-drives': 'Omarchy Removable Drives',
};

// Capability domains each project demonstrates. Drawn from what the repo
// actually does, so a reader scanning for support or admin skills finds them.
const PROJECT_TAGS: Record<string, string[]> = {
    'omarchy-printer': ['End-User Support', 'Printing', 'Linux'],
    'omarchy-removable-drives': ['End-User Support', 'Peripherals', 'Storage'],
    'CLI-NetworkScanner': ['Networking', 'Diagnostics'],
    'ts-hud': ['Networking', 'Monitoring', 'VPN'],
    'ULPM': ['Software Deployment', 'Package Management'],
    'GitSketch': ['Developer Tooling'],
    'git-clean': ['Developer Tooling', 'Automation'],
};

const GITHUB_USERNAME = 'Wian47';
const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&type=public`;

// Image mappings for specific projects
const PROJECT_IMAGES: Record<string, string> = {
    'CLI-NetworkScanner': netscanImg,
    'ULPM': ulpmImg,
    'GitSketch': gitsketchImg,
    'ts-hud': tsHudImg,
    'git-clean': gitCleanImg,
    'omarchy-printer': omarchyPrinterImg,
    'omarchy-removable-drives': omarchyRemovableDrivesImg,
};

export const fetchGitHubProjects = async (): Promise<Project[]> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch GitHub projects');
        }
        const data = await response.json();

        return data
            .filter((repo: any) => !repo.fork && repo.name !== 'Portfolio' && repo.name !== 'Wian47')
            .map((repo: any) => ({
                id: String(repo.id),
                title: PROJECT_TITLES[repo.name] || repo.name.replace(/-/g, ' '),
                category: `${repo.language || 'Code'} / GitHub`,
                year: new Date(repo.updated_at).getFullYear().toString(),
                description: repo.description || 'No description provided.',
                image: PROJECT_IMAGES[repo.name] || '',
                tags: PROJECT_TAGS[repo.name],
                link: repo.html_url
            }));
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        return [];
    }
};
