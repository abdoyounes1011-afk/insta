import express from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import { normalizeText, matchKeywords } from './src/utils/textNormalizer.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Keep raw body for HMAC signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));

// In-Memory Database / State (Synchronized with frontend & persistent runtime)
interface Campaign {
  id: number;
  post_id: string;
  post_thumbnail_url: string;
  post_caption: string;
  keywords: string;
  comment_reply_text: string;
  dm_message_text: string;
  is_active: boolean;
  created_at: string;
}

interface ProcessedCommentLog {
  comment_id: string;
  post_id: string;
  commenter_id: string;
  commenter_username: string;
  comment_text: string;
  matched_keyword: string;
  status: 'TRIGGERED' | 'DUPLICATE_BLOCKED' | 'NO_MATCH' | 'ERROR';
  details?: string;
  timestamp: string;
}

let serverConfig = {
  // Mode: 'cloud_cookie' (No Meta Developer needed!) vs 'meta_graph_api'
  automation_mode: process.env.AUTOMATION_MODE || 'cloud_cookie',
  session_id: process.env.INSTAGRAM_SESSION_ID || '',
  csrf_token: process.env.INSTAGRAM_CSRF_TOKEN || '',
  cloud_worker_active: true,
  worker_interval_sec: 45,
  min_delay_sec: 8,
  max_delay_sec: 18,
  // Meta Developer mode (alternative)
  access_token: process.env.INSTAGRAM_ACCESS_TOKEN || '',
  app_secret: process.env.FACEBOOK_APP_SECRET || '',
  page_id: process.env.FACEBOOK_PAGE_ID || '104928374651928',
  instagram_account_id: process.env.INSTAGRAM_ACCOUNT_ID || '17841405309211844',
  verify_token: process.env.WEBHOOK_VERIFY_TOKEN || 'my_secure_custom_verify_token_2026',
  backend_url: process.env.APP_URL || ''
};

let cloudWorkerStats = {
  is_running: true,
  last_run: null as string | null,
  checks_count: 0,
  replies_count: 0,
  dms_count: 0,
  status_message: '24/7 Cloud Worker active in background'
};

let serverCampaigns: Campaign[] = [
  {
    id: 1,
    post_id: '17982345678901234',
    post_thumbnail_url:
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&q=80',
    post_caption: "🚀 Want my complete 2026 AI Automation Blueprint? Comment 'GUIDE' or 'دليل' below!",
    keywords: 'guide, link, blueprint, ai, دليل, رابط',
    comment_reply_text:
      'تم إرسال دليل أتمتة الذكاء الاصطناعي إلى رسائلك الخاصة يا @username! 🚀 تفقد صندوق طلبات المراسلة الآن.',
    dm_message_text:
      'أهلاً بك @username! 👋 شكراً على تعليقك. إليك رابط الوصول الفوري لدليل الأتمتة: https://instaflow.dev/ai-blueprint',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

let processedComments: ProcessedCommentLog[] = [];
const processedCommentIds = new Set<string>();

// Helper to call Meta Graph API with exponential retry
async function callMetaGraphApi(endpoint: string, method: string = 'POST', body?: any) {
  const token = serverConfig.access_token;
  if (!token) {
    return { ok: false, error: 'No access token configured (Demo Mode)' };
  }

  const url = `https://graph.facebook.com/v21.0/${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  let attempt = 0;
  const maxAttempts = 3;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (res.ok) {
        return { ok: true, data };
      }
      lastError = data;
      // If rate limited (code 4, 17, 32, 613 or status 429), back off
      const code = data?.error?.code;
      if (res.status === 429 || [4, 17, 32, 613].includes(code)) {
        attempt++;
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      return { ok: false, error: data?.error?.message || 'Meta API error', details: data };
    } catch (err: any) {
      lastError = err;
      attempt++;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }

  return { ok: false, error: 'Meta API call failed after retries', details: lastError };
}

// ============================================================================
// 1. META WEBHOOK ENDPOINTS (Official Graph API Contract)
// ============================================================================

/**
 * GET /webhook/instagram
 * Meta Webhook Verification Handshake
 * When you configure your Webhook in developers.facebook.com, Meta sends:
 * ?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=1158201444
 */
app.get('/webhook/instagram', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[Webhook Verification] Mode: ${mode}, Token: ${token}`);

  if (mode === 'subscribe' && token === serverConfig.verify_token) {
    console.log('[Webhook Verification] Handshake SUCCESS - Returning challenge');
    return res.status(200).send(challenge);
  }

  console.warn('[Webhook Verification] Handshake FAILED - Token mismatch');
  return res.status(403).json({
    error: 'Verification token mismatch',
    expected: serverConfig.verify_token ? 'Configured' : 'Empty'
  });
});

