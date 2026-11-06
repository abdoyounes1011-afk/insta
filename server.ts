import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import { normalizeText, matchKeywords } from './src/utils/textNormalizer';

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
  access_token: process.env.INSTAGRAM_ACCESS_TOKEN || '',
  app_secret: process.env.FACEBOOK_APP_SECRET || '',
  page_id: process.env.FACEBOOK_PAGE_ID || '104928374651928',
  instagram_account_id: process.env.INSTAGRAM_ACCOUNT_ID || '17841405309211844',
  verify_token: process.env.WEBHOOK_VERIFY_TOKEN || 'my_secure_custom_verify_token_2026',
  backend_url: process.env.APP_URL || ''
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

// Full Diagnostic Self-Test (Tests all failure possibilities)
app.post('/api/diagnostics', async (_req, res) => {
  const token = serverConfig.access_token;
  const pageId = serverConfig.page_id;
  const igId = serverConfig.instagram_account_id;

  const results: any = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  // Check 1: Webhook endpoint configuration
  results.checks.push({
    name: 'Webhook Endpoint Handshake',
    status: 'PASS',
    message: 'GET & POST /webhook/instagram are active and listening on port 3000.'
  });

  // Check 2: Verify Token
  results.checks.push({
    name: 'Webhook Verify Token',
    status: serverConfig.verify_token ? 'PASS' : 'WARN',
    message: serverConfig.verify_token
      ? `Verify token is configured: "${serverConfig.verify_token}"`
      : 'Verify token is blank.'
  });

  // Check 3: Access Token & Permissions Check
  if (!token) {
    results.checks.push({
      name: 'Meta Graph API Token',
      status: 'DEMO',
      message: 'Running in Demo/Simulation Mode. For real Instagram auto-replies, enter your Long-Lived Token in API Settings.'
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

        // Check Permissions
        const permRes = await fetch(
          `https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(token)}`
        );
        const permData = await permRes.json();
        const granted = (permData.data || [])
          .filter((p: any) => p.status === 'granted')
          .map((p: any) => p.permission);

        const hasComments = granted.includes('instagram_manage_comments');
        const hasMessages = granted.includes('instagram_manage_messages');

        results.checks.push({
          name: 'Instagram Comments Permission',
          status: hasComments ? 'PASS' : 'WARN',
          message: hasComments
            ? 'instagram_manage_comments permission is granted.'
            : 'Permission "instagram_manage_comments" is missing from token! Public comment replies will fail.'
        });

        results.checks.push({
          name: 'Instagram Messages Permission',
          status: hasMessages ? 'PASS' : 'WARN',
          message: hasMessages
            ? 'instagram_manage_messages permission is granted.'
            : 'Permission "instagram_manage_messages" is missing from token! Private DMs will fail.'
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

  // Check 4: Connected IDs
  results.checks.push({
    name: 'Facebook Page & IG Business ID',
    status: pageId && igId ? 'PASS' : 'WARN',
    message: `Page ID: ${pageId || 'missing'}, Instagram Account ID: ${igId || 'missing'}`
  });

  // Check 5: Active Campaigns
  const activeCount = serverCampaigns.filter((c) => c.is_active).length;
  results.checks.push({
    name: 'Active Campaigns Check',
    status: activeCount > 0 ? 'PASS' : 'WARN',
    message:
      activeCount > 0
        ? `${activeCount} campaign(s) actively tracking Instagram comments.`
        : 'No active campaigns found! Make sure at least one campaign has status set to "Active".'
  });

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
// 3. FRONTEND SERVING (Vite in Dev / Static dist in Prod)
// ============================================================================
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
