import { Project } from '../types';

const GITHUB_USERNAME = 'Wian47';
const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&type=public`;

// Image mappings for specific projects
const PROJECT_IMAGES: Record<string, string> = {
    'CLI-NetworkScanner': '/assets/netscan.png',
    'ULPM': '/assets/ulpm.jpg',
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
                image: PROJECT_IMAGES[repo.name] || '', // Use specific image or empty string
                link: repo.html_url
            }));
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        return [];
    }
};
