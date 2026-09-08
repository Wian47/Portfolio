/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Lock, RotateCcw } from 'lucide-react';
import Grain from './Grain';
import CustomCursor from './CustomCursor';
import Reveal from './Reveal';
import { BuildDoc, BuildTask } from '../types';
import { usePerfTier } from '../utils/perf';

/**
 * The content is not bundled. It is fetched from a path that Cloudflare Access
 * protects, so the public JavaScript reveals only that a private page exists.
 */
const CONTENT_URL = '/private/cx3-build.json';
const PROGRESS_KEY = 'cx3-build-progress';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'locked' }
  | { kind: 'ready'; doc: BuildDoc };

const rand = (n: number): string => {
  const body = Math.abs(n).toLocaleString('en-ZA', { maximumFractionDigits: 0 });
  return `${n < 0 ? '−' : ''}R ${body}`;
};

const readProgress = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const stageTotal = (tasks: BuildTask[]): number =>
  tasks.reduce((sum, t) => sum + (t.cost ?? 0), 0);

const STATUS_LABEL: Record<BuildTask['status'], string | null> = {
  done: 'Done',
  quoted: 'Quoted',
  todo: null
};

const BuildPage: React.FC = () => {
  const isLite = usePerfTier() === 'lite';
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [ticked, setTicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = 'CX-3 Build · Wian Schoeman';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(CONTENT_URL, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((doc: BuildDoc) => {
        if (cancelled) return;
        if (!Array.isArray(doc.stages)) throw new Error('unexpected payload');
        const stored = readProgress();
        const seeded: Record<string, boolean> = {};
        doc.stages.forEach((stage) =>
          stage.tasks.forEach((task) => {
            seeded[task.id] = stored[task.id] ?? task.status === 'done';
          })
        );
        setTicked(seeded);
        setState({ kind: 'ready', doc });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'locked' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    setTicked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {
        // Private browsing denies writes. The tick still works for this session.
      }
      return next;
    });
  };

  const resetProgress = () => {
    if (state.kind !== 'ready') return;
    const seeded: Record<string, boolean> = {};
    state.doc.stages.forEach((stage) =>
      stage.tasks.forEach((task) => {
        seeded[task.id] = task.status === 'done';
      })
    );
    setTicked(seeded);
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      // Nothing to clear if storage was never writable.
    }
  };

  const doc = state.kind === 'ready' ? state.doc : null;

  const totals = useMemo(() => {
    if (!doc) return { tasks: 0, complete: 0, budget: 0, spent: 0 };
    const all = doc.stages.flatMap((s) => s.tasks);
    return {
      tasks: all.length,
      complete: all.filter((t) => ticked[t.id]).length,
      budget: all.reduce((sum, t) => sum + (t.cost ?? 0), 0),
      spent: all.filter((t) => ticked[t.id]).reduce((sum, t) => sum + (t.cost ?? 0), 0)
    };
  }, [doc, ticked]);

  return (
    <div className={`relative min-h-screen bg-ink text-paper ${isLite ? '' : 'md:cursor-none'}`}>
      <CustomCursor />
      <Grain />

      <header className={`fixed inset-x-0 top-0 z-50 border-b border-ink-line ${isLite ? 'bg-ink' : 'bg-ink/85 backdrop-blur-md'}`}>
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5 md:px-12">
          <a
            href="/"
            data-hover="true"
            className="group flex items-center gap-3 font-mono text-[10px] uppercase tracking-label text-paper-dim transition-colors hover:text-paper"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            Portfolio
          </a>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-label text-paper-faint">
            <Lock className="h-3 w-3 text-ember" />
            Private
          </span>
        </div>
      </header>

      {state.kind === 'loading' && (
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="font-mono text-[10px] uppercase tracking-label text-paper-faint">Loading</p>
        </div>
      )}

      {state.kind === 'locked' && (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md text-center">
            <Lock className="mx-auto h-6 w-6 text-ember" />
            <h1 className="mt-8 font-display text-5xl text-paper">Locked</h1>
            <p className="mt-5 text-[16px] leading-relaxed text-paper-dim">
              This page is behind Cloudflare Access. Sign in with the owner account and reload,
              or head back to the portfolio.
            </p>
            <a
              href="/"
              data-hover="true"
              className="mt-8 inline-block border border-ink-line px-6 py-3 font-mono text-[10px] uppercase tracking-label text-paper-dim transition-colors hover:border-ember/40 hover:text-paper"
            >
              Back to portfolio
            </a>
          </div>
        </div>
      )}

      {doc && (
        <main className="mx-auto max-w-[1100px] px-6 pb-32 pt-32 md:px-12 md:pt-44">
          <p className="fade-in font-mono text-[10px] uppercase tracking-label text-paper-dim">
            Personal Build <span className="text-ember">·</span> Updated {doc.updated}
          </p>

          <h1 className="mt-8 font-display leading-[0.9] tracking-tight text-paper">
            <span className="rise-mask pb-[0.06em] text-[16vw] md:text-[8rem]">
              <span className="rise-line" style={{ '--rise-delay': '200ms' } as React.CSSProperties}>CX-3</span>
            </span>
            <span className="rise-mask pb-[0.06em] text-[16vw] italic md:text-[8rem]">
              <span className="rise-line" style={{ '--rise-delay': '320ms' } as React.CSSProperties}>Build</span>
            </span>
          </h1>

          <div
            className="fade-in mt-10 grid gap-8 md:grid-cols-12"
            style={{ '--fade-delay': '650ms' } as React.CSSProperties}
          >
            <div className="md:col-span-7 md:col-start-6">
              <div className="mb-6 h-px w-full bg-ink-line" />
              <p className="text-[16px] leading-relaxed text-paper-dim">{doc.subtitle}</p>
            </div>
          </div>

          <section className="mt-20 border border-ink-line bg-ink-raised md:mt-28">
            <div className="grid grid-cols-2 divide-ink-line md:grid-cols-4 md:divide-x">
              {[
                { label: 'Tasks done', value: `${totals.complete} / ${totals.tasks}` },
                { label: 'Committed', value: rand(totals.spent) },
                { label: 'Remaining', value: rand(totals.budget - totals.spent) },
                { label: 'Full build', value: rand(totals.budget) }
              ].map((stat) => (
                <div key={stat.label} className="border-b border-ink-line px-5 py-6 md:border-b-0">
                  <p className="font-mono text-[10px] uppercase tracking-label text-paper-faint">{stat.label}</p>
                  <p className="mt-3 font-display text-3xl text-paper md:text-4xl">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="h-1 w-full bg-ink">
              <div
                className="h-full bg-ember transition-[width] duration-700 ease-editorial"
                style={{ width: `${totals.tasks ? (totals.complete / totals.tasks) * 100 : 0}%` }}
              />
            </div>
          </section>

          <section className="mt-20 md:mt-28">
            <Reveal>
              <h2 className="font-mono text-[10px] uppercase tracking-label text-paper-faint">The car</h2>
            </Reveal>
            <dl className="mt-6 border-t border-ink-line">
              {doc.vehicle.map((row, i) => (
                <Reveal key={row.label} delay={i * 60}>
                  <div className="grid grid-cols-1 gap-2 border-b border-ink-line py-5 md:grid-cols-4 md:gap-6">
                    <dt className="font-mono text-[10px] uppercase tracking-label text-paper-faint">{row.label}</dt>
                    <dd className="text-[15px] leading-relaxed text-paper-dim md:col-span-3">{row.value}</dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </section>

          {doc.stages.map((stage) => {
            const subtotal = stageTotal(stage.tasks);
            const doneCount = stage.tasks.filter((t) => ticked[t.id]).length;
            return (
              <section key={stage.id} className="mt-24 md:mt-32">
                <Reveal className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <span className="font-mono text-[10px] tracking-label text-ember">{stage.index}</span>
                  <h2 className="font-display text-4xl text-paper md:text-6xl">{stage.title}</h2>
                  <span className="font-mono text-[10px] uppercase tracking-label text-paper-faint">
                    {stage.timing}
                  </span>
                </Reveal>
                <Reveal className="mt-6" delay={80}>
                  <div className="rule-draw h-px w-full bg-ink-line" />
                </Reveal>

                <Reveal delay={120}>
                  <div className="mt-8 grid gap-6 md:grid-cols-12">
                    <p className="text-[16px] leading-relaxed text-paper-dim md:col-span-8">{stage.summary}</p>
                    <div className="md:col-span-4 md:text-right">
                      <p className="font-mono text-[10px] uppercase tracking-label text-paper-faint">
                        {doneCount} of {stage.tasks.length} done
                      </p>
                      {subtotal !== 0 && (
                        <p className="mt-2 font-display text-3xl text-paper">{rand(subtotal)}</p>
                      )}
                    </div>
                  </div>
                </Reveal>

                <ul className="mt-10 border-t border-ink-line">
                  {stage.tasks.map((task, i) => {
                    const checked = !!ticked[task.id];
                    const badge = STATUS_LABEL[task.status];
                    return (
                      <Reveal key={task.id} as="li" delay={Math.min(i * 50, 300)}>
                        <div className="border-b border-ink-line">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            onClick={() => toggle(task.id)}
                            data-hover="true"
                            className="flex w-full items-start gap-4 py-5 text-left transition-colors md:gap-6"
                          >
                            <span
                              className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-300 ${
                                checked ? 'border-ember bg-ember' : 'border-paper-faint/50'
                              }`}
                            >
                              {checked && <Check className="h-3 w-3 text-ink" strokeWidth={3} />}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span
                                  className={`text-[16px] leading-snug transition-colors duration-300 ${
                                    checked ? 'text-paper-faint line-through decoration-paper-faint/40' : 'text-paper'
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {badge && (
                                  <span className="border border-ember/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-label text-ember">
                                    {badge}
                                  </span>
                                )}
                              </span>
                              {task.detail && (
                                <span className="mt-2 block max-w-2xl text-[14px] leading-relaxed text-paper-dim">
                                  {task.detail}
                                </span>
                              )}
                            </span>

                            {task.cost !== undefined && (
                              <span
                                className={`shrink-0 pt-0.5 font-mono text-[13px] tabular-nums transition-colors duration-300 ${
                                  task.cost < 0 ? 'text-ember' : checked ? 'text-paper-faint' : 'text-paper-dim'
                                }`}
                              >
                                {rand(task.cost)}
                              </span>
                            )}
                          </button>
                        </div>
                      </Reveal>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          <section className="mt-24 md:mt-32">
            <Reveal className="flex items-baseline gap-6">
              <span className="font-mono text-[10px] tracking-label text-ember">—</span>
              <h2 className="font-display text-4xl text-paper md:text-6xl">Never cheap out on</h2>
            </Reveal>
            <Reveal className="mt-6" delay={80}>
              <div className="rule-draw h-px w-full bg-ink-line" />
            </Reveal>
            <div className="mt-10 grid gap-px border border-ink-line bg-ink-line md:grid-cols-2">
              {doc.rules.map((rule, i) => (
                <Reveal key={rule.never} delay={i * 60}>
                  <div className="h-full bg-ink-raised p-6">
                    <p className="font-mono text-[10px] uppercase tracking-label text-ember">{rule.never}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-paper-dim">{rule.why}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="mt-24 md:mt-32">
            <Reveal className="flex items-baseline gap-6">
              <span className="font-mono text-[10px] tracking-label text-ember">—</span>
              <h2 className="font-display text-4xl text-paper md:text-6xl">{doc.reserve.title}</h2>
            </Reveal>
            <Reveal className="mt-6" delay={80}>
              <div className="rule-draw h-px w-full bg-ink-line" />
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-paper-dim">{doc.reserve.note}</p>
            </Reveal>
            <ul className="mt-10 border-t border-ink-line">
              {doc.reserve.items.map((item, i) => (
                <Reveal key={item.title} as="li" delay={i * 50}>
                  <div className="flex items-baseline justify-between gap-6 border-b border-ink-line py-4">
                    <span className="text-[15px] text-paper-dim">{item.title}</span>
                    <span className="shrink-0 font-mono text-[13px] tabular-nums text-paper-faint">
                      {rand(item.cost)}
                    </span>
                  </div>
                </Reveal>
              ))}
              <Reveal as="li" delay={doc.reserve.items.length * 50}>
                <div className="flex items-baseline justify-between gap-6 py-5">
                  <span className="font-mono text-[10px] uppercase tracking-label text-paper-faint">Hold</span>
                  <span className="font-display text-3xl text-paper">
                    {rand(doc.reserve.items.reduce((sum, i) => sum + i.cost, 0))}
                  </span>
                </div>
              </Reveal>
            </ul>
          </section>

          <div className="mt-24 flex flex-wrap items-center justify-between gap-6 border-t border-ink-line pt-8">
            <p className="max-w-md text-[13px] leading-relaxed text-paper-faint">
              Ticks are stored in this browser only. Costs are budgetary estimates in rand,
              VAT inclusive, not quotes.
            </p>
            <button
              type="button"
              onClick={resetProgress}
              data-hover="true"
              className="flex items-center gap-2 border border-ink-line px-4 py-3 font-mono text-[10px] uppercase tracking-label text-paper-faint transition-colors hover:border-ember/40 hover:text-paper"
            >
              <RotateCcw className="h-3 w-3" />
              Reset ticks
            </button>
          </div>
        </main>
      )}
    </div>
  );
};

export default BuildPage;
