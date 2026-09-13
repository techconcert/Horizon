/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React from 'react';
import { useHorizon } from '../context/HorizonContext';
import { TabType } from '../types';
import { Home, PenLine, Flower2, Wind, BookOpen } from 'lucide-react';

export const NavBar: React.FC = () => {
  const { state, setActiveTab, getTranslation } = useHorizon();

  const navItems: { tab: TabType; labelKey: string; icon: (isActive: boolean) => React.ReactNode }[] = [
    { tab: 'home', labelKey: 'home_tab', icon: (active) => <Home className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'trackers', labelKey: 'trackers_tab', icon: (active) => <PenLine className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'meditation', labelKey: 'meditation_tab', icon: (active) => <Flower2 className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'breathing', labelKey: 'breathing_tab', icon: (active) => <Wind className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'lessons', labelKey: 'lessons_tab', icon: (active) => <BookOpen className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-50 flex justify-center items-center px-2 sm:px-4 pt-2.5 bg-[#F8F5F2]/95 backdrop-blur-md border-t border-black/10 shadow-lg"
      style={{ paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))' }}
    >
      <div className="flex justify-around items-center w-full max-w-xl mx-auto">
        {navItems.map(({ tab, labelKey, icon }) => {
          const isActive = state.activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-center justify-center group focus:outline-none cursor-pointer min-w-[48px] min-h-[44px] py-1 w-14 sm:w-16 md:w-20 touch-manipulation select-none"
              title={getTranslation(labelKey)}
              aria-label={getTranslation(labelKey)}
            >
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-[#3e6355] shadow-md scale-105'
                    : 'bg-transparent hover:bg-black/5 active:bg-black/10'
                }`}
              >
                {icon(isActive)}
              </div>
              <span
                className={`text-[7.5px] sm:text-[8px] md:text-[8.5px] font-bold tracking-wide uppercase mt-0.5 text-center leading-tight transition-colors font-sans duration-200 max-w-full truncate px-0.5 ${
                  isActive
                    ? 'text-[#3e6355] font-extrabold'
                    : 'text-black/50'
                }`}
              >
                {getTranslation(labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
