/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import LZString from 'lz-string';
import { normalizeSyncCode, detectClientOrigin } from './cloudSync';
import { compactSteps, hydrateSteps } from '../utils/stepCompactor';
import lessonsData from '../data/lessons.json' with { type: 'json' };
import { Step } from '../types';

describe('Cloud Sync & Free-Tier Optimization Tests', () => {
  const INITIAL_STEPS = lessonsData as Step[];

  test('normalizeSyncCode produces valid HZ-XXXX code format', () => {
    assert.strictEqual(normalizeSyncCode('hz4k2p'), 'HZ-4K2P');
    assert.strictEqual(normalizeSyncCode('HZ-9M8X'), 'HZ-9M8X');
    assert.strictEqual(normalizeSyncCode('4K2P'), 'HZ-4K2P');
    assert.strictEqual(normalizeSyncCode(''), '');
  });

  test('compactSteps reduces 1.1MB steps data by >99% for new and progressing users', () => {
    const rawInitialSize = JSON.stringify(INITIAL_STEPS).length;
    assert.ok(rawInitialSize > 1000000, `Raw initial size should be >1MB, got ${rawInitialSize}`);

    // Initial state compacting
    const compactedInitial = compactSteps(INITIAL_STEPS);
    const compactInitialSize = JSON.stringify(compactedInitial).length;
    assert.ok(compactInitialSize < 2000, `Compacted initial size should be <2KB, got ${compactInitialSize}`);

    // With active user progress (step 1 done, step 2 active)
    const progressingSteps = JSON.parse(JSON.stringify(INITIAL_STEPS));
    progressingSteps[0].completedDays = 7;
    progressingSteps[0].subLessons.forEach((s: any) => {
      s.status = 'READ';
    });
    progressingSteps[1].locked = false;
    progressingSteps[1].completedDays = 2;
    progressingSteps[1].subLessons[0].status = 'READ';
    progressingSteps[1].subLessons[1].status = 'IN PROGRESS';

    const compactedProgress = compactSteps(progressingSteps);
    const compactProgressSize = JSON.stringify(compactedProgress).length;
    assert.ok(compactProgressSize < 2000, `Compacted progress size should be <2KB, got ${compactProgressSize}`);

    const reductionPercent = ((rawInitialSize - compactProgressSize) / rawInitialSize) * 100;
    assert.ok(reductionPercent > 99.5, `Reduction must be > 99.5%, got ${reductionPercent.toFixed(2)}%`);
  });

  test('hydrateSteps restores full text, titles, prompts and user progress from compact format', () => {
    const progressingSteps = JSON.parse(JSON.stringify(INITIAL_STEPS));
    progressingSteps[0].completedDays = 7;
    progressingSteps[0].subLessons.forEach((s: any) => {
      s.status = 'READ';
    });
    progressingSteps[1].locked = false;
    progressingSteps[1].completedDays = 2;
    progressingSteps[1].subLessons[0].status = 'READ';
    progressingSteps[1].subLessons[1].status = 'IN PROGRESS';

    const compacted = compactSteps(progressingSteps);
    const restored = hydrateSteps(compacted, INITIAL_STEPS);

    assert.strictEqual(restored.length, 12, 'Must have all 12 steps');
    assert.strictEqual(restored[0].completedDays, 7);
    assert.strictEqual(restored[0].locked, false);
    assert.strictEqual(restored[0].subLessons[0].status, 'READ');
    assert.strictEqual(restored[1].locked, false);
    assert.strictEqual(restored[1].completedDays, 2);
    assert.strictEqual(restored[1].subLessons[0].status, 'READ');
    assert.strictEqual(restored[1].subLessons[1].status, 'IN PROGRESS');
    assert.strictEqual(restored[1].subLessons[2].status, 'UNREAD');
    assert.strictEqual(restored[2].locked, true);

    // Verify rich multilingual content was restored
    assert.ok(restored[0].title.English.includes('Step 1'));
    assert.ok(restored[0].subLessons[0].title.English.length > 0);
    assert.ok(restored[0].subLessons[0].content.English.length > 0);
  });

  test('hydrateSteps backwards compatibility with legacy uncompacted steps', () => {
    const legacySteps = JSON.parse(JSON.stringify(INITIAL_STEPS));
    legacySteps[0].completedDays = 5;
    legacySteps[0].subLessons[0].status = 'READ';

    const restored = hydrateSteps(legacySteps, INITIAL_STEPS);
    assert.strictEqual(restored.length, 12);
    assert.strictEqual(restored[0].completedDays, 5);
    assert.strictEqual(restored[0].subLessons[0].status, 'READ');
    assert.ok(restored[0].title.English.includes('Step 1'));
  });

  test('LZString compressToBase64 and decompressFromBase64 retains 100% data fidelity', () => {
    const payload = {
      sobrietyStartDate: '2025-01-01',
      language: 'English',
      reflections: [
        { id: '1', title: 'Day 1', content: 'Feeling grounded and grateful.', date: '2025-01-01' },
        { id: '2', title: 'Day 2', content: 'Practiced deep breathing in morning.', date: '2025-01-02' }
      ],
      steps: compactSteps(INITIAL_STEPS),
      customMoods: ['Mindful', 'Calm'],
      brotherhoods: [{ id: 'b1', name: 'Mark S.', phone: '555-0123' }],
      dailyActivities: {
        '2026-09-13': { justForToday: true, checkIn: true, meditation: true, breathing: true, lesson: true }
      }
    };

    const jsonStr = JSON.stringify(payload);
    const compressed = LZString.compressToBase64(jsonStr);

    assert.ok(typeof compressed === 'string');
    assert.ok(compressed.length > 0);
    assert.ok(compressed.length < jsonStr.length, 'Compressed string should be smaller than raw JSON');

    const decompressed = LZString.decompressFromBase64(compressed);
    assert.ok(decompressed !== null);
    const restoredPayload = JSON.parse(decompressed!);

    assert.deepStrictEqual(restoredPayload, payload);
  });

  test('detectClientOrigin identifies environment without crashing in Node', () => {
    const origin = detectClientOrigin();
    assert.ok(typeof origin === 'string');
    assert.ok(origin.length > 0);
  });
});
