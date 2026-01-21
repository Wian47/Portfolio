
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <motion.div
      className="group relative h-[400px] md:h-[500px] w-full overflow-hidden border-b md:border-r border-white/10 bg-black cursor-pointer"
      initial="rest"
      whileHover="hover"
      whileTap="hover"
      animate="rest"
      data-hover="true"
      onClick={onClick}
    >
      {/* Image Background with Zoom */}
      <div className={`absolute inset-0 overflow-hidden ${!project.image ? 'bg-[#1a1b3b]' : ''}`}>
        {project.image && (
          <motion.img
            src={project.image}
            alt={project.title}
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="h-full w-full object-contain grayscale will-change-transform opacity-60"
            variants={{
              rest: { scale: 1, filter: 'grayscale(100%)' },
              hover: { scale: 1.05, filter: 'grayscale(0%)' }
            }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
      </div>

      {/* Overlay Info */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono border border-[#4fb7b3]/30 text-[#4fb7b3] px-2 py-1 rounded-md backdrop-blur-md bg-[#4fb7b3]/10">
            {project.year}
          </span>
          <motion.div
            variants={{
              rest: { opacity: 0, x: 20, y: -20 },
              hover: { opacity: 1, x: 0, y: 0 }
            }}
            className="bg-white text-black rounded-full p-2 will-change-transform"
          >
            <ArrowUpRight className="w-6 h-6" />
          </motion.div>
        </div>

        <div>
          <div className="overflow-hidden">
            <motion.h3
              className="font-heading text-2xl md:text-4xl font-bold text-white mb-2 will-change-transform break-words"
              variants={{
                rest: { y: 0 },
                hover: { y: -5 }
              }}
              transition={{ duration: 0.4 }}
            >
              {project.title}
            </motion.h3>
          </div>
          <motion.p
            className="text-sm font-bold uppercase tracking-widest text-[#a8fbd3] mt-1 will-change-transform"
            variants={{
              rest: { opacity: 0.7, y: 0 },
              hover: { opacity: 1, y: 0 }
            }}
          >
            {project.category}
          </motion.p>

          <motion.div
            className="h-px bg-white/20 mt-4 w-full origin-left"
            variants={{
              rest: { scaleX: 0 },
              hover: { scaleX: 1 }
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
