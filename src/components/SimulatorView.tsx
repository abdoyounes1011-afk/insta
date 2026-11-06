import React, { useState } from 'react';
import {
  Smartphone,
  Cpu,
  RotateCw,
  Copy,
  Wifi,
  BatteryFull,
  MessageCircle,
  Send,
  CheckCircle,
  Instagram,
  Check,
  AlertCircle
} from 'lucide-react';
import { Campaign, Language, PipelineStepState, ProcessedComment, SimDM, SimThreadComment } from '../types';
import { translations } from '../data/translations';

interface SimulatorViewProps {
  campaigns: Campaign[];
  selectedPostId: string;
  onSelectPostId: (postId: string) => void;
  threads: Record<string, SimThreadComment[]>;
  dms: SimDM[];
  processedComments: ProcessedComment[];
  pipelineSteps: PipelineStepState[];
  lastWebhookPayload: string;
  lastHmacSignature: string;
  canReplay: boolean;
  onPostComment: (postId: string, text: string, username: string, commenterId: string) => Promise<void>;
  onReplayComment: () => Promise<void>;
  onCopyText: (text: string, label: string) => void;
  lang: Language;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  campaigns,
  selectedPostId,
  onSelectPostId,
  threads,
  dms,
  processedComments,
  pipelineSteps,
  lastWebhookPayload,
  lastHmacSignature,
  canReplay,
  onPostComment,
  onReplayComment,
  onCopyText,
  lang
}) => {
  const t = translations[lang];

  const [phoneTab, setPhoneTab] = useState<'feed' | 'dm'>('feed');
  const [commentInput, setCommentInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('sarah_creates|178900112233');
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCampaign = campaigns.find((c) => c.post_id === selectedPostId) || campaigns[0];
  const currentThread = (currentCampaign && threads[currentCampaign.post_id]) || [];

  const handleQuickKeywordTap = (kw: string) => {
    if (lang === 'ar') {
      setCommentInput(`منشور رائع جداً! هل يمكنك إرسال الـ ${kw.toUpperCase()} من فضلك؟ 🙌`);
    } else {
      setCommentInput(`Love this post! Can you send me the ${kw.toUpperCase()} please? 🙌`);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentCampaign || isSubmitting) return;

    const [username, commenterId] = selectedPersona.split('|');
    const textToSubmit = commentInput.trim();
    setCommentInput('');
    setIsSubmitting(true);

    try {
      await onPostComment(currentCampaign.post_id, textToSubmit, username, commenterId);
      // Increment unread count if user is on feed tab
      if (phoneTab === 'feed') {
        setUnreadDmCount((prev) => prev + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchPhoneTab = (tab: 'feed' | 'dm') => {
    setPhoneTab(tab);
    if (tab === 'dm') {
      setUnreadDmCount(0);
    }
  };

  const keywordsList = currentCampaign
    ? currentCampaign.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
            <h2 className="text-xl font-bold text-white">{t.simulatorTitle}</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {t.simulatorDesc}
          </p>
        </div>

        {/* Post Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t.trackedPost}
          </label>
          <select
            value={selectedPostId}
            onChange={(e) => onSelectPostId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.post_id}>
                Post #{c.post_id} ({c.is_active ? t.active : t.paused}) — [{c.keywords}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Interactive Instagram Mobile Phone Mockup (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl max-w-md mx-auto w-full">
          <div className="bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden flex flex-col h-[640px]">
            {/* Phone Status Bar */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 select-none dir-ltr">
              <span className="font-semibold text-white">9:41</span>
              <div className="flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span className="font-bold text-white tracking-tight">Instagram</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Wifi className="w-3 h-3" />
                <BatteryFull className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Sub-Navigation: Feed Comments vs DM Inbox */}
            <div className="grid grid-cols-2 bg-slate-900/90 p-1 border-b border-slate-800">
              <button
                type="button"
                onClick={() => handleSwitchPhoneTab('feed')}
                className={`py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  phoneTab === 'feed'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.postComments}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPhoneTab('dm')}
                className={`py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                  phoneTab === 'dm'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-pink-400" />
                <span>{t.dmInbox}</span>
                {unreadDmCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {unreadDmCount}
                  </span>
                )}
              </button>
            </div>

            {/* VIEW A: INSTAGRAM POST & COMMENTS */}
            {phoneTab === 'feed' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Post Header & Thumbnail */}
                {currentCampaign && (
                  <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
                    <img
                      src={currentCampaign.post_thumbnail_url}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/100x100/312e81/ffffff?text=Post';
                      }}
                      alt="Post"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white dir-ltr">@instaflow.official</span>
                        <CheckCircle className="w-3 h-3 text-sky-400 fill-sky-400/20" />
                        <span
                          className={`ms-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            currentCampaign.is_active
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {currentCampaign.is_active ? t.active : t.paused}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5">
                        {currentCampaign.post_caption}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5 dir-ltr text-start">
                        Media ID: {currentCampaign.post_id}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Keyword Tap Bar */}
                <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold shrink-0">
                    {t.quickTap}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {keywordsList.map((kw, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickKeywordTap(kw)}
                        className="px-2 py-0.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 text-[11px] font-semibold transition shrink-0 cursor-pointer border border-indigo-500/30"
                      >
                        "{kw.toUpperCase()}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Comments Thread */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {currentThread.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-500">
                      No comments yet. Post a comment below!
                    </div>
                  ) : (
                    currentThread.map((item, idx) => (
                      <div key={idx} className="space-y-2 animate-in fade-in duration-200">
                        {/* User Comment */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0">
                            {item.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl rounded-ss-none px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white dir-ltr">
                                @{item.username}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 dir-ltr">
                                ID: {item.comment_id.slice(-6)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 mt-0.5">{item.text}</p>
                          </div>
                        </div>

                        {/* Automated Public Reply */}
                        {item.reply && (
                          <div className="flex items-start gap-2 ps-7 animate-in fade-in duration-300">
                            <div className="w-6 h-6 rounded-full ig-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              IF
                            </div>
                            <div className="flex-1 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl rounded-ss-none px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-white dir-ltr">
                                  @instaflow.official
                                </span>
                                <CheckCircle className="w-2.5 h-2.5 text-sky-400" />
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold ms-auto">
                                  Auto-Reply
                                </span>
                              </div>
                              <p className="text-xs text-indigo-100 mt-0.5">{item.reply}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Persona & Input Box */}
                <form
                  onSubmit={handleCommentSubmit}
                  className="p-3 bg-slate-900 border-t border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{t.commentingAs}</span>
                    <select
                      value={selectedPersona}
                      onChange={(e) => setSelectedPersona(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-slate-200 cursor-pointer"
                    >
                      <option value="sarah_creates|178900112233">
                        @sarah_creates (ID: 178900112233)
                      </option>
                      <option value="omar.builds|178900445566">
                        @omar.builds (ID: 178900445566)
                      </option>
                      <option value="lina_marketing|178900778899">
                        @lina_marketing (ID: 178900778899)
                      </option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      className="flex-1 bg-slate-950 border border-slate-700 focus:border-pink-500 rounded-full px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3.5 py-2 rounded-full ig-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                    >
                      {t.postBtn}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW B: INSTAGRAM DIRECT MESSAGES (DM) INBOX */}
            {phoneTab === 'dm' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full ig-gradient flex items-center justify-center text-white text-xs font-bold">
                      IF
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white dir-ltr">@instaflow.official</p>
                      <p className="text-[10px] text-emerald-400">{t.privateDmHeader}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 dir-ltr">
                    instagram_manage_messages
                  </span>
                </div>

                {/* DM Messages List */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                  {dms.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-500">
                      No automated DMs sent yet. Trigger a keyword in the Post Comments tab!
                    </div>
                  ) : (
                    dms.map((dm) => (
                      <div
                        key={dm.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1.5 animate-in fade-in duration-300"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-pink-400 dir-ltr">
                            To: @{dm.recipient_username}
                          </span>
                          <span className="font-mono dir-ltr">
                            comment_id: {dm.comment_id.slice(-6)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600/30 to-pink-600/20 border border-pink-500/30 text-xs text-white leading-relaxed">
                          {dm.text}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Delivered via Graph API Private Reply</span>
                          <span>{dm.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
                  <p className="text-[11px] text-slate-400">
                    Private DMs sent automatically via{' '}
                    <code className="text-pink-300 dir-ltr">recipient: &#123;"comment_id": "..."&#125;</code>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Webhook Execution Pipeline & Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Pipeline Execution Steps Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>{t.pipelineTitle}</span>
                </h3>
                <p className="text-xs text-slate-400">{t.pipelineSubtitle}</p>
              </div>

              {/* Deduplication Test Replay Button */}
              <button
                type="button"
                onClick={onReplayComment}
                disabled={!canReplay}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 disabled:pointer-events-none text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t.replayBtn}</span>
              </button>
            </div>

            {/* 5 Pipeline Stages */}
            <div className="space-y-2.5">
              {pipelineSteps.map((step) => {
                const styles = {
                  success: {
                    border: 'border-emerald-500/40 bg-emerald-950/15',
                    icon: 'bg-emerald-500/20 text-emerald-300',
                    badge: 'bg-emerald-500/20 text-emerald-300'
                  },
                  warning: {
                    border: 'border-amber-500/40 bg-amber-950/15',
                    icon: 'bg-amber-500/20 text-amber-300',
                    badge: 'bg-amber-500/20 text-amber-300'
                  },
                  danger: {
                    border: 'border-rose-500/40 bg-rose-950/15',
                    icon: 'bg-rose-500/20 text-rose-300',
                    badge: 'bg-rose-500/20 text-rose-300'
                  },
                  pending: {
                    border: 'border-indigo-500/40 bg-indigo-950/20',
                    icon: 'bg-indigo-500/20 text-indigo-300 animate-pulse',
                    badge: 'bg-indigo-500/20 text-indigo-300'
                  },
                  idle: {
                    border: 'border-slate-800 bg-slate-950',
                    icon: 'bg-slate-800 text-slate-400',
                    badge: 'bg-slate-800 text-slate-400'
                  }
                }[step.status];

                return (
                  <div
                    key={step.step}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${styles.border}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 ${styles.icon}`}
                      >
                        {step.step}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{step.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{step.description}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ms-2 ${styles.badge}`}
                    >
                      {step.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw Webhook Payload Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.rawPayload}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 dir-ltr">
                  {lastHmacSignature}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onCopyText(lastWebhookPayload, 'Webhook JSON payload copied!')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copyJson}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-60 leading-relaxed dir-ltr text-start">
              {lastWebhookPayload}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
