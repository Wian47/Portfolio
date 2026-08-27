/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Project } from '../types';
import repos from '../data/github-projects.json';

// Import images directly so Vite can process them
import netscanImg from '../assets/netscan.png';
import ulpmImg from '../assets/ulpm.jpg';
import gitsketchImg from '../assets/gitsketch.jpg';
import tsHudImg from '../assets/ts-hud.png';
import gitCleanImg from '../assets/git-clean.png';
import omarchyPrinterImg from '../assets/omarchy-printers.png';
import omarchyRemovableDrivesImg from '../assets/removable-drives.png';

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

/**
 * Project list, resolved at build time from data/github-projects.json.
 *
 * This used to call the GitHub API from the browser on every page load. That
 * spends the visitor's own unauthenticated quota - 60 requests per hour per IP -
 * so a few reloads, or a shared IP, returned 403 and the page silently rendered
 * with no GitHub projects at all. Run `npm run projects:refresh` to update.
 */
export const getGitHubProjects = (): Project[] =>
    repos.map((repo) => ({
        id: repo.id,
        title: PROJECT_TITLES[repo.name] || repo.name.replace(/-/g, ' '),
        category: `${repo.language} / GitHub`,
        year: new Date(repo.updatedAt).getFullYear().toString(),
        description: repo.description,
        image: PROJECT_IMAGES[repo.name] || '',
        tags: PROJECT_TAGS[repo.name],
        link: repo.url
    }));
