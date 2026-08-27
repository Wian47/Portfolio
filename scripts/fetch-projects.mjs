/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Refreshes data/github-projects.json from the GitHub API.
 *
 * The project list used to be fetched in the browser on every page load, which
 * meant each visitor spent from GitHub's unauthenticated budget of 60 requests
 * per hour per IP. Anyone who reloaded a few times - or who shared an IP behind
 * corporate NAT or a mobile carrier - got a 403 and saw a portfolio with the
 * GitHub projects missing entirely. Baking the list in at build time removes
 * the runtime dependency.
 *
 * Run `npm run projects:refresh` after publishing or renaming a repo. Set
 * GITHUB_TOKEN to make an authenticated request if you are rate limited.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const USERNAME = 'Wian47';
const EXCLUDED = new Set(['Portfolio', USERNAME]);
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'github-projects.json');

const headers = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const response = await fetch(
  `https://api.github.com/users/${USERNAME}/repos?sort=updated&direction=desc&type=public&per_page=100`,
  { headers }
);

if (!response.ok) {
  const remaining = response.headers.get('x-ratelimit-remaining');
  console.error(`GitHub API returned ${response.status}` + (remaining === '0' ? ' (rate limited)' : ''));
  console.error('Leaving data/github-projects.json untouched.');
  process.exit(1);
}

const repos = await response.json();
const projects = repos
  .filter((repo) => !repo.fork && !EXCLUDED.has(repo.name))
  .map((repo) => ({
    id: String(repo.id),
    name: repo.name,
    language: repo.language || 'Code',
    description: repo.description || 'No description provided.',
    updatedAt: repo.updated_at,
    url: repo.html_url
  }));

await writeFile(OUT, JSON.stringify(projects, null, 2) + '\n');
console.log(`Wrote ${projects.length} projects to data/github-projects.json`);
