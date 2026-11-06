import React from 'react';
import {
  Zap,
  Smartphone,
  ShieldCheck,
  KeyRound,
  BookOpen,
  Instagram,
  Languages,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { Language, TabKey } from '../types';
import { translations } from '../data/translations';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  campaignsCount: number;
  logsCount: number;
  completedGuideCount: number;
  totalGuideSteps: number;
  hasToken: boolean;
  lang: Language;
  onToggleLang: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  campaignsCount,
  logsCount,
  completedGuideCount,
  totalGuideSteps,
  hasToken,
  lang,
  onToggleLang
}) => {
  const t = translations[lang];

  const navItems = [
    {
      key: 'campaigns' as TabKey,
      label: t.campaignsTab,
      icon: Zap,
      badge: (
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
          {campaignsCount}
        </span>
      ),
      iconColor: 'text-amber-400'
    },
    {
      key: 'simulator' as TabKey,
      label: t.simulatorTab,
      icon: Smartphone,
      badge: (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">
          {t.interactive}
        </span>
      ),
      iconColor: 'text-pink-400'
    },
    {
      key: 'logs' as TabKey,
      label: t.logsTab,
      icon: ShieldCheck,
      badge: (
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
          {logsCount}
        </span>
      ),
      iconColor: 'text-emerald-400'
    },
    {
      key: 'settings' as TabKey,
      label: t.settingsTab,
      icon: KeyRound,
      iconColor: 'text-amber-400'
    },
    {
      key: 'guide' as TabKey,
      label: t.guideTab,
      icon: BookOpen,
      badge: (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-mono font-semibold">
          {completedGuideCount}/{totalGuideSteps}
        </span>
      ),
      iconColor: 'text-sky-400'
    },
    {
      key: 'troubleshooter' as TabKey,
      label: t.troubleshooterTab,
      icon: Wrench,
      badge: (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
          {t.troubleshooterBadge}
        </span>
      ),
      iconColor: 'text-rose-400'
    }
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-slate-900/90 border-b md:border-b-0 md:border-e border-slate-800 flex flex-col justify-between shrink-0 z-20 md:min-h-screen sticky top-0 backdrop-blur-md">
      <div>
        {/* Brand Header */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl ig-gradient flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white">{t.appName}</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {t.appBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Toggle Button */}
            <button
              onClick={onToggleLang}
              title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-medium border border-slate-700/60"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span className="uppercase text-[11px] font-bold">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Mobile Quick Simulator Button */}
            <button
              onClick={() => onTabChange('simulator')}
              className="md:hidden px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t.testLive}</span>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 md:p-4 flex md:flex-col gap-1.5 overflow-x-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.iconColor}`} />
                  <span>{item.label}</span>
                </span>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: API & Webhook Health Status */}
      <div className="hidden md:block p-4 border-t border-slate-800/80 space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t.webhookEndpoint}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {t.listening}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate text-start dir-ltr">
            POST /webhook/instagram
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">{t.graphApiToken}</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                hasToken
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              {hasToken ? t.tokenSaved : t.demoMode}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <strong className="text-emerald-400 font-mono">{"{\"status\":\"ok\"}"}</strong>
          </span>
          <span className="font-mono text-[11px]">Meta v21.0</span>
        </div>
      </div>
    </aside>
  );
};
