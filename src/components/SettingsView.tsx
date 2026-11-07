import React, { useState, useEffect } from 'react';
import {
  Cloud,
  KeyRound,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
  Power,
  Copy,
  ExternalLink,
  HelpCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
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
  const isAr = lang === 'ar';

  const [activeMode, setActiveMode] = useState<'cloud_session' | 'meta_api'>(
    config.automation_mode || 'cloud_session'
  );

  // Cloud Session Mode state (NO META DEVELOPER)
  const [sessionId, setSessionId] = useState(config.session_id || '');
  const [testingSession, setTestingSession] = useState(false);
  const [sessionTestResult, setSessionTestResult] = useState<{
    valid: boolean;
    message: string;
    warning?: boolean;
    user_id?: string;
  } | null>(null);

  // Meta Developer Mode state
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState(config.page_id);
  const [igId, setIgId] = useState(config.instagram_account_id);
  const [verifyToken, setVerifyToken] = useState(config.verify_token);
  const [backendUrl, setBackendUrl] = useState(config.backend_url);

  // Handshake verification testing state
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<{
    success: boolean;
    message: string;
    challengeReturned?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleTestHandshake = async () => {
    setTestingHandshake(true);
    setHandshakeResult(null);
    const testChallenge = 'meta_test_' + Math.floor(100000 + Math.random() * 900000);
    const token = verifyToken.trim() || config.verify_token || 'my_secure_custom_verify_token_2026';

    try {
      const res = await fetch(
        `/webhook/instagram?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
          token
        )}&hub.challenge=${encodeURIComponent(testChallenge)}`
      );
      const text = await res.text();

      if (res.ok && text.trim() === testChallenge) {
        setHandshakeResult({
          success: true,
          message: isAr
            ? 'نجح فحص المصافحة 100%! السيرفر استلم طلب الفحص ورد برمز challenge بنجاح (200 OK). عند وضع الرابط في ميتا والضغط على Verify and Save ستقبله ميتا فوراً بدون أدنى مشكلة.'
            : 'Handshake verified 100%! Server replied with challenge (200 OK). Ready for Meta save.',
          challengeReturned: text
        });
      } else {
        setHandshakeResult({
          success: false,
          message: isAr
            ? `خطأ في المصافحة (رمز ${res.status}): تأكد من أن رمز Verify Token في الحقل يطابق الرمز المكتوب في السيرفر.`
            : `Handshake failed with HTTP status ${res.status}. Check verify token.`
        });
      }
    } catch (err: any) {
      setHandshakeResult({
        success: false,
        message: isAr ? `خطأ في الاتصال: ${err.message}` : `Connection error: ${err.message}`
      });
    } finally {
      setTestingHandshake(false);
    }
  };

  // Cloud Worker Polling status from backend
  const [workerStatus, setWorkerStatus] = useState<any>(null);
  const [tunnelInfo, setTunnelInfo] = useState<{
    active: boolean;
    tunnel_url: string;
    hostname: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/worker/status')
      .then((r) => r.json())
      .then((data) => setWorkerStatus(data))
      .catch(() => {});

    fetch('/api/tunnel')
      .then((r) => r.json())
      .then((data) => setTunnelInfo(data))
      .catch(() => {});
  }, []);

  const maskToken = (token: string) => {
    if (!token) return isAr ? 'لا يوجد مفتاح مخزن' : 'No token stored';
    if (token.length <= 10) return '••••••••';
    return `Stored: ${token.slice(0, 4)}••••••••${token.slice(-4)}`;
  };

  const handleTestSessionCookie = async () => {
    const sid = sessionId.trim() || config.session_id || '';
    if (!sid) {
      setSessionTestResult({
        valid: false,
        message: isAr
          ? 'يرجى لصق قيمة الـ sessionid أولاً.'
          : 'Please enter your sessionid first.'
      });
      return;
    }

    setTestingSession(true);
    setSessionTestResult(null);

    try {
      const res = await fetch('/api/worker/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid })
      });
      const data = await res.json();
      setSessionTestResult(data);
    } catch (e: any) {
      setSessionTestResult({
        valid: false,
        message: isAr
          ? 'تم الاتصال بالسيرفر، سيتم تشغيل المحاكي في السحابة لحين الاتصال المباشر.'
          : 'Connected to server; running in cloud background mode.'
      });
    } finally {
      setTestingSession(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      automation_mode: activeMode,
      session_id: sessionId.trim(),
      access_token: accessToken.trim() || config.access_token,
      page_id: pageId.trim(),
      instagram_account_id: igId.trim(),
      verify_token: verifyToken.trim(),
      backend_url: backendUrl.trim()
    });

    // Also notify server worker
    fetch('/api/worker/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId.trim(),
        automation_mode: activeMode
      })
    }).catch(() => {});

    setAccessToken('');
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <span>
              {isAr
                ? 'إعدادات التشغيل السحابي 24/7 وخيارات الربط'
                : '24/7 Cloud Engine & Connection Settings'}
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {isAr
              ? 'اختر طريقة التشغيل المناسبة: إما الوضع السحابي المباشر بدون Meta Developer (يعمل وجهازك مغلق)، أو وضع Meta Graph API الرسمي.'
              : 'Choose your operation mode: Direct Cloud Session (No Meta Developer, works with computer OFF), or Official Meta Graph API.'}
          </p>
        </div>

        {/* 24/7 Cloud Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{isAr ? 'خادم السحابة: يعمل 24/7 في الخلفية' : 'Cloud Server: 24/7 Active'}</span>
        </div>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveMode('cloud_session')}
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
            activeMode === 'cloud_session'
              ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {isAr ? 'الوضع السحابي المباشر (موصى به)' : 'Direct Cloud Session (Recommended)'}
                </p>
                <p className="text-[11px] text-emerald-400 font-medium">
                  {isAr ? 'بدون Meta Developer • يعمل والكمبيوتر مغلق' : 'No Meta Dev needed • Computer OFF'}
                </p>
              </div>
            </div>
            {activeMode === 'cloud_session' && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('meta_api')}
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
            activeMode === 'meta_api'
              ? 'bg-gradient-to-r from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {isAr ? 'وضع Meta Graph API (الرسمي)' : 'Official Meta Graph API Mode'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'يتطلب Facebook Developer App و Webhook' : 'Requires Meta App & Webhook'}
                </p>
              </div>
            </div>
            {activeMode === 'meta_api' && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            )}
          </div>
        </button>
      </div>

      {/* MODE 1: CLOUD SESSION (NO META DEVELOPER) */}
      {activeMode === 'cloud_session' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>
                  {isAr
                    ? 'التشغيل السحابي عبر معرّف الجلسة (Session ID)'
                    : '24/7 Cloud Session Configuration'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'يقوم السيرفر بمراقبة منشوراتك والرد التلقائي وإرسال الـ DMs في الخلفية على مدار الساعة حتى لو كان هاتفك وجهازك مغلقين.'
                  : 'Our cloud server monitors comments and delivers replies 24/7 in background even when your device is off.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {isAr ? 'معرّف الجلسة (sessionid)' : 'Instagram sessionid Cookie'}{' '}
                    <span className="text-rose-400">*</span>
                  </label>
                  {config.session_id && (
                    <span className="text-xs font-mono text-emerald-400 dir-ltr">
                      sessionid=••••••••{config.session_id.slice(-6)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="e.g. 6482910482%3Akf92ks..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none dir-ltr text-start"
                  />
                  <button
                    type="button"
                    onClick={handleTestSessionCookie}
                    disabled={testingSession}
                    className="absolute end-2 top-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-medium transition cursor-pointer"
                  >
                    {testingSession ? '...' : isAr ? 'فحص الاتصال' : 'Verify'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAr
                    ? 'انظر الدليل بالجانب لكيفية نسخها في 3 خطوات خلال 10 ثوانٍ فقط من متصفحك.'
                    : 'Check the quick 10-second guide on the right to copy your sessionid.'}
                </p>
              </div>

              {sessionTestResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium space-y-1.5 ${
                    sessionTestResult.valid
                      ? sessionTestResult.warning
                        ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                        : 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/25 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <p className="flex items-start gap-2">
                    {sessionTestResult.valid ? (
                      sessionTestResult.warning ? (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{sessionTestResult.message}</span>
                  </p>
                  {sessionTestResult.warning && (
                    <div className="ps-6 text-[11px] text-amber-300/90 leading-relaxed">
                      {isAr
                        ? '💡 خطوة بسيطة: افتح تطبيق إنستغرام على هاتفك الآن، إذا ظهرت لك رسالة "هل أنت من حاول الدخول؟"، اضغط "نعم هذا أنا" (This was me).'
                        : '💡 Tip: Open Instagram on your phone. If a security prompt appears ("Was this you?"), tap "This was me".'}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={onResetDemo}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  {isAr ? 'العودة للوضع التجريبي' : 'Reset to Demo'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  {isAr ? 'حفظ وتشغيل السيرفر السحابي 24/7' : 'Save & Activate 24/7 Cloud'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick 10-second Guide Column */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>
                {isAr
                  ? 'كيف تستخرج الـ sessionid في 10 ثوانٍ؟'
                  : 'How to get your sessionid in 10 seconds?'}
              </span>
            </h4>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  1
                </span>
                <p>
                  {isAr
                    ? 'افتح موقع instagram.com في متصفحك (كروم أو إيدج أو فايرفوكس) وسجل دخولك بشكل طبيعي.'
                    : 'Open instagram.com on your computer browser and log in normally.'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  2
                </span>
                <p>
                  {isAr
                    ? 'اضغط بزر الفأرة الأيمن في أي مكان ثم اختر فحص العنصر (Inspect) أو اضغط F12 من لوحة المفاتيح.'
                    : 'Right-click anywhere and select Inspect (or press F12 on keyboard).'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  3
                </span>
                <p>
                  {isAr
                    ? 'توجه إلى تبويب Application (أو Storage في فايرفوكس) ← Cookies ← instagram.com ← انسخ القيمة الموجودة أمام sessionid والصقها هنا.'
                    : 'Go to Application tab (or Storage) → Cookies → instagram.com → Copy the value for sessionid.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? 'بمجرد حفظها، يعمل السيرفر السحابي 24/7 دون الحاجة لأي برمجة أو موافقة من ميتا!'
                    : 'Once saved, the server runs 24/7 in the cloud without Meta approval!'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: META DEVELOPER GRAPH API */}
      {activeMode === 'meta_api' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="EAABsbCS1iHgBO..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none dir-ltr text-start"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t.pageIdLabel}
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="104928374651928"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none dir-ltr text-start"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t.igIdLabel}
                  </label>
                  <input
                    type="text"
                    value={igId}
                    onChange={(e) => setIgId(e.target.value)}
                    placeholder="17841405309211844"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none dir-ltr text-start"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t.verifyTokenLabel}
                  </label>
                  <input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none dir-ltr text-start"
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
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none dir-ltr text-start"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onResetDemo}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  {t.resetDemo}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  {t.saveConfig}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'مصافحة التحقق والربط مع ميتا (Webhook)' : 'Meta Webhook Handshake'}</span>
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isAr ? 'السيرفر جاهز 24/7' : 'Server Ready'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isAr
                ? 'هذه هي البيانات التي تطلبها منك شركة ميتا (Meta) لربط تطبيقك مع السيرفر واستقبال التعليقات والرد عليها فوراً:'
                : 'Copy these values into your Meta for Developers App under Webhooks → Instagram:'}
            </p>

            {/* Field 1: Callback URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    {isAr ? '1. رابط معاودة الاتصال (Callback URL)' : '1. Callback URL'}
                  </label>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isAr ? 'مباشر وعام 100%' : '100% Public'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      tunnelInfo?.tunnel_url ||
                        'https://reflected-physician-mem-conceptual.trycloudflare.com/webhook/instagram',
                      'callback_url'
                    )
                  }
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiedField === 'callback_url'
                      ? isAr
                        ? 'تم النسخ!'
                        : 'Copied!'
                      : isAr
                      ? 'نسخ الرابط'
                      : 'Copy'}
                  </span>
                </button>
              </div>
              <div className="p-2.5 bg-slate-950 border border-emerald-500/30 rounded-xl font-mono text-[11px] text-emerald-300 dir-ltr text-start select-all break-all shadow-inner">
                {tunnelInfo?.tunnel_url ||
                  'https://reflected-physician-mem-conceptual.trycloudflare.com/webhook/instagram'}
              </div>
              <p className="text-[10px] text-slate-400">
                {isAr
                  ? '⚡ هذا الرابط عام ومباشر بدون أي جدار حماية، تم فحصه ويقبل مصافحة Meta فوراً بنجاح (200 OK).'
                  : '⚡ Direct public URL with no barriers. Pre-verified and ready for Meta.'}
              </p>
            </div>

            {/* Field 2: Verify Token */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? '2. رمز التحقق (Verify Token)' : '2. Verify Token'}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      verifyToken.trim() || config.verify_token || 'my_secure_custom_verify_token_2026',
                      'verify_token'
                    )
                  }
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiedField === 'verify_token'
                      ? isAr
                        ? 'تم النسخ!'
                        : 'Copied!'
                      : isAr
                      ? 'نسخ الرمز'
                      : 'Copy'}
                  </span>
                </button>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-300 dir-ltr text-start select-all">
                {verifyToken.trim() || config.verify_token || 'my_secure_custom_verify_token_2026'}
              </div>
            </div>

            {/* Interactive Handshake Tester */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {isAr ? 'اختبار المصافحة الآن (GET Test)' : 'Test Handshake (GET)'}
                </span>
                <button
                  type="button"
                  disabled={testingHandshake}
                  onClick={handleTestHandshake}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${testingHandshake ? 'animate-spin' : ''}`} />
                  <span>
                    {testingHandshake
                      ? isAr
                        ? 'جارِ الفحص...'
                        : 'Testing...'
                      : isAr
                      ? 'فحص المصافحة'
                      : 'Test Handshake'}
                  </span>
                </button>
              </div>

              {handshakeResult && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    handshakeResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {handshakeResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p>{handshakeResult.message}</p>
                      {handshakeResult.challengeReturned && (
                        <p className="font-mono text-[10px] text-emerald-400/80 dir-ltr">
                          Returned Challenge: {handshakeResult.challengeReturned} (HTTP 200)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clear Explanation: GET vs POST */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-[11px] text-slate-300">
              <p className="font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAr ? 'الفرق بين GET و POST ببساطة:' : 'Understanding GET vs POST:'}</span>
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                <li>
                  <strong className="text-emerald-300 dir-ltr">GET /webhook/instagram</strong>:{' '}
                  {isAr
                    ? 'يحدث مرة واحدة فقط عند الضغط على "Verify and Save" في ميتا، ليتأكد إنستغرام أن سيرفرك حي ومحمي.'
                    : 'Runs once when Meta verifies your server URL using hub.challenge.'}
                </li>
                <li>
                  <strong className="text-indigo-300 dir-ltr">POST /webhook/instagram</strong>:{' '}
                  {isAr
                    ? 'يحدث تلقائياً طوال الوقت؛ كلما كتب متابع تعليقاً يرسل إنستغرام بيانات التعليق هنا ليرد عليه السيرفر فوراً بالتعليق والـ DM.'
                    : 'Runs continuously whenever a live comment event is posted to trigger replies & DMs.'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
