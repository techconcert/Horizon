/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSanctuary } from '../context/SanctuaryContext';
import { TabType } from '../types';
import { Home, PenLine, Compass, BookOpen, HeartHandshake } from 'lucide-react';

export const NavBar: React.FC = () => {
  const { state, setActiveTab, setShowSOSModal, getTranslation } = useSanctuary();

  const navItems: { tab: TabType | 'sos'; labelKey: string; icon: (isActive: boolean) => React.ReactNode; isRed?: boolean; onClick?: () => void }[] = [
    { tab: 'home', labelKey: 'home_tab', icon: (active) => <Home className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'trackers', labelKey: 'trackers_tab', icon: (active) => <PenLine className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'tools', labelKey: 'tools_tab', icon: (active) => <Compass className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    { tab: 'lessons', labelKey: 'lessons_tab', icon: (active) => <BookOpen className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-black/60'}`} /> },
    {
      tab: 'sos',
      labelKey: 'reach_out',
      icon: (active) => <HeartHandshake className={`w-6 h-6 ${active ? 'text-[#F8F5F2]' : 'text-red-800'}`} />,
      isRed: true,
      onClick: () => setShowSOSModal(true)
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 flex justify-center items-center px-4 py-3 bg-[#F5F2EB]/95 backdrop-blur-md border-t border-black/10 shadow-lg pb-safe">
      <div className="flex justify-around items-center w-full max-w-xl mx-auto py-1">
        {navItems.map(({ tab, labelKey, icon, isRed, onClick }) => {
          const isActive = state.activeTab === tab;
          const handleClick = onClick ? onClick : () => setActiveTab(tab as TabType);

          return (
            <button
              key={tab}
              onClick={handleClick}
              className="flex flex-col items-center justify-center group focus:outline-none cursor-pointer w-16 md:w-20"
              title={getTranslation(labelKey)}
              aria-label={getTranslation(labelKey)}
            >
              <div
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? isRed
                      ? 'bg-red-800 shadow-md scale-105'
                      : 'bg-[#3e6355] shadow-md scale-105'
                    : isRed
                    ? 'bg-transparent border border-red-800/25 text-red-800 hover:bg-red-900/10'
                    : 'bg-transparent hover:bg-black/5'
                }`}
              >
                {icon(isActive)}
              </div>
              <span
                className={`text-[7.5px] md:text-[8.5px] font-bold tracking-wide uppercase mt-1 text-center leading-none transition-colors font-sans duration-200 max-w-full truncate px-0.5 ${
                  isActive
                    ? isRed
                      ? 'text-red-800 font-extrabold'
                      : 'text-[#3e6355] font-extrabold'
                    : isRed
                    ? 'text-red-800 font-extrabold'
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
