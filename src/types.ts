/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TabType = 'home' | 'trackers' | 'tools' | 'lessons' | 'profile';

export type MoodType = 
  | 'Calm' 
  | 'Content' 
  | 'Joyful' 
  | 'Hopeful' 
  | 'Peaceful' 
  | 'Grateful' 
  | 'Anxious' 
  | 'Frustrated' 
  | 'Overwhelmed' 
  | 'Tired' 
  | 'Lonely' 
  | 'Angry';

export interface MoodConfig {
  name: MoodType;
  icon: string;
  color: string;
}

export interface Reflection {
  id: string;
  date: string; // ISO date string or formatted date
  title: string;
  content: string;
  moods: MoodType[];
}

export interface TranslatedText {
  English: string;
  Español: string;
  Português: string;
}

export interface TranslatedStringArray {
  English: string[];
  Español: string[];
  Português: string[];
}

export interface SubLesson {
  id: string;
  title: TranslatedText;
  description: TranslatedText;
  content: TranslatedText;
  reflectionQuestions: TranslatedStringArray;
  status: 'READ' | 'IN PROGRESS' | 'UNREAD';
  stepId: string;
}

export interface Step {
  id: string;
  number: number;
  title: TranslatedText;
  description: TranslatedText;
  totalDays: number;
  completedDays: number;
  locked: boolean;
  subLessons: SubLesson[];
}

export interface SanctuaryState {
  sobrietyStartDate: string; // ISO string
  reflections: Reflection[];
  activeTab: TabType;
  currentLessonId: string | null; // For sub-lesson detail view
  soberCheckedInToday: boolean;
  biometricLock: boolean;
  language: 'English' | 'Español' | 'Português';
  syncEnabled: boolean;
  customMoods: string[];
  onboarded: boolean;
  lastSoberCheckInTime?: string | null;
  supportNumber?: string;
  sponsorName?: string;
  sponsorNumber?: string;
  supportLink?: string;
}
