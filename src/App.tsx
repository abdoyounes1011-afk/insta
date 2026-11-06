import React, { useState, useEffect } from 'react';
import {
  Campaign,
  Config,
  Language,
  Metrics,
  PipelineStepState,
  ProcessedComment,
  SimDM,
  SimThreadComment,
  TabKey
} from './types';
import {
  DEFAULT_CAMPAIGNS,
  DEFAULT_CONFIG,
  DEFAULT_METRICS,
  DEFAULT_PROCESSED_COMMENTS,
  DEFAULT_SIM_DMS,
  DEFAULT_SIM_THREADS,
  SETUP_GUIDE_STEPS
} from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { TopMetrics } from './components/TopMetrics';
import { CampaignsView } from './components/CampaignsView';
import { SimulatorView } from './components/SimulatorView';
import { LogsView } from './components/LogsView';
import { SettingsView } from './components/SettingsView';
import { GuideView } from './components/GuideView';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, ToastItem } from './components/Toast';

const STORAGE_KEY = 'instaflow_state_v2';

export default function App() {
  // 1. Language state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('instaflow_lang');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('instaflow_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  // 2. Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>('campaigns');

  // 3. Persistent App State
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_campaigns`);
      return raw ? JSON.parse(raw) : DEFAULT_CAMPAIGNS;
    } catch {
      return DEFAULT_CAMPAIGNS;
    }
  });

  const [metrics, setMetrics] = useState<Metrics>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_metrics`);
      return raw ? JSON.parse(raw) : DEFAULT_METRICS;
    } catch {
      return DEFAULT_METRICS;
    }
  });

  const [config, setConfig] = useState<Config>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_config`);
      return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [processedComments, setProcessedComments] = useState<ProcessedComment[]>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_logs`);
      return raw ? JSON.parse(raw) : DEFAULT_PROCESSED_COMMENTS;
    } catch {
      return DEFAULT_PROCESSED_COMMENTS;
    }
  });

  const [threads, setThreads] = useState<Record<string, SimThreadComment[]>>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_threads`);
      return raw ? JSON.parse(raw) : DEFAULT_SIM_THREADS;
    } catch {
      return DEFAULT_SIM_THREADS;
    }
  });

  const [dms, setDms] = useState<SimDM[]>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_dms`);
      return raw ? JSON.parse(raw) : DEFAULT_SIM_DMS;
    } catch {
      return DEFAULT_SIM_DMS;
    }
  });

  const [guideState, setGuideState] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_guide`);
      return raw ? JSON.parse(raw) : { step1: true, step2: true };
    } catch {
      return { step1: true, step2: true };
    }
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_campaigns`, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_metrics`, JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_config`, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(processedComments));
  }, [processedComments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_threads`, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_dms`, JSON.stringify(dms));
  }, [dms]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_guide`, JSON.stringify(guideState));
  }, [guideState]);

  // 4. Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const copyToClipboard = (text: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    showToast(label, 'success');
  };

  // 5. Confirm Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  // 6. Simulator Pipeline State
  const [selectedPostId, setSelectedPostId] = useState<string>(() => campaigns[0]?.post_id || '17982345678901234');

  const defaultPipelineSteps: PipelineStepState[] = [
    {
      step: 1,
      status: 'idle',
      title: 'Webhook Event Received (POST /webhook/instagram)',
      description: 'Waiting for an Instagram comment event...',
      badge: 'IDLE'
    },
    {
      step: 2,
      status: 'idle',
      title: 'HMAC Signature Validation (X-Hub-Signature-256)',
      description: 'Verifies payload using FACEBOOK_APP_SECRET',
      badge: 'IDLE'
    },
    {
      step: 3,
      status: 'idle',
      title: 'Idempotency & Deduplication (ProcessedComment DB)',
      description: 'Checks if comment_id was already processed',
      badge: 'IDLE'
    },
    {
      step: 4,
      status: 'idle',
      title: 'Campaign & Keyword Matcher (Case-Insensitive)',
      description: 'Matches media.id & trigger keywords',
      badge: 'IDLE'
    },
    {
      step: 5,
      status: 'idle',
      title: 'Graph API Dispatch (reply_to_comment + send_dm)',
      description: 'Executes public comment reply & private DM',
      badge: 'IDLE'
    }
  ];

  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepState[]>(defaultPipelineSteps);
  const [lastWebhookPayload, setLastWebhookPayload] = useState<string>(() => {
    return JSON.stringify(
      {
        object: 'instagram',
        entry: [
          {
            id: '17841405309211844',
            time: 1762018800,
            changes: [
              {
                field: 'comments',
                value: {
                  id: '17991122334455667',
                  text: 'Submit a comment in the phone simulator to inspect live payload...',
                  from: { id: '178900112233', username: 'sarah_creates' },
                  media: { id: '17982345678901234', media_product_type: 'REELS' }
                }
              }
            ]
          }
        ]
      },
      null,
      2
    );
  });
  const [lastHmacSignature, setLastHmacSignature] = useState<string>(
    'X-Hub-Signature-256: sha256=8f92e4a1...'
  );
  const [lastEventData, setLastEventData] = useState<{
    comment_id: string;
    post_id: string;
    commenter_id: string;
    commenter_username: string;
    comment_text: string;
  } | null>(null);

  // 7. Pipeline Processing Handler
  const processCommentWebhook = async (
    postId: string,
    commentText: string,
    commenterUsername: string,
    commenterId: string,
    forcedCommentId?: string
  ) => {
    const commentId =
      forcedCommentId || '1799' + Math.floor(1000000000000 + Math.random() * 9000000000000);
    const isReplay = !!forcedCommentId;

    setLastEventData({
      comment_id: commentId,
      post_id: postId,
      commenter_id: commenterId,
      commenter_username: commenterUsername,
      comment_text: commentText
    });

    const fakeHmacDigest =
      'sha256=' +
      Array.from(commentId + postId)
        .map((c) => c.charCodeAt(0).toString(16))
        .join('')
        .slice(0, 32);

    const payloadObj = {
      object: 'instagram',
      entry: [
        {
          id: config.instagram_account_id || '17841405309211844',
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              field: 'comments',
              value: {
                id: commentId,
                text: commentText,
                from: {
                  id: commenterId,
                  username: commenterUsername
                },
                media: {
                  id: postId,
                  media_product_type: 'REELS'
                }
              }
            }
          ]
        }
      ]
    };

    setLastHmacSignature(`X-Hub-Signature-256: ${fakeHmacDigest.slice(0, 24)}...`);
    setLastWebhookPayload(JSON.stringify(payloadObj, null, 2));

    // Reset pipeline
    setPipelineSteps(
      defaultPipelineSteps.map((s) => ({
        ...s,
        status: 'pending',
        badge: 'PENDING'
      }))
    );

    // If new comment, add to phone feed thread
    if (!isReplay) {
      setThreads((prev) => {
        const list = prev[postId] ? [...prev[postId]] : [];
        return {
          ...prev,
          [postId]: [
            ...list,
            {
              comment_id: commentId,
              username: commenterUsername,
              text: commentText,
              time: 'Just now',
              reply: null
            }
          ]
        };
      });
    }

    // STEP 1: Webhook Received
    await new Promise((r) => setTimeout(r, 180));
    setPipelineSteps((prev) =>
      prev.map((s) =>
        s.step === 1
          ? {
              ...s,
              status: 'success',
              description: `Received comment_id=${commentId} from @${commenterUsername}`,
              badge: '200 OK'
            }
          : s
      )
    );

    // STEP 2: HMAC Validation
    await new Promise((r) => setTimeout(r, 200));
    setPipelineSteps((prev) =>
      prev.map((s) =>
        s.step === 2
          ? {
              ...s,
              status: 'success',
              description: `HMAC-SHA256 digest verified (${fakeHmacDigest.slice(0, 18)}...)`,
              badge: 'VALIDATED'
            }
          : s
      )
    );

    // STEP 3: Deduplication
    await new Promise((r) => setTimeout(r, 220));
    const isDuplicate = processedComments.some(
      (pc) => pc.comment_id === commentId && pc.status === 'TRIGGERED'
    );

    if (isDuplicate) {
      setPipelineSteps((prev) =>
        prev.map((s) => {
          if (s.step === 3) {
            return {
              ...s,
              status: 'warning',
              description: `Duplicate blocked! comment_id=${commentId} already exists in DB table.`,
              badge: 'DUPLICATE BLOCKED'
            };
          }
          if (s.step > 3) {
            return {
              ...s,
              status: 'idle',
              description: 'Skipped due to deduplication guard.',
              badge: 'SKIPPED'
            };
          }
          return s;
        })
      );

      setMetrics((m) => ({ ...m, duplicates_blocked: m.duplicates_blocked + 1 }));
      setProcessedComments((prev) => [
        {
          comment_id: commentId,
          post_id: postId,
          commenter_id: commenterId,
          commenter_username: commenterUsername,
          comment_text: commentText,
          matched_keyword: '(duplicate)',
          status: 'DUPLICATE_BLOCKED',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
        },
        ...prev
      ]);

      showToast(
        lang === 'ar'
          ? `تم حجب التعليق المكرر comment_id=${commentId.slice(-6)} بنجاح!`
          : `Deduplication blocked duplicate comment_id=${commentId.slice(-6)}!`,
        'warning'
      );
      return;
    }

    setPipelineSteps((prev) =>
      prev.map((s) =>
        s.step === 3
          ? {
              ...s,
              status: 'success',
              description: `comment_id=${commentId} is unique. Ready for keyword evaluation.`,
              badge: 'UNIQUE ID'
            }
          : s
      )
    );

    // STEP 4: Campaign & Keyword Match
    await new Promise((r) => setTimeout(r, 250));
    const activeCamp = campaigns.find((c) => c.post_id === postId && c.is_active);

    if (!activeCamp) {
      setPipelineSteps((prev) =>
        prev.map((s) => {
          if (s.step === 4) {
            return {
              ...s,
              status: 'danger',
              description: `No active campaign found for Post ID ${postId}.`,
              badge: 'INACTIVE'
            };
          }
          if (s.step === 5) {
            return {
              ...s,
              status: 'idle',
              description: 'No Graph API calls executed.',
              badge: 'SKIPPED'
            };
          }
          return s;
        })
      );
      return;
    }

    const commentLower = commentText.toLowerCase();
    const keywordsArr = activeCamp.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const matchedKeyword = keywordsArr.find((kw) => commentLower.includes(kw));

    if (!matchedKeyword) {
      setPipelineSteps((prev) =>
        prev.map((s) => {
          if (s.step === 4) {
            return {
              ...s,
              status: 'warning',
              description: `Comment did not match any trigger keywords [${activeCamp.keywords}].`,
              badge: 'NO MATCH'
            };
          }
          if (s.step === 5) {
            return {
              ...s,
              status: 'idle',
              description: 'Ignored — no keyword match.',
              badge: 'IGNORED'
            };
          }
          return s;
        })
      );

      setProcessedComments((prev) => [
        {
          comment_id: commentId,
          post_id: postId,
          commenter_id: commenterId,
          commenter_username: commenterUsername,
          comment_text: commentText,
          matched_keyword: '—',
          status: 'NO_MATCH',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
        },
        ...prev
      ]);

      showToast(
        lang === 'ar'
          ? 'تم استلام التعليق ولكن لم يطابق أياً من الكلمات المفتاحية.'
          : 'Comment posted, but did not match any trigger keywords.',
        'info'
      );
      return;
    }

    setPipelineSteps((prev) =>
      prev.map((s) =>
        s.step === 4
          ? {
              ...s,
              status: 'success',
              description: `Matched keyword "${matchedKeyword}" on Campaign #${activeCamp.id}`,
              badge: `MATCH: "${matchedKeyword.toUpperCase()}"`
            }
          : s
      )
    );

    // STEP 5: Graph API Dispatch
    await new Promise((r) => setTimeout(r, 280));
    const formattedReply = activeCamp.comment_reply_text.replace(
      /@username/gi,
      `@${commenterUsername}`
    );
    const formattedDM = activeCamp.dm_message_text.replace(
      /@username/gi,
      `@${commenterUsername}`
    );

    // Update thread reply
    setThreads((prev) => {
      const list = prev[postId] ? [...prev[postId]] : [];
      const itemIdx = list.findIndex((c) => c.comment_id === commentId);
      if (itemIdx !== -1) {
        list[itemIdx] = { ...list[itemIdx], reply: formattedReply };
      }
      return { ...prev, [postId]: list };
    });

    // Deliver DM
    setDms((prev) => [
      {
        id: 'dm_' + Date.now(),
        recipient_username: commenterUsername,
        comment_id: commentId,
        text: formattedDM,
        time: 'Just now'
      },
      ...prev
    ]);

    // Update logs & metrics
    setProcessedComments((prev) => [
      {
        comment_id: commentId,
        post_id: postId,
        commenter_id: commenterId,
        commenter_username: commenterUsername,
        comment_text: commentText,
        matched_keyword: matchedKeyword,
        status: 'TRIGGERED',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
      },
      ...prev
    ]);

    setMetrics((m) => ({
      ...m,
      replies_sent: m.replies_sent + 1,
      dms_sent: m.dms_sent + 1
    }));

    setPipelineSteps((prev) =>
      prev.map((s) =>
        s.step === 5
          ? {
              ...s,
              status: 'success',
              description: `Public reply posted & Private DM sent to @${commenterUsername}!`,
              badge: 'SENT (200 OK)'
            }
          : s
      )
    );

    showToast(
      lang === 'ar'
        ? `تطابقت الكلمة "${matchedKeyword.toUpperCase()}"! تم إرسال الرد العام ورسالة DM إلى @${commenterUsername}.`
        : `Keyword "${matchedKeyword.toUpperCase()}" matched! Public reply and DM delivered to @${commenterUsername}.`,
      'success'
    );
  };

  const handleReplayComment = async () => {
    if (!lastEventData) return;
    await processCommentWebhook(
      lastEventData.post_id,
      lastEventData.comment_text,
      lastEventData.commenter_username,
      lastEventData.commenter_id,
      lastEventData.comment_id // Passing same comment_id triggers deduplication
    );
  };

  // 8. Campaign Actions
  const handleSaveCampaign = (campData: Partial<Campaign>) => {
    if (campData.id) {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campData.id ? ({ ...c, ...campData } as Campaign) : c))
      );
      showToast(lang === 'ar' ? 'تم تحديث الحملة بنجاح!' : 'Campaign updated!', 'success');
    } else {
      const newCamp: Campaign = {
        id: Date.now(),
        post_id: campData.post_id || '17982345678901234',
        post_thumbnail_url:
          campData.post_thumbnail_url ||
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        post_caption: campData.post_caption || `Instagram Post #${campData.post_id}`,
        keywords: campData.keywords || 'guide, link',
        comment_reply_text: campData.comment_reply_text || 'Check your DMs @username! 🚀',
        dm_message_text: campData.dm_message_text || 'Hey @username! Here is your link: https://instaflow.app',
        is_active: campData.is_active ?? true,
        created_at: new Date().toISOString()
      };
      setCampaigns((prev) => [newCamp, ...prev]);
      showToast(lang === 'ar' ? 'تم إنشاء الحملة بنجاح!' : 'New campaign created!', 'success');
    }
  };

  const handleToggleCampaignStatus = (id: number) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = !c.is_active;
          showToast(
            lang === 'ar'
              ? `الحملة للمنشور #${c.post_id.slice(-5)} ${next ? 'تم تفعيلها' : 'تم إيقافها مؤقتاً'}.`
              : `Campaign for Post #${c.post_id.slice(-5)} ${next ? 'activated' : 'paused'}.`,
            next ? 'success' : 'warning'
          );
          return { ...c, is_active: next };
        }
        return c;
      })
    );
  };

  const handleDeleteCampaign = (id: number) => {
    const target = campaigns.find((c) => c.id === id);
    setModalConfig({
      isOpen: true,
      title: lang === 'ar' ? 'حذف حملة الأتمتة؟' : 'Delete Automation Campaign?',
      description:
        lang === 'ar'
          ? `سيتم إيقاف تتبع التعليقات على منشور انستغرام ذو المعرّف ${target?.post_id}.`
          : `This will stop tracking comments on Instagram Post ID ${target?.post_id}.`,
      onConfirm: () => {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        showToast(lang === 'ar' ? 'تم حذف الحملة.' : 'Campaign deleted.', 'danger');
      }
    });
  };

  const handlePromptClearLogs = () => {
    setModalConfig({
      isOpen: true,
      title:
        lang === 'ar'
          ? 'تفريغ جدول منع التكرار (ProcessedComment Table)؟'
          : 'Clear ProcessedComment Deduplication Table?',
      description:
        lang === 'ar'
          ? 'سيتم حذف جميع سجلات معرّفات التعليقات المخزنة مما يتيح اختبارها مجدداً دون حجب.'
          : 'This will remove all stored comment_id records so previously tested comments can fire again.',
      onConfirm: () => {
        setProcessedComments([]);
        showToast(
          lang === 'ar'
            ? 'تم تفريغ جدول منع التكرار بنجاح.'
            : 'ProcessedComment deduplication table cleared.',
          'info'
        );
      }
    });
  };

  const handleOpenSimulator = (postId: string) => {
    setSelectedPostId(postId);
    setActiveTab('simulator');
  };

  const handleToggleGuideStep = (stepKey: string) => {
    setGuideState((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  const handleSaveConfig = (newConfig: Config) => {
    setConfig(newConfig);
    showToast(
      lang === 'ar'
        ? 'تم حفظ إعدادات Instagram Graph API بنجاح.'
        : 'Instagram Graph API configuration saved securely.',
      'success'
    );
  };

  const handleResetDemo = () => {
    setConfig((prev) => ({ ...prev, access_token: '' }));
    showToast(
      lang === 'ar' ? 'تمت العودة إلى الوضع التجريبي (Demo Mode).' : 'Switched back to Demo Mode.',
      'info'
    );
  };

  const completedGuideCount = SETUP_GUIDE_STEPS.filter((s) => guideState[s.key]).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-x-hidden">
      {/* 1. Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        campaignsCount={campaigns.length}
        logsCount={processedComments.length}
        completedGuideCount={completedGuideCount}
        totalGuideSteps={SETUP_GUIDE_STEPS.length}
        hasToken={!!config.access_token}
        lang={lang}
        onToggleLang={toggleLanguage}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top KPI Metrics Bar */}
        <TopMetrics
          metrics={metrics}
          activeCampaignsCount={campaigns.filter((c) => c.is_active).length}
          lang={lang}
        />

        {/* Tab 1: Campaigns */}
        {activeTab === 'campaigns' && (
          <CampaignsView
            campaigns={campaigns}
            onSaveCampaign={handleSaveCampaign}
            onToggleStatus={handleToggleCampaignStatus}
            onDeleteCampaign={handleDeleteCampaign}
            onOpenSimulator={handleOpenSimulator}
            lang={lang}
            accessToken={config.access_token}
          />
        )}

        {/* Tab 2: Live IG Simulator */}
        {activeTab === 'simulator' && (
          <SimulatorView
            campaigns={campaigns}
            selectedPostId={selectedPostId}
            onSelectPostId={setSelectedPostId}
            threads={threads}
            dms={dms}
            processedComments={processedComments}
            pipelineSteps={pipelineSteps}
            lastWebhookPayload={lastWebhookPayload}
            lastHmacSignature={lastHmacSignature}
            canReplay={!!lastEventData}
            onPostComment={processCommentWebhook}
            onReplayComment={handleReplayComment}
            onCopyText={copyToClipboard}
            lang={lang}
          />
        )}

        {/* Tab 3: Processed Logs */}
        {activeTab === 'logs' && (
          <LogsView
            logs={processedComments}
            onPromptClearLogs={handlePromptClearLogs}
            lang={lang}
          />
        )}

        {/* Tab 4: Settings */}
        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            onSaveConfig={handleSaveConfig}
            onResetDemo={handleResetDemo}
            lang={lang}
          />
        )}

        {/* Tab 5: Meta Setup Guide */}
        {activeTab === 'guide' && (
          <GuideView
            guideState={guideState}
            onToggleStep={handleToggleGuideStep}
            onCopyText={copyToClipboard}
            lang={lang}
          />
        )}
      </main>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
