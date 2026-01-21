import { Project } from '../types';

// Import images directly so Vite can process them
import netscanImg from '../assets/netscan.png';
import ulpmImg from '../assets/ulpm.jpg';

const GITHUB_USERNAME = 'Wian47';
const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&type=public`;

// Image mappings for specific projects
const PROJECT_IMAGES: Record<string, string> = {
    'CLI-NetworkScanner': netscanImg,
    'ULPM': ulpmImg,
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
                title: repo.name.replace(/-/g, ' '),
                category: `${repo.language || 'Code'} / GitHub`,
                year: new Date(repo.updated_at).getFullYear().toString(),
                description: repo.description || 'No description provided.',
                image: PROJECT_IMAGES[repo.name] || '',
                link: repo.html_url
            }));
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        return [];
    }
};
