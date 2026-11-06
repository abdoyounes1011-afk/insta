import React from 'react';
import { Megaphone, Reply, Send, ShieldAlert, CheckCircle } from 'lucide-react';
import { Metrics, Language } from '../types';
import { translations } from '../data/translations';

interface TopMetricsProps {
  metrics: Metrics;
  activeCampaignsCount: number;
  lang: Language;
}

export const TopMetrics: React.FC<TopMetricsProps> = ({
  metrics,
  activeCampaignsCount,
  lang
}) => {
  const t = translations[lang];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Active Campaigns */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">{t.activeCampaigns}</p>
          <p className="text-2xl font-bold text-white mt-1">{activeCampaignsCount}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>{t.trackingComments}</span>
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Public Replies Sent */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">{t.repliesSent}</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.replies_sent}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono dir-ltr text-start">
            reply_to_comment()
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg shrink-0">
          <Reply className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Private DMs Delivered */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">{t.dmsSent}</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.dms_sent}</p>
          <p className="text-[11px] text-pink-400 mt-0.5 font-mono dir-ltr text-start">
            send_dm()
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 text-lg shrink-0">
          <Send className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Duplicates Blocked */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-slate-400">{t.duplicatesBlocked}</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.duplicates_blocked}</p>
          <p className="text-[11px] text-amber-400 mt-0.5 font-mono">
            {t.dedupTable}
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
};
