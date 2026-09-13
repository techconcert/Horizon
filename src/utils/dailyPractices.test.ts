/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getDailyActivityStatus, formatLocalDateToYMD } from './dailyPractices';
import { SanctuaryState } from '../types';

function createMockState(overrides: Partial<SanctuaryState> = {}): SanctuaryState {
  return {
    sobrietyStartDate: '2026-01-01',
    reflections: [],
    activeTab: 'home',
    currentLessonId: null,
    soberCheckedInToday: false,
    biometricLock: false,
    language: 'English',
    syncEnabled: false,
    customMoods: [],
    onboarded: true,
    dailyActivities: {},
    ...overrides,
  };
}

describe('Daily Practices Tracking Unit Tests', () => {
  const testDate = '2026-09-12';

  test('default state returns 0 completed practices and isGoalMet is false', () => {
    const state = createMockState();
    const status = getDailyActivityStatus(state, testDate);

    assert.equal(status.justForToday, false);
    assert.equal(status.checkIn, false);
    assert.equal(status.meditation, false);
    assert.equal(status.breathing, false);
    assert.equal(status.lesson, false);
    assert.equal(status.completedCount, 0);
    assert.equal(status.isGoalMet, false);

    // Verify nested activities object is also populated
    assert.equal(status.activities.justForToday, false);
    assert.equal(status.activities.checkIn, false);
    assert.equal(status.activities.meditation, false);
    assert.equal(status.activities.breathing, false);
    assert.equal(status.activities.lesson, false);
  });

  test('tracks justForToday from soberCheckedInToday on today date', () => {
    const today = formatLocalDateToYMD();
    const state = createMockState({ soberCheckedInToday: true });
    const status = getDailyActivityStatus(state, today);

    assert.equal(status.justForToday, true);
    assert.equal(status.completedCount, 1);
    assert.equal(status.isGoalMet, false);
  });

  test('tracks justForToday from dailyActivities record explicitly', () => {
    const state = createMockState({
      dailyActivities: {
        [testDate]: { justForToday: true },
      },
    });
    const status = getDailyActivityStatus(state, testDate);

    assert.equal(status.justForToday, true);
    assert.equal(status.completedCount, 1);
  });

  test('explicit dailyActivities false overrides soberCheckedInToday', () => {
    const today = formatLocalDateToYMD();
    const state = createMockState({
      soberCheckedInToday: true,
      dailyActivities: {
        [today]: { justForToday: false },
      },
    });
    const status = getDailyActivityStatus(state, today);

    assert.equal(status.justForToday, false);
    assert.equal(status.completedCount, 0);
  });

  test('tracks daily check-in from non-specialized reflection', () => {
    const state = createMockState({
      reflections: [
        {
          id: '1',
          date: `${testDate}T10:00:00.000Z`,
          title: 'Morning Thoughts & Gratitude',
          content: 'Feeling grounded today.',
          moods: ['Peaceful'],
        },
      ],
    });
    const status = getDailyActivityStatus(state, testDate);

    assert.equal(status.checkIn, true);
    assert.equal(status.meditation, false);
    assert.equal(status.breathing, false);
    assert.equal(status.lesson, false);
    assert.equal(status.completedCount, 1);
  });

  test('tracks meditation practice from reflection title or explicit record', () => {
    // Via reflection in English, Spanish, or Portuguese
    const stateWithRef = createMockState({
      reflections: [
        {
          id: '2',
          date: `${testDate}T14:30:00.000Z`,
          title: 'Daily Meditation - Conscious Contact',
          content: 'Found peace in the silence.',
          moods: ['Calm'],
        },
      ],
    });
    assert.equal(getDailyActivityStatus(stateWithRef, testDate).meditation, true);

    // Via explicit dailyActivities
    const stateWithRecord = createMockState({
      dailyActivities: {
        [testDate]: { meditation: true },
      },
    });
    assert.equal(getDailyActivityStatus(stateWithRecord, testDate).meditation, true);
  });

  test('tracks breathing exercise practice from reflection or explicit record', () => {
    const stateWithRecord = createMockState({
      dailyActivities: {
        [testDate]: { breathing: true },
      },
    });
    const status = getDailyActivityStatus(stateWithRecord, testDate);

    assert.equal(status.breathing, true);
    assert.equal(status.completedCount, 1);
  });

  test('tracks 12-step lesson completion from reflection or explicit record', () => {
    const stateWithRecord = createMockState({
      dailyActivities: {
        [testDate]: { lesson: true },
      },
    });
    const status = getDailyActivityStatus(stateWithRecord, testDate);

    assert.equal(status.lesson, true);
    assert.equal(status.completedCount, 1);
  });

  test('reaches daily goal when 4 out of 5 practices are completed', () => {
    const state = createMockState({
      dailyActivities: {
        [testDate]: {
          justForToday: true,
          checkIn: true,
          meditation: true,
          breathing: true,
          lesson: false,
        },
      },
    });
    const status = getDailyActivityStatus(state, testDate);

    assert.equal(status.completedCount, 4);
    assert.equal(status.isGoalMet, true);
  });

  test('maintains daily goal met when all 5 practices are completed', () => {
    const state = createMockState({
      dailyActivities: {
        [testDate]: {
          justForToday: true,
          checkIn: true,
          meditation: true,
          breathing: true,
          lesson: true,
        },
      },
    });
    const status = getDailyActivityStatus(state, testDate);

    assert.equal(status.completedCount, 5);
    assert.equal(status.isGoalMet, true);
  });

  test('does not meet goal when only 3 practices are completed', () => {
    const state = createMockState({
      dailyActivities: {
        [testDate]: {
          justForToday: true,
          checkIn: true,
          meditation: true,
          breathing: false,
          lesson: false,
        },
      },
    });
    const status = getDailyActivityStatus(state, testDate);

    assert.equal(status.completedCount, 3);
    assert.equal(status.isGoalMet, false);
  });

  test('enforces date isolation between different calendar days', () => {
    const dateA = '2026-09-11';
    const dateB = '2026-09-12';
    const state = createMockState({
      dailyActivities: {
        [dateA]: {
          justForToday: true,
          checkIn: true,
          meditation: true,
          breathing: true,
          lesson: true,
        },
      },
    });

    const statusA = getDailyActivityStatus(state, dateA);
    const statusB = getDailyActivityStatus(state, dateB);

    assert.equal(statusA.completedCount, 5);
    assert.equal(statusA.isGoalMet, true);

    assert.equal(statusB.completedCount, 0);
    assert.equal(statusB.isGoalMet, false);
  });
});
