import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Play,
  X,
  Lightbulb,
  Reply,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  PauseCircle,
  Smartphone,
  Wrench
} from 'lucide-react';
import { Campaign, Language, PresetPost } from '../types';
import { PRESET_IG_POSTS } from '../data/initialData';
import { translations } from '../data/translations';

interface CampaignsViewProps {
  campaigns: Campaign[];
  onSaveCampaign: (campaign: Partial<Campaign>) => void;
  onToggleStatus: (id: number) => void;
  onDeleteCampaign: (id: number) => void;
  onOpenSimulator: (postId: string) => void;
  onOpenTroubleshooter: () => void;
  lang: Language;
  accessToken: string;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  onSaveCampaign,
  onToggleStatus,
  onDeleteCampaign,
  onOpenSimulator,
  onOpenTroubleshooter,
  lang,
  accessToken
}) => {
  const t = translations[lang];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [postId, setPostId] = useState('');
  const [keywords, setKeywords] = useState('');
  const [commentReply, setCommentReply] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Live preview state
  const [previewThumbnail, setPreviewThumbnail] = useState('');
  const [previewCaption, setPreviewCaption] = useState('');
  const [previewBadge, setPreviewBadge] = useState('');
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  const handleOpenNew = () => {
    setEditingId(null);
    setPostId('');
    setKeywords('');
    setCommentReply(t.publicReplyPlaceholder);
    setDmMessage(t.privateDmPlaceholder);
    setIsActive(true);
    setPreviewThumbnail('');
    setPreviewCaption('');
    setPreviewBadge('');
    setIsFormOpen(true);
  };

  const handleEdit = (camp: Campaign) => {
    setEditingId(camp.id);
    setPostId(camp.post_id);
    setKeywords(camp.keywords);
    setCommentReply(camp.comment_reply_text);
    setDmMessage(camp.dm_message_text);
    setIsActive(camp.is_active);
    setPreviewThumbnail(camp.post_thumbnail_url);
    setPreviewCaption(camp.post_caption);
    setPreviewBadge('Graph API Media Preview');
    setIsFormOpen(true);
  };

  const fetchPostPreview = async (idToFetch: string) => {
    let cleanId = idToFetch.trim();
    if (!cleanId) return;

    // Direct Instagram URL Parser (supports https://www.instagram.com/p/CODE/ or /reel/CODE/)
    const urlMatch = cleanId.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
    const shortcode = urlMatch ? urlMatch[1] : '';

    const shortcodeMap: Record<string, string> = {
      C8aiBlueprint: '17982345678901234',
      C9saasTemplate: '18045678901234567',
      C9vipDrop: '18199887766554433'
    };

    if (shortcode && shortcodeMap[shortcode]) {
      cleanId = shortcodeMap[shortcode];
    } else if (shortcode) {
      cleanId = shortcode;
    }

    setIsFetchingPreview(true);
    setPreviewBadge(shortcode ? `Link: ${shortcode}` : 'Fetching...');

    // 1. If an access token exists, try official Meta Graph API
    if (accessToken) {
      try {
        const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
          cleanId
        )}?fields=id,caption,media_type,media_url,thumbnail_url&access_token=${encodeURIComponent(
          accessToken
        )}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.id) {
          const thumb = data.thumbnail_url || data.media_url || '';
          setPreviewThumbnail(thumb);
          setPreviewCaption(data.caption || '(No caption on this Instagram post)');
          setPreviewBadge(`Graph API Live (${data.media_type || 'MEDIA'})`);
          setIsFetchingPreview(false);
          return;
        }
      } catch (e) {
        // Fallback to preset below
      }
    }

    // 2. Preset or fallback generated preview
    await new Promise((r) => setTimeout(r, 200));
    const preset = PRESET_IG_POSTS[cleanId] || {
      id: cleanId,
      media_type: 'REELS',
      thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      caption: `Instagram Post #${cleanId} — Comment our keyword below and receive an instant automated DM with the link!`
    };

    const captionText = lang === 'ar' && preset.caption_ar ? preset.caption_ar : preset.caption;
    setPreviewThumbnail(preset.thumbnail_url);
    setPreviewCaption(captionText);
    setPreviewBadge(`Loaded (${preset.media_type})`);
    setIsFetchingPreview(false);
  };

  const fillPreset = (presetId: string) => {
    setPostId(presetId);
    fetchPostPreview(presetId);
    const preset = PRESET_IG_POSTS[presetId];
    if (preset && !keywords) {
      if (presetId === '17982345678901234') {
        setKeywords(lang === 'ar' ? 'دليل, رابط, guide, link, ai' : 'guide, link, blueprint, ai');
      } else if (presetId === '18045678901234567') {
        setKeywords(lang === 'ar' ? 'كود, ساس, saas, code, repo' : 'saas, code, repo, template');
      } else {
        setKeywords(lang === 'ar' ? 'خصم, vip, سعر, price' : 'vip, price, discount, code');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId.trim() || !keywords.trim()) return;

    const preset = PRESET_IG_POSTS[postId.trim()];
    const finalThumbnail =
      previewThumbnail ||
      preset?.thumbnail_url ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';

    const finalCaption =
      previewCaption ||
      (lang === 'ar' && preset?.caption_ar ? preset.caption_ar : preset?.caption) ||
      `Instagram Post #${postId.trim()}`;

    onSaveCampaign({
      id: editingId || undefined,
      post_id: postId.trim(),
      keywords: keywords.trim(),
      comment_reply_text: commentReply.trim(),
      dm_message_text: dmMessage.trim(),
      is_active: isActive,
      post_thumbnail_url: finalThumbnail,
      post_caption: finalCaption
    });

    setIsFormOpen(false);
  };

  const parsedKeywords = keywords
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white">{t.campaignsTitle}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
              {t.manychatStyle}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {t.campaignsDesc}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onOpenSimulator(campaigns[0]?.post_id || '17982345678901234')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Play className="w-4 h-4 text-pink-400 fill-pink-400/20" />
            <span>{t.openSimulator}</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newCampaign}</span>
          </button>
        </div>
      </div>

      {/* Troubleshooter Quick Callout Banner */}
      <div className="bg-gradient-to-r from-rose-950/40 via-indigo-950/30 to-slate-900 border border-rose-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              {lang === 'ar'
                ? 'جربت تكتب كومنت بالكلمة المفتاحية ومحصلش رد تلقائي؟'
                : 'Commented with a trigger keyword but no auto-reply fired?'}
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {lang === 'ar'
                ? 'فحص شامل لجميع الاحتمالات الـ 8 (الـ Webhook، إعداد الرسائل في التطبيق، وضع التطوير في ميتا، والهمزات العربية)'
                : 'Comprehensive analysis of all 8 possibilities (Webhook connection, Instagram app privacy, Meta dev mode, keyword normalization)'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTroubleshooter}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>{lang === 'ar' ? 'تشخيص وحل المشكلة فوراً' : 'Diagnose & Fix Now'}</span>
        </button>
      </div>

      {/* Create / Edit Campaign Collapsible Form */}
      {isFormOpen && (
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingId ? t.editCampaignTitle : t.createCampaignTitle}
                </h3>
                <p className="text-xs text-slate-400">{t.formSubtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Quick Presets Bar */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t.quickFillTitle}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fillPreset('17982345678901234')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-slate-200 transition font-mono cursor-pointer"
                >
                  {t.reel1}
                </button>
                <button
                  type="button"
                  onClick={() => fillPreset('18045678901234567')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-slate-200 transition font-mono cursor-pointer"
                >
                  {t.post2}
                </button>
                <button
                  type="button"
                  onClick={() => fillPreset('18199887766554433')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-slate-200 transition font-mono cursor-pointer"
                >
                  {t.video3}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Post ID Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  {t.postIdLabel} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={postId}
                    onChange={(e) => setPostId(e.target.value)}
                    onBlur={() => fetchPostPreview(postId)}
                    placeholder={t.postIdPlaceholder}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none dir-ltr text-start"
                  />
                  <button
                    type="button"
                    onClick={() => fetchPostPreview(postId)}
                    disabled={isFetchingPreview}
                    className="absolute end-2 top-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-medium transition cursor-pointer"
                  >
                    {isFetchingPreview ? '...' : t.fetchPreview}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">{t.postIdHelp}</p>
              </div>

              {/* Keywords Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  {t.keywordsLabel} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder={t.keywordsPlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[24px]">
                  {parsedKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Post Preview Box (if populated) */}
            {previewThumbnail && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-4 animate-in fade-in duration-200">
                <img
                  src={previewThumbnail}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/120x120/1e293b/a5b4fc?text=IG+Post';
                  }}
                  alt="Instagram Post Preview"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {previewBadge || 'Post Preview'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {postId}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{previewCaption}</p>
                </div>
              </div>
            )}

            {/* Comment Reply & DM Message Textareas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {t.publicReplyLabel} <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono dir-ltr">
                    POST /&#123;comment_id&#125;/replies
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={commentReply}
                  onChange={(e) => setCommentReply(e.target.value)}
                  placeholder={t.publicReplyPlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl p-3.5 text-sm text-white focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">{t.publicReplyHelp}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {t.privateDmLabel} <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-pink-400 font-mono dir-ltr">
                    POST /&#123;page_id&#125;/messages
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  placeholder={t.privateDmPlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl p-3.5 text-sm text-white focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">{t.privateDmHelp}</p>
              </div>
            </div>

            {/* Form Footer Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                />
                <span className="text-sm text-slate-200 font-medium">{t.activateNow}</span>
              </label>

              <div className="flex items-center gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                >
                  {t.saveCampaign}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns List Container */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto text-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">{t.noCampaigns}</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{t.noCampaignsDesc}</p>
          </div>
        ) : (
          campaigns.map((c) => {
            const kwList = c.keywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean);

            const thumbUrl =
              c.post_thumbnail_url ||
              `https://placehold.co/160x160/1e293b/a5b4fc?text=Post+${encodeURIComponent(
                c.post_id.slice(-4)
              )}`;

            return (
              <div
                key={c.id}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-2xl p-5 transition flex flex-col lg:flex-row gap-5 justify-between shadow-sm"
              >
                <div className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
                  <img
                    src={thumbUrl}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/160x160/1e293b/a5b4fc?text=IG+Post';
                    }}
                    alt="Post Thumbnail"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 dir-ltr">
                        Post ID: {c.post_id}
                      </span>
                      {c.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {t.active}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          {t.paused}
                        </span>
                      )}
                    </div>

                    {c.post_caption && (
                      <p className="text-xs text-slate-400 line-clamp-1">{c.post_caption}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">{t.triggers}</span>
                      {kwList.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
                        >
                          {kw.toLowerCase()}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block mb-0.5 flex items-center gap-1">
                          <Reply className="w-3 h-3" />
                          <span>{t.publicReply}</span>
                        </span>
                        <p className="text-xs text-slate-300 line-clamp-2">{c.comment_reply_text}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 block mb-0.5 flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          <span>{t.privateDm}</span>
                        </span>
                        <p className="text-xs text-slate-300 line-clamp-2">{c.dm_message_text}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex lg:flex-col justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                  <button
                    onClick={() => onOpenSimulator(c.post_id)}
                    className="px-3.5 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{t.simulate}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleStatus(c.id)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      {c.is_active ? (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.pause}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.activate}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(c)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                      title={t.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCampaign(c.id)}
                      className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium transition cursor-pointer"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
