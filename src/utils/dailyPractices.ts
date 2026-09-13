/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { SanctuaryState, DailyActivityKey } from '../types';

export const formatLocalDateToYMD = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export interface DailyActivityStatusResult {
  justForToday: boolean;
  checkIn: boolean;
  meditation: boolean;
  breathing: boolean;
  lesson: boolean;
  activities: {
    justForToday: boolean;
    checkIn: boolean;
    meditation: boolean;
    breathing: boolean;
    lesson: boolean;
  };
  completedCount: number;
  isGoalMet: boolean;
}

export function getDailyActivityStatus(
  state: SanctuaryState,
  targetDate: string = formatLocalDateToYMD()
): DailyActivityStatusResult {
  const dayRecord = state.dailyActivities?.[targetDate] || {};
  const isToday = targetDate === formatLocalDateToYMD();

  // 1. 'just for today' marked active
  const justForToday = dayRecord.justForToday !== undefined
    ? !!dayRecord.justForToday
    : (isToday ? !!state.soberCheckedInToday : false);

  // 2. daily checkin has been done
  const hasCheckInReflection = (state.reflections || []).some(r => {
    const rDate = formatLocalDateToYMD(new Date(r.date));
    if (rDate !== targetDate) return false;
    const title = (r.title || '').toLowerCase();
    return (
      !title.includes('meditation') &&
      !title.includes('meditación') &&
      !title.includes('meditação') &&
      !title.includes('breathing') &&
      !title.includes('respiración') &&
      !title.includes('respiração') &&
      !title.includes('lesson') &&
      !title.includes('lección') &&
      !title.includes('lição')
    );
  });
  const checkIn = dayRecord.checkIn !== undefined ? !!dayRecord.checkIn : hasCheckInReflection;

  // 3. meditation done
  const hasMedReflection = (state.reflections || []).some(r => {
    const rDate = formatLocalDateToYMD(new Date(r.date));
    if (rDate !== targetDate) return false;
    const title = (r.title || '').toLowerCase();
    return title.includes('meditation') || title.includes('meditación') || title.includes('meditação');
  });
  const meditation = dayRecord.meditation !== undefined ? !!dayRecord.meditation : hasMedReflection;

  // 4. breathing exercise done
  const hasBreathReflection = (state.reflections || []).some(r => {
    const rDate = formatLocalDateToYMD(new Date(r.date));
    if (rDate !== targetDate) return false;
    const title = (r.title || '').toLowerCase();
    return title.includes('breathing') || title.includes('respiración') || title.includes('respiração');
  });
  const breathing = dayRecord.breathing !== undefined ? !!dayRecord.breathing : hasBreathReflection;

  // 5. lesson completed
  const hasLessonReflection = (state.reflections || []).some(r => {
    const rDate = formatLocalDateToYMD(new Date(r.date));
    if (rDate !== targetDate) return false;
    const title = (r.title || '').toLowerCase();
    return title.includes('lesson') || title.includes('lección') || title.includes('lição');
  });
  const lesson = dayRecord.lesson !== undefined ? !!dayRecord.lesson : hasLessonReflection;

  const completedCount = [justForToday, checkIn, meditation, breathing, lesson].filter(Boolean).length;

  return {
    justForToday,
    checkIn,
    meditation,
    breathing,
    lesson,
    activities: {
      justForToday,
      checkIn,
      meditation,
      breathing,
      lesson,
    },
    completedCount,
    isGoalMet: completedCount >= 4,
  };
}