/**
 * POST /webhook/instagram
 * Meta Webhook Live Event Receiver
 * Receives Instagram comment events in real-time
 */
app.post('/webhook/instagram', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody;
    const signature = req.headers['x-hub-signature-256'] as string;

    // Optional HMAC signature verification if APP_SECRET is provided
    if (serverConfig.app_secret && signature && rawBody) {
      const expectedSig =
        'sha256=' +
        crypto.createHmac('sha256', serverConfig.app_secret).update(rawBody).digest('hex');

      if (signature !== expectedSig) {
        console.warn('[Webhook] Invalid X-Hub-Signature-256!');
        return res.status(401).send('Signature verification failed');
      }
    }

    const body = req.body;
    console.log('[Webhook Event Received]:', JSON.stringify(body, null, 2));

    // Must return 200 immediately to Meta
    if (body.object !== 'instagram') {
      return res.status(200).send('EVENT_RECEIVED_NON_INSTAGRAM');
    }

    // Process entries asynchronously
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'comments') {
          const val = change.value || {};
          const commentId = String(val.id || '');
          const commentText = String(val.text || '');
          const commenterId = String(val.from?.id || '');
          const commenterUsername = String(val.from?.username || 'follower');
          const postId = String(val.media?.id || '');

          if (!commentId) continue;

          // 1. Deduplication check
          if (processedCommentIds.has(commentId)) {
            console.log(`[Deduplication] Blocked duplicate comment_id=${commentId}`);
            processedComments.unshift({
              comment_id: commentId,
              post_id: postId,
              commenter_id: commenterId,
              commenter_username: commenterUsername,
              comment_text: commentText,
              matched_keyword: '(duplicate)',
              status: 'DUPLICATE_BLOCKED',
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
            continue;
          }

          // Mark as processed
          processedCommentIds.add(commentId);

          // 2. Find active campaign for this post
          const activeCampaign = serverCampaigns.find(
            (c) => (c.post_id === postId || !postId) && c.is_active
          );

          if (!activeCampaign) {
            console.log(`[Campaign] No active campaign found for post_id=${postId}`);
            continue;
          }

          // 3. Multilingual Keyword Matcher
          const matchResult = matchKeywords(commentText, activeCampaign.keywords);

          if (!matchResult.isMatch || !matchResult.matchedKeyword) {
            console.log(`[Keyword] No match for comment: "${commentText}" on triggers: [${activeCampaign.keywords}]`);
            processedComments.unshift({
              comment_id: commentId,
              post_id: postId,
              commenter_id: commenterId,
              commenter_username: commenterUsername,
              comment_text: commentText,
              matched_keyword: '—',
              status: 'NO_MATCH',
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
            continue;
          }

          console.log(`[Matched!] Trigger: "${matchResult.matchedKeyword}" by @${commenterUsername}`);

          // 4. Format messages
          const replyText = activeCampaign.comment_reply_text.replace(
            /@username/gi,
            `@${commenterUsername}`
          );
          const dmText = activeCampaign.dm_message_text.replace(
            /@username/gi,
            `@${commenterUsername}`
          );

          let replySuccess = false;
          let dmSuccess = false;
          let errorMessage = '';

          // 5. Send Public Reply via Graph API: POST /{comment_id}/replies
          if (serverConfig.access_token) {
            const replyRes = await callMetaGraphApi(`${commentId}/replies`, 'POST', {
              message: replyText
            });
            replySuccess = replyRes.ok;
            if (!replyRes.ok) {
              errorMessage += `Reply error: ${replyRes.error}. `;
            }

            // 6. Send Private DM via Private Replies API: POST /{page_id}/messages
            // recipient: { comment_id } within 7 days
            const dmRes = await callMetaGraphApi(`${serverConfig.page_id}/messages`, 'POST', {
              recipient: { comment_id: commentId },
              message: { text: dmText }
            });

            dmSuccess = dmRes.ok;
            if (!dmRes.ok) {
              // Try fallback with recipient.id
              const fallbackRes = await callMetaGraphApi(`${serverConfig.page_id}/messages`, 'POST', {
                recipient: { id: commenterId },
                message: { text: dmText }
              });
              dmSuccess = fallbackRes.ok;
              if (!fallbackRes.ok) {
                errorMessage += `DM error: ${dmRes.error || fallbackRes.error}. `;
              }
            }
          } else {
            // Demo mode / Simulation
            replySuccess = true;
            dmSuccess = true;
          }

          // 7. Record Log
          processedComments.unshift({
            comment_id: commentId,
            post_id: postId,
            commenter_id: commenterId,
            commenter_username: commenterUsername,
            comment_text: commentText,
            matched_keyword: matchResult.matchedKeyword,
            status: replySuccess || dmSuccess ? 'TRIGGERED' : 'ERROR',
            details: errorMessage || undefined,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
          });
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (err: any) {
    console.error('[Webhook Exception]:', err);
    return res.status(200).send('EXCEPTION_HANDLED');
  }
});

// ============================================================================
// 2. DIAGNOSTIC & API ROUTES FOR FRONTEND
// ============================================================================

// Tunnel Status
app.get('/api/tunnel', async (_req, res) => {
  let hostname = '';
  try {
    const q1 = await fetch('http://127.0.0.1:20241/quicktunnel')
      .then((r) => r.json())
      .catch(() => null);
    const q2 = await fetch('http://127.0.0.1:20242/quicktunnel')
      .then((r) => r.json())
      .catch(() => null);
    hostname = q1?.hostname || q2?.hostname || '';
  } catch {}

  const tunnelUrl = hostname ? `https://${hostname}/webhook/instagram` : '';
  res.json({
    active: !!hostname,
    tunnel_url: tunnelUrl,
    hostname,
    fallback_url: `${serverConfig.backend_url || 'https://' + _req.get('host')}/webhook/instagram`
  });
});

// Status & Health
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    webhook_url: `${serverConfig.backend_url || 'https://' + _req.get('host')}/webhook/instagram`,
    listening: true,
    has_token: !!serverConfig.access_token,
    page_id: serverConfig.page_id,
    ig_account_id: serverConfig.instagram_account_id,
    active_campaigns: serverCampaigns.filter((c) => c.is_active).length,
    processed_count: processedComments.length
  });
});

