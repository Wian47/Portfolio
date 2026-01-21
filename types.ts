
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
