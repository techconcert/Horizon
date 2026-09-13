/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Step } from '../types';

export interface CompactSubLesson {
  id: string;
  status: 'READ' | 'IN PROGRESS' | 'UNREAD';
}

export interface CompactStep {
  id: string;
  locked?: boolean;
  completedDays?: number;
  subLessons?: CompactSubLesson[];
}

/**
 * Compacts the heavy (1.1MB) Step hierarchy into a tiny (<2KB) progress delta.
 * Strips all static multilingual titles, descriptions, quotes, and reflection questions.
 */
export function compactSteps(steps: any[]): CompactStep[] {
  if (!Array.isArray(steps) || steps.length === 0) return [];
  return steps.map((s: any) => {
    const compact: CompactStep = {
      id: s.id,
      locked: s.locked !== undefined ? !!s.locked : true,
      completedDays: typeof s.completedDays === 'number' ? s.completedDays : 0,
    };

    if (Array.isArray(s.subLessons)) {
      compact.subLessons = s.subLessons
        .filter((sub: any) => sub && (sub.status === 'READ' || sub.status === 'IN PROGRESS'))
        .map((sub: any) => ({
          id: sub.id,
          status: sub.status,
        }));
    } else {
      compact.subLessons = [];
    }

    return compact;
  });
}

/**
 * Hydrates stored step progress (either compact delta or legacy full steps)
 * against the canonical full INITIAL_STEPS array.
 */
export function hydrateSteps(savedSteps: any[] | null | undefined, initialSteps: Step[]): Step[] {
  if (!Array.isArray(savedSteps) || savedSteps.length === 0) {
    return initialSteps;
  }

  const clonedInitial: Step[] = JSON.parse(JSON.stringify(initialSteps));
  const savedMap = new Map<string, any>();
  savedSteps.forEach((s) => {
    if (s && s.id) savedMap.set(s.id, s);
  });

  return clonedInitial.map((step, idx) => {
    const saved = savedMap.get(step.id) || savedSteps[idx];
    if (!saved) return step;

    const subStatusMap = new Map<string, 'READ' | 'IN PROGRESS' | 'UNREAD'>();
    if (Array.isArray(saved.subLessons)) {
      saved.subLessons.forEach((sub: any, subIdx: number) => {
        if (sub && sub.id) {
          subStatusMap.set(sub.id, sub.status || 'UNREAD');
        } else if (sub && step.subLessons[subIdx]) {
          subStatusMap.set(step.subLessons[subIdx].id, sub.status || 'UNREAD');
        }
      });
    }

    const hydratedSubLessons = step.subLessons.map((sub) => {
      const status = subStatusMap.get(sub.id);
      return status ? { ...sub, status } : sub;
    });

    const completedDays =
      typeof saved.completedDays === 'number'
        ? saved.completedDays
        : Math.min(
            step.totalDays,
            Math.round(
              (hydratedSubLessons.filter((s) => s.status === 'READ').length /
                (hydratedSubLessons.length || 1)) *
                step.totalDays
            )
          );

    return {
      ...step,
      locked: saved.locked !== undefined ? !!saved.locked : step.locked,
      completedDays,
      subLessons: hydratedSubLessons,
    };
  });
}
