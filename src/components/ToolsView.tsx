/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React from 'react';
import { MeditationView } from './MeditationView';
import { BreathingView } from './BreathingView';

export { MeditationView, BreathingView };

export const ToolsView: React.FC = () => {
  return <MeditationView />;
};
