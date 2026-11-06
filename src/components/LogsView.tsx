import React from 'react';
import { Trash2, ShieldCheck, CheckCircle2, ShieldAlert, MinusCircle } from 'lucide-react';
import { ProcessedComment, Language } from '../types';
import { translations } from '../data/translations';

interface LogsViewProps {
  logs: ProcessedComment[];
  onPromptClearLogs: () => void;
  lang: Language;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onPromptClearLogs, lang }) => {
  const t = translations[lang];

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{t.logsTitle}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t.logsDesc}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onPromptClearLogs}
            disabled={logs.length === 0}
            className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 disabled:pointer-events-none text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.clearTable}</span>
          </button>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">{t.colCommentId}</th>
                <th className="py-3.5 px-4">{t.colPostId}</th>
                <th className="py-3.5 px-4">{t.colCommenter}</th>
                <th className="py-3.5 px-4">{t.colText}</th>
                <th className="py-3.5 px-4">{t.colKeyword}</th>
                <th className="py-3.5 px-4">{t.colOutcome}</th>
                <th className="py-3.5 px-4 text-end">{t.colTime}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No webhook events logged yet. Open the Live IG Simulator to test comments!
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  let badge = null;
                  if (log.status === 'TRIGGERED') {
                    badge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{t.statusSent}</span>
                      </span>
                    );
                  } else if (log.status === 'DUPLICATE_BLOCKED') {
                    badge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold text-[11px]">
                        <ShieldAlert className="w-3 h-3 text-amber-400" />
                        <span>{t.statusDuplicate}</span>
                      </span>
                    );
                  } else {
                    badge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold text-[11px]">
                        <MinusCircle className="w-3 h-3 text-slate-400" />
                        <span>{t.statusNoMatch}</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={index} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-300 dir-ltr text-start">
                        {log.comment_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 dir-ltr text-start">
                        {log.post_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-white dir-ltr text-start">
                        @{log.commenter_username}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {log.comment_text}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-mono text-[11px]">
                          {log.matched_keyword}
                        </span>
                      </td>
                      <td className="py-3 px-4">{badge}</td>
                      <td className="py-3 px-4 text-end font-mono text-slate-400 dir-ltr">
                        {log.timestamp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