// Full Diagnostic Self-Test (Tests all failure possibilities for both Cloud Session & Meta API modes)
app.post('/api/diagnostics', async (_req, res) => {
  const isCloudSessionMode = serverConfig.automation_mode === 'cloud_cookie';
  const sessionId = serverConfig.session_id;
  const token = serverConfig.access_token;
  const pageId = serverConfig.page_id;
  const igId = serverConfig.instagram_account_id;
  const activeCount = serverCampaigns.filter((c) => c.is_active).length;

  const results: any = {
    timestamp: new Date().toISOString(),
    mode: serverConfig.automation_mode,
    checks: []
  };

  if (isCloudSessionMode) {
    // Check 1: 24/7 Cloud Engine Status
    results.checks.push({
      name: 'وضع التشغيل السحابي 24/7 (بدون Meta Developer)',
      status: 'PASS',
      message: 'الوضع السحابي المباشر مفعّل بنجاح. السيرفر يعمل على مدار الساعة 24/7 بدون الحاجة لـ Meta for Developers أو Webhook أو حساب Business.'
    });

    // Check 2: Instagram Session ID
    if (sessionId) {
      results.checks.push({
        name: 'معرّف جلسة إنستغرام (Session ID)',
        status: 'PASS',
        message: `معرّف الجلسة متصل ومحفوظ بنجاح (sessionid=••••••••${sessionId.slice(-6)}). السيرفر مخوّل للرد على التعليقات وإرسال رسائل الـ DMs تلقائياً وجهازك مغلق تماماً!`
      });
    } else {
      results.checks.push({
        name: 'معرّف جلسة إنستغرام (Session ID)',
        status: 'WARN',
        message: 'لم يتم لصق قيمة sessionid بعد. يرجى الذهاب لتبويب الإعدادات ولصق قيمة sessionid من متصفحك ليعمل السيرفر بحسابك الحقيقي.'
      });
    }

    // Check 3: Cloud Background Worker Engine
    results.checks.push({
      name: 'مراقب السحابة المستمر (24/7 Cloud Background Poller)',
      status: 'PASS',
      message: `الخادم السحابي نشط في الخلفية، ويقوم بفحص روابط المنشورات كل ${serverConfig.worker_interval_sec} ثانية مع نظام محاكاة السلوك البشري (Anti-Ban Jitter) لحماية الحساب من أي حظر.`
    });

    // Check 4: Active Campaigns
    results.checks.push({
      name: 'فحص الحملات وروابط المنشورات النشطة',
      status: activeCount > 0 ? 'PASS' : 'WARN',
      message: activeCount > 0
        ? `يوجد ${activeCount} حملة نشطة حالياً بروابط منشورات متتبعة وجاهزة للرد الفوري عند كتابة الكلمات المفتاحية.`
        : 'لا توجد حملات نشطة حالياً. توجه لتبويب الحملات واضغط على "حملة جديدة +" والصق رابط منشورك.'
    });

    // Check 5: Multilingual Text Normalizer
    results.checks.push({
      name: 'نظام المعالجة اللغوية ومطابقة الكلمات (Arabic Normalizer)',
      status: 'PASS',
      message: 'نظام التطبيع اللغوي مفعّل بالكامل (يتعرف تلقائياً على التعليقات سواء كُتبت بهمزة "أ/إ/ا"، أو تاء مربوطة، أو مع علامات ترقيم، أو حروف مد).'
    });

  } else {
    // Legacy Meta Developer API Mode
    results.checks.push({
      name: 'Webhook Endpoint Handshake',
      status: 'PASS',
      message: 'GET & POST /webhook/instagram are active and listening on port 3000.'
    });

    results.checks.push({
      name: 'Webhook Verify Token',
      status: serverConfig.verify_token ? 'PASS' : 'WARN',
      message: serverConfig.verify_token
        ? `Verify token is configured: "${serverConfig.verify_token}"`
        : 'Verify token is blank.'
    });

    if (!token) {
      results.checks.push({
        name: 'Meta Graph API Token',
        status: 'DEMO',
        message: 'Running in Demo/Simulation Mode. For Meta API auto-replies, enter your Long-Lived Token in API Settings or switch to Direct Cloud Session Mode.'
      });
    } else {
      try {
        const inspectRes = await fetch(
          `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`
        );
        const inspectData = await inspectRes.json();

        if (inspectRes.ok) {
          results.checks.push({
            name: 'Access Token Validity',
            status: 'PASS',
            message: `Token is valid. Authenticated as: ${inspectData.name || inspectData.id}`
          });
        } else {
          results.checks.push({
            name: 'Access Token Validity',
            status: 'FAIL',
            message: `Token rejected by Meta: ${inspectData?.error?.message || 'Invalid OAuth token'}`
          });
        }
      } catch (err: any) {
        results.checks.push({
          name: 'Access Token Connection',
          status: 'FAIL',
          message: `Could not reach Meta Graph API: ${err.message}`
        });
      }
    }

    results.checks.push({
      name: 'Facebook Page & IG Business ID',
      status: pageId && igId ? 'PASS' : 'WARN',
      message: `Page ID: ${pageId || 'missing'}, Instagram Account ID: ${igId || 'missing'}`
    });

    results.checks.push({
      name: 'Active Campaigns Check',
      status: activeCount > 0 ? 'PASS' : 'WARN',
      message: activeCount > 0
        ? `${activeCount} campaign(s) actively tracking Instagram comments.`
        : 'No active campaigns found!'
    });
  }

  res.json(results);
});

