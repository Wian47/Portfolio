/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import Grain from '../Grain';
import CustomCursor from '../CustomCursor';
import { usePerfTier } from '../../utils/perf';

/**
 * The frame, the two states that are not a trip, and the two class strings the
 * planner repeats often enough that copying them around would let them drift.
 * Nothing here reaches outside `components/trip` except the atmosphere layers,
 * so retiring the CX-3 page takes nothing with it.
 */

/** `font-mono text-[10px] uppercase tracking-label` on the faint tone: every small label on the site. */
export const LABEL = 'font-mono text-[10px] uppercase tracking-label text-paper-faint';

export const CONTROL =
  'border border-ink-line px-4 py-3 font-mono text-[10px] uppercase tracking-label text-paper-dim ' +
  'transition-colors hover:border-ember/40 hover:text-paper focus-visible:outline-none ' +
  'focus-visible:ring-1 focus-visible:ring-ember disabled:cursor-not-allowed disabled:text-paper-faint';

export interface BackLink {
  label: string;
  href: string;
  /** Present for a link the planner handles itself, so the page does not reload to change route. */
  onNavigate?: () => void;
}

interface ShellProps {
  back: BackLink;
  status?: React.ReactNode;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ back, status, children }) => {
  const isLite = usePerfTier() === 'lite';

  const follow = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!back.onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    back.onNavigate();
  };

  return (
    <div className={`relative min-h-screen bg-ink text-paper ${isLite ? '' : 'md:cursor-none'}`}>
      <CustomCursor />
      <Grain />

      <header className={`fixed inset-x-0 top-0 z-50 border-b border-ink-line ${isLite ? 'bg-ink' : 'bg-ink/85 backdrop-blur-md'}`}>
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-5 md:px-12">
          <a
            href={back.href}
            onClick={follow}
            data-hover="true"
            className="group flex items-center gap-3 font-mono text-[10px] uppercase tracking-label text-paper-dim transition-colors hover:text-paper"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            {back.label}
          </a>
          <div className="flex items-center gap-5">
            {status}
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-label text-paper-faint">
              <Lock className="h-3 w-3 text-ember" />
              Private
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-6 pb-32 pt-28 md:px-12 md:pt-36">{children}</main>
    </div>
  );
};

export const Loading: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center px-6">
    <p className={LABEL}>Loading</p>
  </div>
);

interface NoticeProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const Notice: React.FC<NoticeProps> = ({ title, children, action }) => (
  <div className="flex min-h-[60vh] items-center justify-center px-6">
    <div className="max-w-md text-center">
      <Lock className="mx-auto h-6 w-6 text-ember" />
      <h1 className="mt-8 font-display text-5xl text-paper">{title}</h1>
      <p className="mt-5 text-[16px] leading-relaxed text-paper-dim">{children}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {action}
        <a href="/" data-hover="true" className={`inline-block ${CONTROL}`}>
          Back to portfolio
        </a>
      </div>
    </div>
  </div>
);

/**
 * Access decides on the next document request for a gated path, so signing in is
 * a navigation rather than a fetch. Nothing in the tab survives it, which is why
 * the copy says so rather than implying the edits are held somewhere.
 */
export const SignedOut: React.FC = () => (
  <Notice
    title="Signed out"
    action={
      <a href="/build" data-hover="true" className={`inline-block ${CONTROL}`}>
        Sign in
      </a>
    }
  >
    The Cloudflare Access session has lapsed. Sign in with the owner account to carry on.
    Anything edited since the last save is lost when this tab reloads.
  </Notice>
);
