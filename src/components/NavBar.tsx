/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React from 'react';
import { useSanctuary } from '../context/SanctuaryContext';
import { TabType } from '../types';
import { Home, PenLine, Flower2, Wind, BookOpen } from 'lucide-react';

export const NavBar: React.FC = () => {
  const { state, setActiveTab, getTranslation } = useSanctuary();

  const navItems: { tab: TabType; labelKey: string; icon: (isActive: boolean) => React.ReactNode }[] = [
    { tab: 'home', labelKey: 'home_tab', icon: (active) => <Home className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'trackers', labelKey: 'trackers_tab', icon: (active) => <PenLine className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'meditation', labelKey: 'meditation_tab', icon: (active) => <Flower2 className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'breathing', labelKey: 'breathing_tab', icon: (active) => <Wind className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'lessons', labelKey: 'lessons_tab', icon: (active) => <BookOpen className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 flex justify-center items-center px-4 py-3 bg-[#F8F5F2] border-t border-black/10 shadow-lg pb-safe">
      <div className="flex justify-around items-center w-full max-w-xl mx-auto py-1">
        {navItems.map(({ tab, labelKey, icon }) => {
          const isActive = state.activeTab === tab || (tab === 'meditation' && state.activeTab === 'tools');

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-center justify-center group focus:outline-none cursor-pointer w-14 sm:w-16 md:w-20"
              title={getTranslation(labelKey)}
              aria-label={getTranslation(labelKey)}
            >
              <div
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-[#3e6355] shadow-md scale-105'
                    : 'bg-transparent hover:bg-black/5'
                }`}
              >
                {icon(isActive)}
              </div>
              <span
                className={`text-[7.5px] md:text-[8.5px] font-bold tracking-wide uppercase mt-1 text-center leading-none transition-colors font-sans duration-200 max-w-full truncate px-0.5 ${
                  isActive
                    ? 'text-[#3e6355] font-extrabold'
                    : 'text-black/45'
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
