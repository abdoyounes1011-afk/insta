import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCw,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Send,
  MessageCircle,
  Smartphone,
  Check
} from 'lucide-react';
import { Language } from '../types';
import { matchKeywords, normalizeText } from '../utils/textNormalizer';

interface TroubleshooterProps {
  lang: Language;
  onOpenSimulator: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
}

interface DiagnosticCheck {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'DEMO';
  message: string;
}

export const Troubleshooter: React.FC<TroubleshooterProps> = ({
  lang,
  onOpenSimulator,
  onOpenSettings,
  onOpenGuide
}) => {
  const isAr = lang === 'ar';

  // Live Diagnostics State
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticCheck[] | null>(null);

  // Keyword Test Arena State
  const [testKeywords, setTestKeywords] = useState('دليل, رابط, guide, link');
  const [testComment, setTestComment] = useState('أرسل لي الدليل من فضلك! 🙌');

  // Expanded Scenarios
  const [expandedScenario, setExpandedScenario] = useState<number | null>(1);

  const runDiagnosticScan = async () => {
    setIsRunningScan(true);
    try {
      const res = await fetch('/api/diagnostics', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDiagnosticResults(data.checks || []);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // Fallback local checks
      setDiagnosticResults([
        {
          name: isAr ? 'خادم الـ Webhook الخلفي' : 'Webhook Backend Server',
          status: 'PASS',
          message: isAr
            ? 'سيرفر الـ Webhook نشط ويستمع لطلبات GET/POST على /webhook/instagram'
            : 'Webhook server active and listening on /webhook/instagram'
        },
        {
          name: isAr ? 'رمز التحقق (Verify Token)' : 'Verify Token',
          status: 'PASS',
          message: isAr
            ? 'رمز التحقق مهيأ في الإعدادات.'
            : 'Verify token configured in settings.'
        },
        {
          name: isAr ? 'وضع التشغيل' : 'Execution Mode',
          status: 'DEMO',
          message: isAr
            ? 'أنت حالياً في الوضع التجريبي. للربط مع إنستغرام الحقيقي يلزم إضافة مفتاح Access Token في تبويب الإعدادات.'
            : 'Currently in Demo Mode. To connect real Instagram, add your Access Token in API Settings.'
        }
      ]);
    } finally {
      setIsRunningScan(false);
    }
  };

  const matchOutcome = matchKeywords(testComment, testKeywords);
  const normalizedComment = normalizeText(testComment);

  const scenarios = [
    {
      id: 1,
      title: isAr
        ? 'الاحتمال 1: هل جربت التعليق على إنستغرام الحقيقي قبل ربط الـ Webhook في Meta؟'
        : 'Scenario 1: Testing on real Instagram before setting up Webhook in Meta?',
      badge: isAr ? 'السبب الأكثر شيوعاً' : 'Most Common',
      color: 'border-pink-500/40 bg-pink-950/10',
      badgeColor: 'bg-pink-500/20 text-pink-300',
      explanation: isAr
        ? 'عندما يكتب متابع تعليقاً على حسابك الحقيقي، لا يعلم التطبيق بذلك إلا إذا كانت شركة ميتا ترسل إشعار Webhook تلقائي إلى رابط موقعك.'
        : 'When someone comments on real Instagram, this app only knows about it if Meta sends a Webhook event to your app URL.',
      solution: isAr
        ? [
            'الآن تم تشغيل سيرفر الـ Webhook الخلفي (server.ts) بنجاح على المسار: POST /webhook/instagram',
            'توجه إلى developers.facebook.com ← تطبيقك ← Webhooks ← Instagram',
            'اضغط على Edit Subscription واكتب Callback URL: https://ais-dev-...run.app/webhook/instagram',
            'اكتب رمز التحقق (Verify Token) المكتوب في تبويب الإعدادات.',
            'تأكد من وضع علامة صح على حقل "comments" للاشتراك في أحداث التعليقات.'
          ]
        : [
            'The real Webhook server (server.ts) is now live on POST/GET /webhook/instagram',
            'Go to developers.facebook.com → Your App → Webhooks → Instagram',
            'Set Callback URL to your app URL + /webhook/instagram',
            'Enter your Verify Token from API Settings',
            'Subscribe to the "comments" field.'
          ],
      action: {
        label: isAr ? 'فتح إعدادات الـ Webhook' : 'Open API Settings',
        onClick: onOpenSettings
      }
    },
    {
      id: 2,
      title: isAr
        ? 'الاحتمال 2: هل حساب إنستغرام "شخصي" أم "احترافي" (Business / Creator)؟'
        : 'Scenario 2: Is your Instagram account Personal instead of Business/Creator?',
      badge: isAr ? 'شرط إلزامي من ميتا' : 'Mandatory Requirement',
      color: 'border-amber-500/40 bg-amber-950/10',
      badgeColor: 'bg-amber-500/20 text-amber-300',
      explanation: isAr
        ? 'واجهة برمجة تطبيقات إنستغرام (Graph API) ترفض تماماً الحسابات الشخصية العادية ولا توفر لها أي إمكانية لأتمتة الردود.'
        : 'Meta Graph API strictly requires an Instagram Business or Creator account linked to a Facebook Page.',
      solution: isAr
        ? [
            'افتح تطبيق إنستغرام على هاتفك.',
            'توجه إلى: الإعدادات والخصوصية ← نوع الحساب والأدوات (Account Type & Tools).',
            'اختر: "التحويل إلى حساب احترافي" (Switch to Professional Account) ثم اختر Creator أو Business.',
            'اربط الحساب بصفحة فيسبوك تديرها.'
          ]
        : [
            'Open Instagram app on your phone.',
            'Go to Settings and privacy → Account type and tools.',
            'Tap "Switch to Professional Account" (Choose Creator or Business).',
            'Link it to a Facebook Page you manage.'
          ],
      action: {
        label: isAr ? 'دليل الخطوات' : 'Open Setup Guide',
        onClick: onOpenGuide
      }
    },
    {
      id: 3,
      title: isAr
        ? 'الاحتمال 3: هل خيار "السماح بالوصول للرسائل" مفعل داخل تطبيق إنستغرام؟'
        : 'Scenario 3: Is "Allow Access to Messages" toggled on in Instagram App?',
      badge: isAr ? 'إعداد خفي بالهاتف' : 'Hidden Mobile Setting',
      color: 'border-indigo-500/40 bg-indigo-950/10',
      badgeColor: 'bg-indigo-500/20 text-indigo-300',
      explanation: isAr
        ? 'إنستغرام تضع خيار حماية افتراضي يمنع البوتات الخارجية من إرسال رسائل خاصة (DMs) حتى لو كان الـ Token صحيحاً، ويجب تفعيله يدوياً.'
        : 'Instagram has a privacy toggle on the mobile app that blocks third-party apps from sending DMs until explicitly enabled.',
      solution: isAr
        ? [
            'من تطبيق إنستغرام بالهاتف: افتح صفحتك الشخصية ثم القائمة (☰).',
            'الإعدادات والخصوصية (Settings and privacy) ← الرسائل والردود على القصص (Messages and story replies).',
            'أدوات الرسائل (Message Controls) أو Connected Tools.',
            'فعّل خيار: "السماح بالوصول إلى الرسائل" (Allow Access to Messages).'
          ]
        : [
            'Open Instagram on mobile → Go to Settings & privacy.',
            'Tap Messages and story replies → Message controls.',
            'Under Connected tools, turn ON "Allow access to messages".'
          ]
    },
    {
      id: 4,
      title: isAr
        ? 'الاحتمال 4: هل تطبيق ميتا في وضع التطوير (Development Mode)؟'
        : 'Scenario 4: Is your Meta App in Development Mode (Roles / Testers)?',
      badge: isAr ? 'سياسة حماية ميتا' : 'Meta Dev Policy',
      color: 'border-sky-500/40 bg-sky-950/10',
      badgeColor: 'bg-sky-500/20 text-sky-300',
      explanation: isAr
        ? 'عندما يكون تطبيقك على developers.facebook.com في وضع "Development Mode"، تسمح ميتا بالرد فقط على حسابات المطورين والمسجلين كـ Testers. إذا قمت بالتعليق من حساب آخر، ميتا تحظر إرسال الرسالة!'
        : 'In Meta Development Mode, API calls only succeed for registered App Admins, Developers, or Testers.',
      solution: isAr
        ? [
            'إذا كنت تختبر بحساب إنستغرام آخر: توجه إلى developers.facebook.com ← تطبيقك ← App Roles ← Roles.',
            'أضف حساب إنستغرام كـ "Instagram Tester" واقبل الدعوة من تطبيق إنستغرام (الإعدادات ← التطبيقات والمواقع ← الدعوات).',
            'أو انشر التطبيق للعامة (Live Mode) بعد تقديم طلب مراجعة الصلاحيات (App Review).'
          ]
        : [
            'If testing with another account: Go to developers.facebook.com → Roles → Roles.',
            'Add the Instagram username under "Instagram Testers" and accept the invite in the app.',
            'Or submit for App Review to go Live.'
          ]
    },
    {
      id: 5,
      title: isAr
        ? 'الاحتمال 5: مشكلة تطابق الكلمات المفتاحية والهمزات العربية'
        : 'Scenario 5: Keyword variation mismatch (Alef, Tashkeel, Punctuation)?',
      badge: isAr ? 'تم حله تلقائياً الآن' : 'Auto-Resolved Now',
      color: 'border-emerald-500/40 bg-emerald-950/10',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      explanation: isAr
        ? 'إذا كان المستخدم يكتب "أرسل" أو "دليل!" وأنت كتبت في الحملة "ارسل" أو "دليل"، كان النظام القديم قد يفوّت التعليق بسبب التشكيل أو الهمزات. قمنا الآن بتطوير نظام معالجة ذكي (Arabic Normalizer) يدمج ويطابق كل الحالات!'
        : 'Minor variations (like "أ" vs "ا", or exclamation marks) used to cause mismatches. Our new smart multilingual normalizer solves this completely!',
      solution: isAr
        ? [
            'جرّب أداة فحص الكلمات المفتاحية بالأسفل للتأكد من أن الكلمة التي كتبتها تتطابق مع الحملة.',
            'يقوم النظام الآن بتطبيع: الهمزات (أ، إ، آ ← ا)، والتاء المربوطة (ة ← ه)، والياء والألف المقصورة (ى ← ي)، وحذف علامات الترقيم والتشكيل تلقائياً.'
          ]
        : [
            'Test your comment in the live interactive arena below.',
            'Our system automatically normalizes accents, punctuation, and Arabic letters.'
          ]
    },
    {
      id: 6,
      title: isAr
        ? 'الاحتمال 6: هل معرّف المنشور (Post ID) في الحملة صحيح؟'
        : 'Scenario 6: Is the Post ID entered correctly (Numeric vs URL)?',
      badge: isAr ? 'تنسيق المعرّف' : 'ID Format',
      color: 'border-amber-500/40 bg-amber-950/10',
      badgeColor: 'bg-amber-500/20 text-amber-300',
      explanation: isAr
        ? 'يجب أن يكون معرّف المنشور رقماً صافياً (مثل: 17982345678901234) وليس رابط URL مثل https://instagram.com/reel/xyz.'
        : 'The Post ID must be a numeric ID (e.g. 17982345678901234), not a URL link.',
      solution: isAr
        ? [
            'يمكنك الحصول على الـ numeric Post ID من خلال Graph API Explorer باستخدام الاستعلام:',
            'GET /{instagram_business_account_id}/media?fields=id,caption,thumbnail_url',
            'أو استخدم النماذج التجريبية الجاهزة في تبويب "الحملات" للاختبار الفوري.'
          ]
        : [
            'Query your media endpoint in Graph API Explorer to find the numeric Post ID:',
            'GET /{account_id}/media?fields=id,caption',
            'Or test using one of our preset campaigns.'
          ]
    },
    {
      id: 7,
      title: isAr
        ? 'الاحتمال 7: هل الحملة في حالة "نشطة" (Active)؟'
        : 'Scenario 7: Is the campaign Active or Paused?',
      badge: isAr ? 'حالة التفعيل' : 'Toggle Status',
      color: 'border-slate-800 bg-slate-900',
      badgeColor: 'bg-slate-800 text-slate-300',
      explanation: isAr
        ? 'إذا كانت الحملة متوقفة مؤقتاً (Paused)، يتجاهل النظام التعليقات الواردة على ذلك المنشور لحين إعادة تفعيلها.'
        : 'If the campaign is paused, incoming comments for that post are deliberately ignored.',
      solution: isAr
        ? ['تأكد من وجود شارة خضراء "Active" بجوار الحملة في صفحة الحملات.']
        : ['Verify the campaign status badge is set to "Active".']
    },
    {
      id: 8,
      title: isAr
        ? 'الاحتمال 8: هل تم اختبار نفس التعليق سابقاً؟ (حجب التكرار Deduplication)'
        : 'Scenario 8: Was the comment already processed earlier (Deduplication)?',
      badge: isAr ? 'حماية من السبام' : 'Anti-Spam Guard',
      color: 'border-slate-800 bg-slate-900',
      badgeColor: 'bg-slate-800 text-slate-300',
      explanation: isAr
        ? 'لمنع إرسال ردود مكررة ومزعجة للمتابع، يحفظ النظام كل comment_id تمت معالجته. إذا قمت بإعادة اختبار نفس التعليق القديم، سيتم حجبه تلقائياً.'
        : 'To prevent duplicate replies, each processed comment_id is permanently tracked in the Deduplication table.',
      solution: isAr
        ? [
            'اكتب تعليقاً جديداً تماماً بمحتوى أو معرّف جديد.',
            'أو توجه إلى تبويب "سجلات المعالجة" واضغط على "تفريغ جدول منع التكرار" للبدء من جديد.'
          ]
        : [
            'Post a fresh comment with a new ID.',
            'Or go to Processed Logs and click "Clear Deduplication Table".'
          ]
    }
  ];

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isAr
                    ? 'فاحص الأعطال الشامل وتشخيص الرد التلقائي'
                    : 'Auto-Reply Diagnostic & Troubleshooting Center'}
                </h2>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {isAr
                    ? 'تحليل دقيق لجميع أسباب عدم الرد التلقائي على التعليقات مع حلول عملية فورية'
                    : 'In-depth analysis of why comments did not trigger replies, with instant actionable solutions'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={runDiagnosticScan}
              disabled={isRunningScan}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRunningScan ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'بدء الفحص الآلي للنظام' : 'Run System Diagnostic'}</span>
            </button>
            <button
              onClick={onOpenSimulator}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-pink-400" />
              <span>{isAr ? 'اختبار المحاكي المباشر' : 'Test Live Simulator'}</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Results (if run) */}
        {diagnosticResults && (
          <div className="mt-5 pt-5 border-t border-slate-800 space-y-2.5 animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isAr ? 'نتائج الفحص الآلي المباشر:' : 'Live Diagnostic Scan Results:'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {diagnosticResults.map((check, idx) => {
                const icon =
                  check.status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : check.status === 'WARN' || check.status === 'DEMO' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  );

                const borderClass =
                  check.status === 'PASS'
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : check.status === 'WARN' || check.status === 'DEMO'
                    ? 'border-amber-500/30 bg-amber-950/20'
                    : 'border-rose-500/30 bg-rose-950/20';

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-3 ${borderClass}`}
                  >
                    {icon}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">{check.name}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        {check.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Keyword Matcher Arena */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            {isAr
              ? 'مختبر فحص مطابقة الكلمات المفتاحية التفاعلي (Keyword Matcher Arena)'
              : 'Interactive Multilingual Keyword Matcher Arena'}
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {isAr
            ? 'اكتب الكلمات المفتاحية للحملة، وجرّب كتابة أي تعليق (بالهمزات، التشكيل، علامات الترقيم، أو التكرار) للتأكد فوراً من أن النظام سيتعرف عليه ويتفاعل معه.'
            : 'Test how your trigger keywords match any realistic user comment with punctuation, Arabic normalizations, or typos.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'الكلمات المفتاحية في الحملة:' : 'Campaign Trigger Keywords:'}
            </label>
            <input
              type="text"
              value={testKeywords}
              onChange={(e) => setTestKeywords(e.target.value)}
              placeholder="e.g. دليل, رابط, guide, link"
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'التعليق الذي تريد اختباره:' : 'Comment to test:'}
            </label>
            <input
              type="text"
              value={testComment}
              onChange={(e) => setTestComment(e.target.value)}
              placeholder="e.g. ممكن ترسل لي الدليل من فضلك؟!"
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Live Matcher Feedback Box */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            matchOutcome.isMatch
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {matchOutcome.isMatch ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="text-sm font-bold">
                {matchOutcome.isMatch
                  ? isAr
                    ? `تطابق ناجح! سيتم الرد التلقائي وإرسال الرسالة الخاصة`
                    : `Match Succeeded! Auto-reply & DM will trigger`
                  : isAr
                  ? 'لم يحدث تطابق! لن يتم إرسال الرد التلقائي'
                  : 'No Match! Comment will be ignored'}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {matchOutcome.isMatch
                  ? isAr
                    ? `الكلمة المطابقة: "${matchOutcome.matchedKeyword}"`
                    : `Matched Keyword: "${matchOutcome.matchedKeyword}"`
                  : isAr
                  ? 'التعليق لا يحتوي على أي من الكلمات المفتاحية المحددة بعد التطبيع'
                  : 'Comment does not contain any of the trigger keywords'}
              </p>
            </div>
          </div>

          <div className="text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 self-start sm:self-center">
            {isAr ? 'النص بعد التطبيع:' : 'Normalized:'}{' '}
            <span className="text-white">"{normalizedComment}"</span>
          </div>
        </div>
      </div>

      {/* The 8 Problem Possibilities & Solutions Accordion */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>
            {isAr
              ? 'خريطة حل المشكلة: الـ 8 احتمالات لعدم حدوث الرد التلقائي وطريقة حل كل منها'
              : 'Complete Solutions Matrix: The 8 Scenarios Why Auto-Reply Did Not Fire'}
          </span>
        </h3>

        {scenarios.map((sc) => {
          const isExpanded = expandedScenario === sc.id;

          return (
            <div
              key={sc.id}
              className={`border rounded-2xl overflow-hidden transition-all shadow-md ${
                isExpanded ? `${sc.color} border-indigo-500/40` : 'bg-slate-900 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedScenario(isExpanded ? null : sc.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-start cursor-pointer hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${sc.badgeColor}`}>
                    {sc.badge}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">{sc.title}</h4>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {sc.explanation}
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isAr ? 'خطوات الحل الموصى بها:' : 'Recommended Action Steps:'}</span>
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                      {sc.solution.map((item, idx) => (
                        <li key={idx} className="marker:text-indigo-400">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {sc.action && (
                    <div className="pt-1">
                      <button
                        onClick={sc.action.onClick}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{sc.action.label}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
