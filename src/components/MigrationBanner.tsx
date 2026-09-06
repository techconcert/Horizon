/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, Copy, Check, X } from 'lucide-react';
import { isOldDomain } from '../utils/migration';
import { useSanctuary } from '../context/SanctuaryContext';

interface BannerText {
  domainPrefix: string;
  domainName: string;
  instruction: string;
  copyTooltip: string;
  copied: string;
  openSite: string;
  closeAria: string;
  successMsg: string;
}

const TEXTS: Record<'English' | 'Español' | 'Português', BannerText> = {
  English: {
    domainPrefix: 'Official New Domain:',
    domainName: 'horizon-barrmy.ai.studio',
    instruction: 'Install the updated app and enter this code when prompted:',
    copyTooltip: 'Copy transfer code',
    copied: 'Copied!',
    openSite: 'Open New Site',
    closeAria: 'Close banner',
    successMsg: 'Data transferred successfully to horizon-barrmy.ai.studio! Your recovery streak and journal are safe.',
  },
  Português: {
    domainPrefix: 'Novo Domínio Oficial:',
    domainName: 'horizon-barrmy.ai.studio',
    instruction: 'Instale o app atualizado e insira este código quando solicitado:',
    copyTooltip: 'Copiar código de transferência',
    copied: 'Copiado!',
    openSite: 'Abrir Novo Site',
    closeAria: 'Fechar aviso',
    successMsg: 'Dados transferidos com sucesso para horizon-barrmy.ai.studio! Seu progresso e diário estão seguros.',
  },
  Español: {
    domainPrefix: 'Nuevo Dominio Oficial:',
    domainName: 'horizon-barrmy.ai.studio',
    instruction: 'Instala la app actualizada e introduce este código cuando se te solicite:',
    copyTooltip: 'Copiar código de transferencia',
    copied: '¡Copiado!',
    openSite: 'Abrir Nuevo Sitio',
    closeAria: 'Cerrar aviso',
    successMsg: '¡Datos transferidos con éxito a horizon-barrmy.ai.studio! Tu racha de recuperación y diario están a salvo.',
  },
};

export const MigrationBanner: React.FC = () => {
  const { state, syncCode, syncToCloud } = useSanctuary();
  const [showOldDomainBanner, setShowOldDomainBanner] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const lang = state.language || 'English';
  const t = TEXTS[lang] || TEXTS.English;

  useEffect(() => {
    // Check if on old domain
    if (isOldDomain()) {
      const dismissed = sessionStorage.getItem('horizon_migration_dismissed');
      if (!dismissed) {
        setShowOldDomainBanner(true);
        // Ensure latest data is backed up to Firestore under this device's sync code
        syncToCloud().catch(() => {});
      }
    }

    // Check if just migrated
    if (sessionStorage.getItem('horizon_migrated_success') === 'true') {
      setShowSuccessToast(true);
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
        sessionStorage.removeItem('horizon_migrated_success');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [syncToCloud]);

  const handleDismissOldBanner = () => {
    sessionStorage.setItem('horizon_migration_dismissed', 'true');
    setShowOldDomainBanner(false);
  };

  const handleCopyCode = async () => {
    if (syncCode) {
      syncToCloud().catch(() => {});
      try {
        await navigator.clipboard.writeText(syncCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2500);
      } catch (err) {
        console.error('Failed to copy sync code:', err);
      }
    }
  };

  if (showSuccessToast) {
    return (
      <div id="migration-success-toast" className="bg-emerald-950/95 text-emerald-100 px-4 py-3 text-xs flex items-center justify-between border-b border-emerald-700/60 backdrop-blur-md sticky top-0 z-50 animate-in fade-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2.5 max-w-2xl mx-auto w-full">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <p className="font-sans font-semibold text-emerald-100 text-[11px] sm:text-xs">
            {t.successMsg}
          </p>
        </div>
        <button
          onClick={() => {
            setShowSuccessToast(false);
            sessionStorage.removeItem('horizon_migrated_success');
          }}
          className="p-1 hover:bg-emerald-800 rounded-full cursor-pointer transition-colors shrink-0 ml-2"
          aria-label={t.closeAria}
        >
          <X className="w-3.5 h-3.5 text-emerald-300" />
        </button>
      </div>
    );
  }

  if (!showOldDomainBanner) return null;

  return (
    <div id="migration-transfer-banner" className="bg-[#24211E] text-[#F8F5F2] px-4 py-3 text-xs border-b border-white/10 sticky top-0 z-50 shadow-md relative">
      {/* Close button anchored to the top left */}
      <button
        onClick={handleDismissOldBanner}
        className="absolute top-2.5 left-3 p-1 text-[#F8F5F2]/60 hover:text-[#F8F5F2] rounded-full cursor-pointer transition-colors z-20"
        title={t.closeAria}
        aria-label={t.closeAria}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-2 pl-8 pr-2 sm:px-10">
        <div className="font-sans leading-snug">
          <p className="text-[11px] sm:text-xs text-[#F8F5F2]">
            <strong className="text-[#C9A96E]">{t.domainPrefix}</strong> {t.domainName}
          </p>
          <p className="text-[11px] sm:text-xs text-[#F8F5F2]/90 mt-0.5">
            {t.instruction}
          </p>
        </div>

        {/* Transfer code with copy button and Open New Site link */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-0.5">
          <div className="inline-flex items-center gap-2 bg-black/50 border border-white/15 px-3 py-1.5 rounded-xl">
            <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#E5D7B7]">
              {syncCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 hover:bg-white/10 rounded-md text-[#F8F5F2]/80 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              title={t.copyTooltip}
              aria-label={t.copyTooltip}
            >
              {codeCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-semibold">{t.copied}</span>
                </>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <a
            href="https://horizon-barrmy.ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              syncToCloud().catch(() => {});
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-[#C9A96E] hover:bg-[#D8B97E] text-black font-semibold px-4 py-1.5 rounded-xl text-[11px] sm:text-xs transition-colors cursor-pointer shadow-sm tracking-wide"
          >
            <span>{t.openSite}</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