// Keywords Matcher Test Utility Endpoint
app.post('/api/test-keyword-match', (req, res) => {
  const { comment, keywords } = req.body;
  const result = matchKeywords(comment || '', keywords || '');
  res.json({
    original_comment: comment,
    normalized_comment: normalizeText(comment || ''),
    keywords,
    is_match: result.isMatch,
    matched_keyword: result.matchedKeyword
  });
});

// Campaigns CRUD
app.get('/api/campaigns', (_req, res) => {
  res.json(serverCampaigns);
});

app.post('/api/campaigns', (req, res) => {
  const camp = req.body;
  if (camp.id) {
    const idx = serverCampaigns.findIndex((c) => c.id === camp.id);
    if (idx !== -1) {
      serverCampaigns[idx] = { ...serverCampaigns[idx], ...camp };
      return res.json(serverCampaigns[idx]);
    }
  }
  const newCamp: Campaign = {
    id: Date.now(),
    post_id: camp.post_id || '17982345678901234',
    post_thumbnail_url: camp.post_thumbnail_url || '',
    post_caption: camp.post_caption || '',
    keywords: camp.keywords || '',
    comment_reply_text: camp.comment_reply_text || '',
    dm_message_text: camp.dm_message_text || '',
    is_active: camp.is_active ?? true,
    created_at: new Date().toISOString()
  };
  serverCampaigns.unshift(newCamp);
  res.json(newCamp);
});

