import React from 'react';
import { BookOpen, AlertTriangle, Copy, Check } from 'lucide-react';
import { Language } from '../types';
import { SETUP_GUIDE_STEPS, SetupStep } from '../data/initialData';
import { translations } from '../data/translations';

interface GuideViewProps {
  guideState: Record<string, boolean>;
  onToggleStep: (key: string) => void;
  onCopyText: (text: string, label: string) => void;
  lang: Language;
}

export const GuideView: React.FC<GuideViewProps> = ({
  guideState,
  onToggleStep,
  onCopyText,
  lang
}) => {
  const t = translations[lang];

  const completedCount = SETUP_GUIDE_STEPS.filter((s) => guideState[s.key]).length;

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <span>{t.guideTitle}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t.guideDesc}
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs font-semibold shrink-0">
          {completedCount} / {SETUP_GUIDE_STEPS.length} {t.stepOf}
        </span>
      </div>

      {/* Meta Policy Note */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t.policyTitle}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{t.policyDesc}</p>
      </div>

      {/* Checklist Steps */}
      <div className="space-y-3">
        {SETUP_GUIDE_STEPS.map((step: SetupStep) => {
          const isDone = !!guideState[step.key];
          const title = lang === 'ar' ? step.title_ar : step.title_en;
          const desc = lang === 'ar' ? step.desc_ar : step.desc_en;

          return (
            <div
              key={step.key}
              className={`bg-slate-900 border ${
                isDone ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'
              } rounded-2xl p-5 transition space-y-3 shadow-md`}
            >
              <div className="flex items-start justify-between gap-4">
                <label className="flex items-start gap-3.5 cursor-pointer select-none flex-1">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onToggleStep(step.key)}
                    className="mt-1 w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        isDone ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </label>
                <span
                  className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                    isDone
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? t.done : t.todo}
                </span>
              </div>

              {step.code && (
                <div className="ps-7">
                  <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-indigo-300 overflow-x-auto dir-ltr text-start">
                    <pre className="pe-16 leading-relaxed">{step.code}</pre>
                    <button
                      type="button"
                      onClick={() => onCopyText(step.code!, 'Command copied!')}
                      className="absolute top-2 end-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{t.copy}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
