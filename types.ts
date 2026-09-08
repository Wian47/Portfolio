
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  year: string;
  description: string;
  link?: string;
  /** Capability domains this project demonstrates, surfaced on the card. */
  tags?: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum Section {
  HERO = 'hero',
  ABOUT = 'about',
  PROJECTS = 'projects',
  CONTACT = 'contact',
}

/** Progress state of a build task. Seeds the initial tick state on first load. */
export type TaskStatus = 'done' | 'quoted' | 'todo';

export interface BuildTask {
  id: string;
  title: string;
  detail?: string;
  /** Rand, VAT inclusive. Negative for money coming back, such as selling the OE wheels. */
  cost?: number;
  status: TaskStatus;
}

export interface BuildStage {
  id: string;
  index: string;
  title: string;
  timing: string;
  summary: string;
  tasks: BuildTask[];
}

export interface BuildDoc {
  title: string;
  subtitle: string;
  updated: string;
  vehicle: { label: string; value: string }[];
  stages: BuildStage[];
  reserve: { title: string; note: string; items: { title: string; cost: number }[] };
  rules: { never: string; why: string }[];
}