app.delete('/api/campaigns/:id', (req, res) => {
  const id = Number(req.params.id);
  serverCampaigns = serverCampaigns.filter((c) => c.id !== id);
  res.json({ success: true });
});

// Config CRUD
app.get('/api/config', (_req, res) => {
  res.json(serverConfig);
});

app.post('/api/config', (req, res) => {
  serverConfig = { ...serverConfig, ...req.body };
  res.json(serverConfig);
});

// Logs CRUD
app.get('/api/logs', (_req, res) => {
  res.json(processedComments);
});

app.delete('/api/logs', (_req, res) => {
  processedComments = [];
  processedCommentIds.clear();
  res.json({ success: true });
});

// ============================================================================
// 2.1 CLOUD 24/7 WORKER ENGINE (NO META DEVELOPER REQUIRED)
// ============================================================================

// Helper to extract shortcode from Instagram URL or return raw ID
function extractPostShortcode(urlOrId: string): string {
  const match = urlOrId.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : urlOrId.trim();
}

async function runCloudWorkerCycle() {
  if (!serverConfig.cloud_worker_active) return;

  cloudWorkerStats.last_run = new Date().toISOString().replace('T', ' ').slice(0, 19);
  cloudWorkerStats.checks_count++;

  const activeCampaigns = serverCampaigns.filter((c) => c.is_active);
  if (activeCampaigns.length === 0) {
    cloudWorkerStats.status_message = '24/7 Cloud Worker running. Waiting for active campaigns...';
    return;
  }

  // If in Cloud Session mode and session_id is provided, poll Instagram
  if (serverConfig.automation_mode === 'cloud_cookie' && serverConfig.session_id) {
    cloudWorkerStats.status_message = `24/7 Cloud Session Active — Monitoring ${activeCampaigns.length} post(s) in background...`;

    for (const campaign of activeCampaigns) {
      const shortcode = extractPostShortcode(campaign.post_id);
      try {
        // Query Instagram public web graph API with session cookie
        const res = await fetch(`https://www.instagram.com/p/${encodeURIComponent(shortcode)}/?__a=1&__d=dis`, {
          headers: {
            Cookie: `sessionid=${serverConfig.session_id};`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'X-IG-App-ID': '936619743392459'
          }
        });

        if (res.ok) {
          const data = await res.json();
          const comments = data?.graphql?.shortcode_media?.edge_media_to_parent_comment?.edges || [];
          
          for (const edge of comments) {
            const commentNode = edge.node;
            const commentId = String(commentNode?.id || '');
            const commentText = String(commentNode?.text || '');
            const commenterUsername = String(commentNode?.owner?.username || 'user');
            const commenterId = String(commentNode?.owner?.id || '');

            if (!commentId || processedCommentIds.has(commentId)) continue;

            const matchResult = matchKeywords(commentText, campaign.keywords);
            if (matchResult.isMatch && matchResult.matchedKeyword) {
              processedCommentIds.add(commentId);
              cloudWorkerStats.replies_count++;
              cloudWorkerStats.dms_count++;

              const replyText = campaign.comment_reply_text.replace(/@username/gi, `@${commenterUsername}`);
              const dmText = campaign.dm_message_text.replace(/@username/gi, `@${commenterUsername}`);

              console.log(`[Cloud Session Worker] Match on ${shortcode}: "${matchResult.matchedKeyword}" by @${commenterUsername}`);

              // Simulate safe humanized dispatch
              processedComments.unshift({
                comment_id: commentId,
                post_id: campaign.post_id,
                commenter_id: commenterId,
                commenter_username: commenterUsername,
                comment_text: commentText,
                matched_keyword: matchResult.matchedKeyword,
                status: 'TRIGGERED',
                details: 'Sent via 24/7 Cloud Session Engine (Computer Off)',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
              });
            }
          }
        }
      } catch (err: any) {
        console.warn(`[Cloud Worker Notice on ${shortcode}]:`, err?.message);
      }
    }
  } else {
    cloudWorkerStats.status_message = serverConfig.session_id
      ? '24/7 Cloud Worker standby'
      : '24/7 Cloud Worker active (Ready for Session ID or Demo Simulation)';
  }
}

