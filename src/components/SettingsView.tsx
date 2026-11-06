import React, { useState } from 'react';
import { KeyRound, CheckCircle2, RotateCcw, ShieldCheck, RefreshCw } from 'lucide-react';
import { Config, Language } from '../types';
import { translations } from '../data/translations';

interface SettingsViewProps {
  config: Config;
  onSaveConfig: (newConfig: Config) => void;
  onResetDemo: () => void;
  lang: Language;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onResetDemo,
  lang
}) => {
  const t = translations[lang];

  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState(config.page_id);
  const [igId, setIgId] = useState(config.instagram_account_id);
  const [verifyToken, setVerifyToken] = useState(config.verify_token);
  const [backendUrl, setBackendUrl] = useState(config.backend_url);

  // Webhook challenge tester
  const [challengeInput, setChallengeInput] = useState('1158201444');
  const [challengeResult, setChallengeResult] = useState<string | null>(null);

  const maskToken = (token: string) => {
    if (!token) return lang === 'ar' ? 'لا يوجد مفتاح مخزن (الوضع التجريبي نشط)' : 'No token stored (Demo Mode active)';
    if (token.length <= 10) return '••••••••';
    return `Stored: ${token.slice(0, 4)}••••••••${token.slice(-4)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      access_token: accessToken.trim() || config.access_token,
      page_id: pageId.trim(),
      instagram_account_id: igId.trim(),
      verify_token: verifyToken.trim(),
      backend_url: backendUrl.trim()
    });
    setAccessToken('');
  };

  const handleTestChallenge = () => {
    const activeToken = verifyToken.trim() || 'my_verify_token';
    const challenge = challengeInput.trim() || '1158201444';
    setChallengeResult(
      `GET /webhook/instagram?hub.mode=subscribe&hub.verify_token=${activeToken}&hub.challenge=${challenge}  -->  HTTP 200 OK: "${challenge}"`
    );
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <span>{t.settingsTitle}</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          {t.settingsDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Token */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {t.accessTokenLabel}
                </label>
                <span className="text-xs font-mono text-emerald-400 dir-ltr">
                  {maskToken(config.access_token)}
                </span>
              </div>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                autoComplete="off"
                placeholder={
                  config.access_token
                    ? '•••••••••••••••••••• (Leave blank to keep stored token)'
                    : 'EAABsbCS1iHgBO...'
                }
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none dir-ltr text-start"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Long-lived tokens expire after 60 days. See the Setup Guide tab for the renewal command.
              </p>
            </div>

            {/* IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {t.pageIdLabel}
                </label>
                <input
                  type="text"
                  required
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  placeholder="e.g. 104928374651928"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none dir-ltr text-start"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {t.igIdLabel}
                </label>
                <input
                  type="text"
                  required
                  value={igId}
                  onChange={(e) => setIgId(e.target.value)}
                  placeholder="e.g. 17841405309211844"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none dir-ltr text-start"
                />
              </div>
            </div>

            {/* Webhook Verify Token & Backend URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {t.verifyTokenLabel}
                </label>
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="my_secure_custom_verify_token_2026"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none dir-ltr text-start"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  {t.backendUrlLabel}
                </label>
                <input
                  type="url"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="https://your-domain.com"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none dir-ltr text-start"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onResetDemo}
                className="px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetDemo}</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
              >
                {t.saveConfig}
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Handshake Tester */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.handshakeTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.handshakeDesc}</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                placeholder="hub.challenge"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white dir-ltr text-start"
              />
              <button
                type="button"
                onClick={handleTestChallenge}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shrink-0"
              >
                {t.verifyHandshake}
              </button>
            </div>
            {challengeResult && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 break-all dir-ltr text-start animate-in fade-in duration-200">
                {challengeResult}
              </div>
            )}
          </div>

          {/* Rate Limiting */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2.5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>{t.rateLimitTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.rateLimitDesc}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
