/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SanctuaryProvider, useSanctuary } from './context/SanctuaryContext';
import { NavBar } from './components/NavBar';
import { HomeView } from './components/HomeView';
import { TrackersView } from './components/TrackersView';
import { MeditationView } from './components/MeditationView';
import { BreathingView } from './components/BreathingView';
import { ToolsView } from './components/ToolsView';
import { LessonsView } from './components/LessonsView';
import { ProfileView } from './components/ProfileView';
import { Shield, Lock, Fingerprint, RefreshCw, User, HeartHandshake, X, Phone, Video } from 'lucide-react';

import { OnboardingView } from './components/OnboardingView';
import { MigrationBanner } from './components/MigrationBanner';

const SanctuaryContent: React.FC = () => {
  const { state, setActiveTab, showSOSModal, setShowSOSModal, getTranslation } = useSanctuary();

  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [passcode, setPasscode] = useState<string>('');

  // Handle automatic simulated authentication on mount if lock is on
  useEffect(() => {
    setSessionUnlocked(true);
  }, []);

  // Alternating headers & footers:
  // Header 1 with Footer 1 for Home & Tools; Header 2 with Footer 2 for Trackers & Lessons
  const isAltTheme = state.activeTab === 'trackers' || state.activeTab === 'lessons';

  // Preload and cache all header/footer images on initial mount so they remain in memory
  useEffect(() => {
    const urls = [
      '/horizon_header_1.png',
      '/horizon_header_2.png',
      '/horizon_footer_1.png',
      '/horizon_footer_2.png',
    ];
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  if (!state.onboarded) {
    return <OnboardingView />;
  }

  const handlePasscodeClick = (num: number) => {
    if (passcode.length < 4) {
      const nextPass = passcode + num;
      setPasscode(nextPass);
      if (nextPass.length === 4) {
        // Any 4 digit passcode succeeds for simulation
        setTimeout(() => {
          setSessionUnlocked(true);
          setPasscode('');
        }, 300);
      }
    }
  };

  const handleClearPasscode = () => {
    setPasscode('');
  };

  const simulateBiometricSuccess = () => {
    setSessionUnlocked(true);
  };

  // Render Lock Screen if biometric lock is active and session is locked
  if (false) {
    return (
      <main className="fixed inset-0 bg-[#F8F5F2] flex flex-col items-center justify-between p-8 z-50 animate-fadeIn border-8 border-black/5">
        {/* Editorial Masthead Style Markers */}
        <div className="w-full flex justify-between items-center text-[10px] uppercase tracking-widest font-mono opacity-50 border-b border-black/5 pb-4">
          <span>SECURE SYSTEM // NO. 042</span>
          <span>EST. 2026</span>
        </div>

        {/* Core Lock Display */}
        <div className="flex flex-col items-center justify-center text-center my-auto max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-black text-[#F8F5F2] flex items-center justify-center mb-8 border border-black shadow-none">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-4xl font-normal text-[#111111] mb-2 tracking-tight">
            {getTranslation('app_title')}
          </h1>
          <p className="font-sans text-[10px] font-semibold text-black tracking-widest uppercase mb-6 opacity-60">
            — Private Sanctuary —
          </p>
          <p className="font-sans text-xs text-[#444444] mb-8 max-w-xs leading-relaxed">
            {state.language === 'English'
              ? 'Enter any 4-digit passcode or touch the fingerprint scanner to unlock your private recovery records.'
              : state.language === 'Español'
              ? 'Ingresa cualquier código de 4 dígitos o toca el lector para desbloquear tu registro privado.'
              : 'Insira qualquer código de 4 dígitos ou toque no leitor para desbloquear seu registro privado.'}
          </p>

          {/* Bullet Indicators */}
          <div className="flex justify-center space-x-4 mb-8">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full border border-black/30 transition-all duration-200 ${
                  passcode.length >= idx ? 'bg-black scale-110' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* Quick Simulate Fingerprint button */}
          <button
            onClick={simulateBiometricSuccess}
            className="flex items-center gap-2 bg-[#E5E1DB] hover:bg-[#D9D1C7] text-black border border-black/10 rounded-full px-6 py-3 font-sans text-[11px] font-bold tracking-wider uppercase transition-all mb-8 cursor-pointer"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Simulate FaceID / TouchID</span>
          </button>
        </div>

        {/* Numerical Keypad */}
        <div className="w-full max-w-xs grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handlePasscodeClick(num)}
              className="w-14 h-14 rounded-full bg-[#F8F5F2] text-[#111111] border border-black/10 flex items-center justify-center font-serif text-lg font-normal hover:bg-[#E5E1DB] active:bg-[#D9D1C7] transition-colors mx-auto cursor-pointer"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handlePasscodeClick(0)}
            className="w-14 h-14 rounded-full bg-[#F8F5F2] text-[#111111] border border-black/10 flex items-center justify-center font-serif text-lg font-normal hover:bg-[#E5E1DB] active:bg-[#D9D1C7] transition-colors mx-auto cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleClearPasscode}
            className="w-14 h-14 flex items-center justify-center font-sans text-[10px] font-bold text-red-800 tracking-wider uppercase mx-auto cursor-pointer rounded-full hover:bg-red-50"
          >
            CLEAR
          </button>
        </div>
      </main>
    );
  }

  const isEn = state.language === 'English';
  const isEs = state.language === 'Español';

  const reachOutTitle = isEn ? 'Reach Out Support' : isEs ? 'Pedir Apoyo / SOS' : 'Pedir Apoio / SOS';
  const reachOutDesc = isEn 
    ? 'Recovery is never walked alone. If you are struggling with a craving, experiencing anxiety, or need a gentle ear, remember you are worthy of connection.'
    : isEs
    ? 'La recuperación nunca se recorre solo. Si estás luchando con un deseo, sientes ansiedad o necesitas que te escuchen, recuerda que mereces conectar.'
    : 'A recuperação nunca é percorrida sozinho. Se você está lutando contra um desejo, sentindo ansiedade ou precisa de um ouvido amigo, lembre-se de que é digno de conexão.';
  const callText = isEn ? 'Call Support Helpline (988)' : isEs ? 'Línea de Apoyo 988' : 'Linha de Apoio (988)';
  const serenityText = isEn 
    ? '"God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference."'
    : isEs
    ? '"Dios, concédeme la serenidad para aceptar las cosas que no puedo cambiar, valor para cambiar las que puedo, y sabiduría para reconocer la diferencia."'
    : '"Deus, concedei-me a serenidade para aceitar as coisas que não posso mudar, coragem para mudar as que posso, e sabedoria para saber a diferença."';
  const closeButtonText = isEn ? 'Close' : isEs ? 'Cerrar' : 'Fechar';

  // Render App Contents
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5F2] text-[#111111] relative selection:bg-black/10 select-none pb-safe">
      {/* Seamless cross-domain migration banner */}
      <MigrationBanner />

      {/* Dynamic alternating page header background using user's uploaded PNGs (both permanently mounted in DOM for instant cache) */}
      <div
        aria-hidden="true"
        className="absolute top-0 inset-x-0 w-full h-36 sm:h-44 md:h-52 lg:h-60 overflow-hidden pointer-events-none z-0 select-none"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.00) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.00) 100%)',
        }}
      >
        <img
          src="/horizon_header_1.png"
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-fill object-top transition-opacity duration-300 ${
            !isAltTheme ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <img
          src="/horizon_header_2.png"
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-fill object-top transition-opacity duration-300 ${
            isAltTheme ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Persistent Top-Right Action: Reach Out ONLY (the only sticky button) */}
      <div className="fixed top-3 right-4 md:right-8 z-50">
        <button
          onClick={() => setShowSOSModal(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center select-none bg-red-800 hover:bg-red-700 active:bg-red-900 text-white border border-red-900/30 shadow-xs transition-all cursor-pointer touch-manipulation active:scale-95"
          title={reachOutTitle}
          aria-label={reachOutTitle}
        >
          <HeartHandshake className="w-4.5 h-4.5 text-white stroke-[2.2]" />
        </button>
      </div>

      {/* Top Header Navigation Bar (non-sticky, scrolls with page) */}
      <header className="relative w-full z-40 px-4 md:px-8 py-3 flex items-center justify-between bg-transparent">
        <div className="flex flex-col">
          <h1 className="font-serif text-2xl md:text-3xl text-[#143224] font-semibold tracking-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]">
            {getTranslation('app_title')}
          </h1>
          <span className="hidden md:inline-block font-sans text-[10px] font-bold text-[#143224]/70 tracking-widest uppercase mt-0.5">
            {getTranslation('step_chip')}
          </span>
        </div>

        {/* Centered Step Indicator (Plain text only, centered in top bar) */}
        {(state.activeTab === 'trackers' || state.activeTab === 'meditation') && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <span className="font-sans text-[11px] sm:text-xs font-extrabold tracking-widest uppercase text-[#143224]/80 select-none">
              {state.activeTab === 'trackers' && (isEn ? 'STEP 10' : isEs ? 'PASO 10' : 'PASSO 10')}
              {state.activeTab === 'meditation' && (isEn ? 'STEP 11' : isEs ? 'PASO 11' : 'PASSO 11')}
            </span>
          </div>
        )}

        {/* Right Actions: Cloud Sync & Settings/Profile (non-sticky, scrolls with header, leaving room for fixed Reach Out button) */}
        <div className="flex items-center gap-2 pr-11">
          {state.syncEnabled && (
            <div className="hidden sm:flex items-center gap-1.5 text-[#143224] bg-[#E5E1DB]/90 backdrop-blur-xs border border-[#143224]/10 rounded-full px-3 py-1 text-[9px] font-bold tracking-widest uppercase shadow-2xs">
              <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
              <span>{isEn ? 'Synced' : isEs ? 'Sincronizado' : 'Sincronizado'}</span>
            </div>
          )}

          {/* Settings / Profile button (non-sticky) */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-8 h-8 rounded-full flex items-center justify-center select-none border transition-all cursor-pointer shadow-xs ${
              state.activeTab === 'profile'
                ? 'bg-[#3e6355] border-[#3e6355] text-[#F8F5F2] scale-105 ring-2 ring-[#3e6355]/30'
                : 'bg-[#183628] border-[#183628] text-[#F8F5F2] hover:bg-[#254d3b]'
            }`}
            title={isEn ? 'Settings' : isEs ? 'Ajustes' : 'Configurações'}
            aria-label={isEn ? 'Settings' : isEs ? 'Ajustes' : 'Configurações'}
          >
            <User className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Viewport panel */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 pt-1 pb-24 md:pt-2 md:pb-24 relative z-10 animate-fadeIn">
        {state.activeTab === 'home' && <HomeView />}
        {state.activeTab === 'trackers' && <TrackersView />}
        {(state.activeTab === 'meditation' || state.activeTab === 'tools') && <MeditationView />}
        {state.activeTab === 'breathing' && <BreathingView />}
        {state.activeTab === 'lessons' && <LessonsView />}
        {state.activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Dynamic alternating page footer background using user's uploaded PNGs (both permanently mounted in DOM for instant cache) */}
      <div
        aria-hidden="true"
        className="absolute bottom-[68px] sm:bottom-[72px] inset-x-0 w-full h-36 sm:h-44 md:h-52 lg:h-60 overflow-hidden pointer-events-none z-0 select-none"
        style={{
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.00) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.00) 100%)',
        }}
      >
        <img
          src="/horizon_footer_1.png"
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-fill object-bottom transition-opacity duration-300 ${
            !isAltTheme ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <img
          src="/horizon_footer_2.png"
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-fill object-bottom transition-opacity duration-300 ${
            isAltTheme ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Navigation panel */}
      <NavBar />

      {/* Global SOS Support Modal */}
      {showSOSModal && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-[#F8F5F2] rounded-3xl max-w-md w-full p-6 border border-black/25 shadow-2xl">
            <div className="flex justify-between items-center pb-2.5 border-b border-black/5 shrink-0 mb-4">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-red-900" />
                <h3 className="font-sans text-xs font-extrabold text-black uppercase tracking-widest">
                  {reachOutTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowSOSModal(false)}
                className="text-black/50 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="font-sans text-xs text-[#444444] leading-relaxed mb-6">
              {reachOutDesc}
            </p>

            <div className="flex flex-col gap-3">
              {/* Support Helpline Call */}
              <a
                href={`tel:${state.supportNumber || '988'}`}
                className="flex items-center justify-between p-3.5 bg-red-950/5 text-red-900 hover:bg-red-950/10 rounded-2xl border border-red-900/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 shrink-0 text-red-900" />
                  <div className="flex flex-col items-start">
                    <span className="font-sans text-xs font-bold uppercase tracking-widest text-red-900">
                      {isEn ? 'Support Helpline' : isEs ? 'Línea de Apoyo' : 'Linha de Apoio'}
                    </span>
                    <span className="font-mono text-[10px] opacity-70">
                      {state.supportNumber || '988'}
                    </span>
                  </div>
                </div>
              </a>

              {/* Sponsor Call */}
              {state.sponsorNumber && (
                <a
                  href={`tel:${state.sponsorNumber}`}
                  className="flex items-center justify-between p-3.5 bg-[#3e6355]/5 text-[#3e6355] hover:bg-[#3e6355]/10 rounded-2xl border border-[#3e6355]/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 shrink-0 text-[#3e6355]" />
                    <div className="flex flex-col items-start">
                      <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#3e6355]">
                        {isEn ? 'Sponsor' : isEs ? 'Patrocinador' : 'Padrinho / Madrinha'}
                      </span>
                      {state.sponsorName && (
                        <span className="font-serif text-[11px] italic opacity-85 mt-0.5">
                          {state.sponsorName}
                        </span>
                      )}
                      <span className="font-mono text-[10px] opacity-75 mt-0.5">
                        {state.sponsorNumber}
                      </span>
                    </div>
                  </div>
                  <span className="font-sans text-[8px] font-bold tracking-widest uppercase opacity-60">
                    {isEn ? 'Personal' : isEs ? 'Personal' : 'Pessoal'}
                  </span>
                </a>
              )}

              {/* 24/7 Meeting Room Video Conference Link */}
              {state.supportLink && (
                <a
                  href={state.supportLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-blue-950/5 text-blue-900 hover:bg-blue-950/10 rounded-2xl border border-blue-900/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 shrink-0 text-blue-900" />
                    <div className="flex flex-col items-start">
                      <span className="font-sans text-xs font-bold uppercase tracking-widest text-blue-900">
                        {isEn ? 'Video Conference' : isEs ? 'Videoconferencia' : 'Videoconferência'}
                      </span>
                      <span className="font-sans text-[10px] opacity-75 truncate max-w-[200px] mt-0.5">
                        {state.supportLink}
                      </span>
                    </div>
                  </div>
                  <span className="font-sans text-[8px] font-bold tracking-widest uppercase opacity-60">
                    {isEn ? '24/7 Live' : isEs ? '24/7 En Vivo' : '24/7 Ao Vivo'}
                  </span>
                </a>
              )}

              {/* Serenity Prayer block */}
              <div className="bg-[#E5E1DB] p-4 rounded-2xl border border-black/15">
                <p className="font-sans text-[9px] font-bold text-black/60 uppercase tracking-widest mb-2">
                  {getTranslation('serenity_prayer')}
                </p>
                <blockquote className="font-serif text-xs text-black/70 italic leading-relaxed">
                  {serenityText}
                </blockquote>
              </div>
            </div>

            <button
              onClick={() => setShowSOSModal(false)}
              className="w-full mt-6 bg-black text-[#F8F5F2] font-sans text-[10px] font-bold tracking-widest uppercase py-3 rounded-full hover:bg-black/80 border border-black cursor-pointer transition-colors"
            >
              {closeButtonText}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function App() {
  return (
    <SanctuaryProvider>
      <SanctuaryContent />
    </SanctuaryProvider>
  );
}