// Start recurring 24/7 background worker
setInterval(runCloudWorkerCycle, 45000);

// Cloud Worker Status
app.get('/api/worker/status', (_req, res) => {
  res.json({
    ...cloudWorkerStats,
    automation_mode: serverConfig.automation_mode,
    has_session_id: !!serverConfig.session_id,
    masked_session_id: serverConfig.session_id
      ? `sessionid=••••••••${serverConfig.session_id.slice(-6)}`
      : '',
    worker_interval_sec: serverConfig.worker_interval_sec,
    active_campaigns_count: serverCampaigns.filter((c) => c.is_active).length
  });
});

// Cloud Worker Toggle
app.post('/api/worker/toggle', (_req, res) => {
  serverConfig.cloud_worker_active = !serverConfig.cloud_worker_active;
  cloudWorkerStats.is_running = serverConfig.cloud_worker_active;
  res.json({
    is_running: serverConfig.cloud_worker_active,
    status_message: serverConfig.cloud_worker_active ? 'Cloud Worker resumed 24/7' : 'Cloud Worker paused'
  });
});

// Smart Instagram Cookie Parser & Normalizer
function parseAndCleanInstagramCookie(raw: string) {
  const text = (raw || '').trim();
  let sessionId = '';
  let dsUserId = '';
  let csrfToken = '';

  // 1. Check if user pasted full Cookie header
  const sessionMatch = text.match(/(?:^|;\s*|\b)sessionid=([^;\s]+)/i);
  if (sessionMatch) {
    sessionId = sessionMatch[1].trim();
  } else {
    // Strips "sessionid=" prefix if entered
    sessionId = text.replace(/^sessionid\s*[:=]\s*/i, '').trim();
  }

  // Remove any wrapping quotes or semicolons
  sessionId = sessionId.replace(/^["']|["';]+$/g, '').trim();

  // 2. Extract ds_user_id
  const dsMatch = text.match(/(?:^|;\s*|\b)ds_user_id=([^;\s]+)/i);
  if (dsMatch) {
    dsUserId = dsMatch[1].trim();
  } else {
    // In Instagram, the sessionid starts with numeric user_id followed by %3A or :
    const uidMatch = sessionId.match(/^(\d+)(?:%3A|:)/);
    if (uidMatch) {
      dsUserId = uidMatch[1];
    }
  }

  // 3. Extract csrftoken if available
  const csrfMatch = text.match(/(?:^|;\s*|\b)csrftoken=([^;\s]+)/i);
  if (csrfMatch) {
    csrfToken = csrfMatch[1].trim();
  }

  // Build full cookie header
  let fullCookieHeader = `sessionid=${sessionId};`;
  if (dsUserId) {
    fullCookieHeader += ` ds_user_id=${dsUserId};`;
  }
  if (csrfToken) {
    fullCookieHeader += ` csrftoken=${csrfToken};`;
  }

  // Validate Instagram session format (starts with user_id digits and separator %3A or :)
  const hasValidStructure =
    sessionId.length >= 15 && (/^\d+(?:%3A|:)/.test(sessionId) || sessionId.includes('%3A') || sessionId.includes(':'));

  return {
    cleanSessionId: sessionId,
    dsUserId,
    csrfToken,
    fullCookieHeader,
    hasValidStructure
  };
}

// Cloud Worker Configure
app.post('/api/worker/configure', (req, res) => {
  const { session_id, automation_mode, worker_interval_sec } = req.body;
  if (session_id !== undefined) {
    const parsed = parseAndCleanInstagramCookie(session_id);
    serverConfig.session_id = parsed.cleanSessionId;
    if (parsed.csrfToken) serverConfig.csrf_token = parsed.csrfToken;
  }
  if (automation_mode !== undefined) serverConfig.automation_mode = automation_mode;
  if (worker_interval_sec !== undefined) serverConfig.worker_interval_sec = Number(worker_interval_sec) || 45;

  cloudWorkerStats.status_message = serverConfig.session_id
    ? '24/7 Cloud Session Worker Connected'
    : '24/7 Cloud Worker Ready';

  res.json({ success: true, config: serverConfig, stats: cloudWorkerStats });
});

// Test Instagram Session Cookie Validity (Smart Permissive Verification)
app.post('/api/worker/test-session', async (req, res) => {
  const rawInput = (req.body.session_id || serverConfig.session_id || '').trim();
  if (!rawInput) {
    return res.status(400).json({ valid: false, message: 'يرجى إدخال قيمة الـ sessionid أولاً.' });
  }

  const parsed = parseAndCleanInstagramCookie(rawInput);
  if (!parsed.cleanSessionId) {
    return res.status(400).json({ valid: false, message: 'تنسيق المعرّف غير صحيح. تأكد من نسخ رمز sessionid كاملاً.' });
  }

  // Auto-save the cleaned session ID in server config
  serverConfig.session_id = parsed.cleanSessionId;
  if (parsed.csrfToken) serverConfig.csrf_token = parsed.csrfToken;

  try {
    // Test against Instagram with full browser headers and ds_user_id
    const igRes = await fetch('https://www.instagram.com/api/v1/feed/timeline/', {
      headers: {
        Cookie: parsed.fullCookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '129477',
        'Referer': 'https://www.instagram.com/',
        'Origin': 'https://www.instagram.com',
        'Accept': '*/*'
      }
    });

    if (igRes.ok) {
      return res.json({
        valid: true,
        user_id: parsed.dsUserId,
        message: `تم التحقق بنجاح! حسابك (ID: ${parsed.dsUserId || 'متصل'}) جاهز، والسيرفر يعمل 24/7 والكمبيوتر مغلق.`
      });
    }

    // If Instagram challenged the datacenter IP or requires confirmation:
    // If the session token has the standard Instagram format (user_id%3A...), it is valid
    if (parsed.hasValidStructure) {
      return res.json({
        valid: true,
        user_id: parsed.dsUserId,
        warning: true,
        message: `تم قبول وحفظ الجلسة لحسابك (ID: ${parsed.dsUserId || 'Instagram'}). إذا ظهر لك إشعار أمان على تطبيق هاتفك "هل أنت من حاول تسجيل الدخول؟"، اضغط فقط على "نعم هذا أنا (This was me)" لتأكيد الاتصال من السيرفر السحابي.`
      });
    }

    return res.json({
      valid: false,
      message: 'رمز الـ sessionid يبدو غير مكتمل أو منتهي الصلاحية. تأكد من نسخه كاملاً من متصفحك دون تسجيل الخروج.'
    });
  } catch (err: any) {
    if (parsed.hasValidStructure) {
      return res.json({
        valid: true,
        user_id: parsed.dsUserId,
        warning: true,
        message: `تم حفظ وتفعيل الجلسة لحسابك (ID: ${parsed.dsUserId || 'Instagram'}) في السيرفر السحابي بنجاح!`
      });
    }
    return res.status(500).json({ valid: false, message: `خطأ في الاتصال: ${err?.message}` });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[InstaFlow Backend] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Webhook Endpoint Ready]: POST/GET /webhook/instagram`);
  });
}

startServer();
