/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Project } from '../types';
import { usePerfTier } from '../utils/perf';

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, onClick }) => {
  const isLite = usePerfTier() === 'lite';

  // Scale and saturate() on a full-bleed image is a per-frame software filter
  // pass without a GPU, so the lite tier gets colour transitions only.
  // Most covers are dark terminal screenshots: too much desaturation and they
  // vanish into the card. Keep the resting state muted but still legible.
  const media = isLite
    ? 'opacity-95'
    : 'opacity-90 saturate-[0.65] transition-[transform,opacity,filter] duration-[1100ms] ease-editorial group-hover:opacity-100 group-hover:saturate-100 group-hover:scale-[1.04]';

  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.title}`}
      data-hover="true"
      className="group cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ember focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
    >
      <div className="flex items-baseline justify-between border-b border-ink-line pb-3">
        <span className="font-mono text-[10px] tracking-label text-paper-faint">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="font-mono text-[10px] tracking-label text-paper-faint">{project.year}</span>
      </div>

      <figure className="relative mt-6 aspect-[5/4] overflow-hidden bg-ink-raised">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            className={`h-full w-full object-contain p-6 md:p-8 ${media}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-5xl text-paper-faint/40">
              {project.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Hairline frame, warmed on hover */}
        <div className="pointer-events-none absolute inset-0 border border-ink-line transition-colors duration-700 group-hover:border-ember/40" />
      </figure>

      <div className="mt-6">
        <h3 className="font-display text-2xl leading-tight text-paper md:text-[1.75rem]">
          {project.title}
        </h3>
        {/* Rule that draws itself under the title on hover */}
        <div className="mt-3 h-px w-full origin-left scale-x-0 bg-ember transition-transform duration-700 ease-editorial group-hover:scale-x-100" />
        <p className="mt-3 font-mono text-[10px] uppercase tracking-label text-paper-faint">
          {project.category}
        </p>

        {project.tags && project.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="border border-ink-line px-2 py-1 font-mono text-[10px] uppercase tracking-label text-paper-faint transition-colors duration-500 group-hover:border-ember/30 group-hover:text-paper-dim"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
};

export default ProjectCard;
