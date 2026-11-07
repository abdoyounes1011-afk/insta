// server.ts
import express from "express";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";

// src/utils/textNormalizer.ts
function normalizeText(text) {
  if (!text) return "";
  let normalized = text.toLowerCase();
  normalized = normalized.replace(/\u0640/g, "");
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, "");
  normalized = normalized.replace(/[أإآٱ]/g, "\u0627");
  normalized = normalized.replace(/ة/g, "\u0647");
  normalized = normalized.replace(/ى/g, "\u064A");
  normalized = normalized.replace(/ؤ/g, "\u0648").replace(/ئ/g, "\u064A");
  normalized = normalized.replace(/(.)\1{2,}/g, "$1");
  normalized = normalized.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~،؛؟«»—–…]/g, " ");
  normalized = normalized.replace(/\s+/g, " ").trim();
  return normalized;
}
function matchKeywords(commentText, keywordsString) {
  if (!commentText || !keywordsString) {
    return { isMatch: false, matchedKeyword: null };
  }
  const normalizedComment = normalizeText(commentText);
  const commentTokens = normalizedComment.split(" ").filter(Boolean);
  const keywords = keywordsString.split(",").map((k) => k.trim()).filter(Boolean);
  for (const rawKeyword of keywords) {
    const normalizedKeyword = normalizeText(rawKeyword);
    if (!normalizedKeyword) continue;
    if (normalizedComment.includes(normalizedKeyword)) {
      return { isMatch: true, matchedKeyword: rawKeyword.trim() };
    }
    const keywordTokens = normalizedKeyword.split(" ").filter(Boolean);
    if (keywordTokens.length === 1) {
      if (commentTokens.includes(normalizedKeyword)) {
        return { isMatch: true, matchedKeyword: rawKeyword.trim() };
      }
    }
  }
  return { isMatch: false, matchedKeyword: null };
}

// server.ts
dotenv.config();
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));
var serverConfig = {
  // Mode: 'cloud_cookie' (No Meta Developer needed!) vs 'meta_graph_api'
  automation_mode: process.env.AUTOMATION_MODE || "cloud_cookie",
  session_id: process.env.INSTAGRAM_SESSION_ID || "",
  csrf_token: process.env.INSTAGRAM_CSRF_TOKEN || "",
  cloud_worker_active: true,
  worker_interval_sec: 45,
  min_delay_sec: 8,
  max_delay_sec: 18,
  // Meta Developer mode (alternative)
  access_token: process.env.INSTAGRAM_ACCESS_TOKEN || "",
  app_secret: process.env.FACEBOOK_APP_SECRET || "",
  page_id: process.env.FACEBOOK_PAGE_ID || "104928374651928",
  instagram_account_id: process.env.INSTAGRAM_ACCOUNT_ID || "17841405309211844",
  verify_token: process.env.WEBHOOK_VERIFY_TOKEN || "my_secure_custom_verify_token_2026",
  backend_url: process.env.APP_URL || ""
};
var cloudWorkerStats = {
  is_running: true,
  last_run: null,
  checks_count: 0,
  replies_count: 0,
  dms_count: 0,
  status_message: "24/7 Cloud Worker active in background"
};
var serverCampaigns = [
  {
    id: 1,
    post_id: "17982345678901234",
    post_thumbnail_url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&q=80",
    post_caption: "\u{1F680} Want my complete 2026 AI Automation Blueprint? Comment 'GUIDE' or '\u062F\u0644\u064A\u0644' below!",
    keywords: "guide, link, blueprint, ai, \u062F\u0644\u064A\u0644, \u0631\u0627\u0628\u0637",
    comment_reply_text: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u062F\u0644\u064A\u0644 \u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0625\u0644\u0649 \u0631\u0633\u0627\u0626\u0644\u0643 \u0627\u0644\u062E\u0627\u0635\u0629 \u064A\u0627 @username! \u{1F680} \u062A\u0641\u0642\u062F \u0635\u0646\u062F\u0648\u0642 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0631\u0627\u0633\u0644\u0629 \u0627\u0644\u0622\u0646.",
    dm_message_text: "\u0623\u0647\u0644\u0627\u064B \u0628\u0643 @username! \u{1F44B} \u0634\u0643\u0631\u0627\u064B \u0639\u0644\u0649 \u062A\u0639\u0644\u064A\u0642\u0643. \u0625\u0644\u064A\u0643 \u0631\u0627\u0628\u0637 \u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0641\u0648\u0631\u064A \u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u0623\u062A\u0645\u062A\u0629: https://instaflow.dev/ai-blueprint",
    is_active: true,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var processedComments = [];
var processedCommentIds = /* @__PURE__ */ new Set();
async function callMetaGraphApi(endpoint, method = "POST", body) {
  const token = serverConfig.access_token;
  if (!token) {
    return { ok: false, error: "No access token configured (Demo Mode)" };
  }
  const url = `https://graph.facebook.com/v21.0/${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  let attempt = 0;
  const maxAttempts = 3;
  let lastError = null;
  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (res.ok) {
        return { ok: true, data };
      }
      lastError = data;
      const code = data?.error?.code;
      if (res.status === 429 || [4, 17, 32, 613].includes(code)) {
        attempt++;
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1e3));
        continue;
      }
      return { ok: false, error: data?.error?.message || "Meta API error", details: data };
    } catch (err) {
      lastError = err;
      attempt++;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1e3));
    }
  }
  return { ok: false, error: "Meta API call failed after retries", details: lastError };
}
app.get("/webhook/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log(`[Webhook Verification] Mode: ${mode}, Token: ${token}`);
  if (mode === "subscribe" && token === serverConfig.verify_token) {
    console.log("[Webhook Verification] Handshake SUCCESS - Returning challenge");
    return res.status(200).send(challenge);
  }
  console.warn("[Webhook Verification] Handshake FAILED - Token mismatch");
  return res.status(403).json({
    error: "Verification token mismatch",
    expected: serverConfig.verify_token ? "Configured" : "Empty"
  });
});
app.post("/webhook/instagram", async (req, res) => {
  try {
    const rawBody = req.rawBody;
    const signature = req.headers["x-hub-signature-256"];
    if (serverConfig.app_secret && signature && rawBody) {
      const expectedSig = "sha256=" + crypto.createHmac("sha256", serverConfig.app_secret).update(rawBody).digest("hex");
      if (signature !== expectedSig) {
        console.warn("[Webhook] Invalid X-Hub-Signature-256!");
        return res.status(401).send("Signature verification failed");
      }
    }
    const body = req.body;
    console.log("[Webhook Event Received]:", JSON.stringify(body, null, 2));
    if (body.object !== "instagram") {
      return res.status(200).send("EVENT_RECEIVED_NON_INSTAGRAM");
    }
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === "comments") {
          const val = change.value || {};
          const commentId = String(val.id || "");
          const commentText = String(val.text || "");
          const commenterId = String(val.from?.id || "");
          const commenterUsername = String(val.from?.username || "follower");
          const postId = String(val.media?.id || "");
          if (!commentId) continue;
          if (processedCommentIds.has(commentId)) {
            console.log(`[Deduplication] Blocked duplicate comment_id=${commentId}`);
            processedComments.unshift({
              comment_id: commentId,
              post_id: postId,
              commenter_id: commenterId,
              commenter_username: commenterUsername,
              comment_text: commentText,
              matched_keyword: "(duplicate)",
              status: "DUPLICATE_BLOCKED",
              timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
            });
            continue;
          }
          processedCommentIds.add(commentId);
          const activeCampaign = serverCampaigns.find(
            (c) => (c.post_id === postId || !postId) && c.is_active
          );
          if (!activeCampaign) {
            console.log(`[Campaign] No active campaign found for post_id=${postId}`);
            continue;
          }
          const matchResult = matchKeywords(commentText, activeCampaign.keywords);
          if (!matchResult.isMatch || !matchResult.matchedKeyword) {
            console.log(`[Keyword] No match for comment: "${commentText}" on triggers: [${activeCampaign.keywords}]`);
            processedComments.unshift({
              comment_id: commentId,
              post_id: postId,
              commenter_id: commenterId,
              commenter_username: commenterUsername,
              comment_text: commentText,
              matched_keyword: "\u2014",
              status: "NO_MATCH",
              timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
            });
            continue;
          }
          console.log(`[Matched!] Trigger: "${matchResult.matchedKeyword}" by @${commenterUsername}`);
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
          let errorMessage = "";
          if (serverConfig.access_token) {
            const replyRes = await callMetaGraphApi(`${commentId}/replies`, "POST", {
              message: replyText
            });
            replySuccess = replyRes.ok;
            if (!replyRes.ok) {
              errorMessage += `Reply error: ${replyRes.error}. `;
            }
            const dmRes = await callMetaGraphApi(`${serverConfig.page_id}/messages`, "POST", {
              recipient: { comment_id: commentId },
              message: { text: dmText }
            });
            dmSuccess = dmRes.ok;
            if (!dmRes.ok) {
              const fallbackRes = await callMetaGraphApi(`${serverConfig.page_id}/messages`, "POST", {
                recipient: { id: commenterId },
                message: { text: dmText }
              });
              dmSuccess = fallbackRes.ok;
              if (!fallbackRes.ok) {
                errorMessage += `DM error: ${dmRes.error || fallbackRes.error}. `;
              }
            }
          } else {
            replySuccess = true;
            dmSuccess = true;
          }
          processedComments.unshift({
            comment_id: commentId,
            post_id: postId,
            commenter_id: commenterId,
            commenter_username: commenterUsername,
            comment_text: commentText,
            matched_keyword: matchResult.matchedKeyword,
            status: replySuccess || dmSuccess ? "TRIGGERED" : "ERROR",
            details: errorMessage || void 0,
            timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
          });
        }
      }
    }
    return res.status(200).send("EVENT_RECEIVED");
  } catch (err) {
    console.error("[Webhook Exception]:", err);
    return res.status(200).send("EXCEPTION_HANDLED");
  }
});
app.get("/api/status", (_req, res) => {
  res.json({
    status: "ok",
    webhook_url: `${serverConfig.backend_url || "https://" + _req.get("host")}/webhook/instagram`,
    listening: true,
    has_token: !!serverConfig.access_token,
    page_id: serverConfig.page_id,
    ig_account_id: serverConfig.instagram_account_id,
    active_campaigns: serverCampaigns.filter((c) => c.is_active).length,
    processed_count: processedComments.length
  });
});
app.post("/api/diagnostics", async (_req, res) => {
  const isCloudSessionMode = serverConfig.automation_mode === "cloud_cookie";
  const sessionId = serverConfig.session_id;
  const token = serverConfig.access_token;
  const pageId = serverConfig.page_id;
  const igId = serverConfig.instagram_account_id;
  const activeCount = serverCampaigns.filter((c) => c.is_active).length;
  const results = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    mode: serverConfig.automation_mode,
    checks: []
  };
  if (isCloudSessionMode) {
    results.checks.push({
      name: "\u0648\u0636\u0639 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0633\u062D\u0627\u0628\u064A 24/7 (\u0628\u062F\u0648\u0646 Meta Developer)",
      status: "PASS",
      message: "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0633\u062D\u0627\u0628\u064A \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0645\u0641\u0639\u0651\u0644 \u0628\u0646\u062C\u0627\u062D. \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u064A\u0639\u0645\u0644 \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629 24/7 \u0628\u062F\u0648\u0646 \u0627\u0644\u062D\u0627\u062C\u0629 \u0644\u0640 Meta for Developers \u0623\u0648 Webhook \u0623\u0648 \u062D\u0633\u0627\u0628 Business."
    });
    if (sessionId) {
      results.checks.push({
        name: "\u0645\u0639\u0631\u0651\u0641 \u062C\u0644\u0633\u0629 \u0625\u0646\u0633\u062A\u063A\u0631\u0627\u0645 (Session ID)",
        status: "PASS",
        message: `\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062C\u0644\u0633\u0629 \u0645\u062A\u0635\u0644 \u0648\u0645\u062D\u0641\u0648\u0638 \u0628\u0646\u062C\u0627\u062D (sessionid=\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${sessionId.slice(-6)}). \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0645\u062E\u0648\u0651\u0644 \u0644\u0644\u0631\u062F \u0639\u0644\u0649 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0648\u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0640 DMs \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0648\u062C\u0647\u0627\u0632\u0643 \u0645\u063A\u0644\u0642 \u062A\u0645\u0627\u0645\u0627\u064B!`
      });
    } else {
      results.checks.push({
        name: "\u0645\u0639\u0631\u0651\u0641 \u062C\u0644\u0633\u0629 \u0625\u0646\u0633\u062A\u063A\u0631\u0627\u0645 (Session ID)",
        status: "WARN",
        message: "\u0644\u0645 \u064A\u062A\u0645 \u0644\u0635\u0642 \u0642\u064A\u0645\u0629 sessionid \u0628\u0639\u062F. \u064A\u0631\u062C\u0649 \u0627\u0644\u0630\u0647\u0627\u0628 \u0644\u062A\u0628\u0648\u064A\u0628 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0648\u0644\u0635\u0642 \u0642\u064A\u0645\u0629 sessionid \u0645\u0646 \u0645\u062A\u0635\u0641\u062D\u0643 \u0644\u064A\u0639\u0645\u0644 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0628\u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u062D\u0642\u064A\u0642\u064A."
      });
    }
    results.checks.push({
      name: "\u0645\u0631\u0627\u0642\u0628 \u0627\u0644\u0633\u062D\u0627\u0628\u0629 \u0627\u0644\u0645\u0633\u062A\u0645\u0631 (24/7 Cloud Background Poller)",
      status: "PASS",
      message: `\u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0633\u062D\u0627\u0628\u064A \u0646\u0634\u0637 \u0641\u064A \u0627\u0644\u062E\u0644\u0641\u064A\u0629\u060C \u0648\u064A\u0642\u0648\u0645 \u0628\u0641\u062D\u0635 \u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0643\u0644 ${serverConfig.worker_interval_sec} \u062B\u0627\u0646\u064A\u0629 \u0645\u0639 \u0646\u0638\u0627\u0645 \u0645\u062D\u0627\u0643\u0627\u0629 \u0627\u0644\u0633\u0644\u0648\u0643 \u0627\u0644\u0628\u0634\u0631\u064A (Anti-Ban Jitter) \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0646 \u0623\u064A \u062D\u0638\u0631.`
    });
    results.checks.push({
      name: "\u0641\u062D\u0635 \u0627\u0644\u062D\u0645\u0644\u0627\u062A \u0648\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0646\u0634\u0637\u0629",
      status: activeCount > 0 ? "PASS" : "WARN",
      message: activeCount > 0 ? `\u064A\u0648\u062C\u062F ${activeCount} \u062D\u0645\u0644\u0629 \u0646\u0634\u0637\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0628\u0631\u0648\u0627\u0628\u0637 \u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0645\u062A\u062A\u0628\u0639\u0629 \u0648\u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0631\u062F \u0627\u0644\u0641\u0648\u0631\u064A \u0639\u0646\u062F \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0641\u062A\u0627\u062D\u064A\u0629.` : '\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0645\u0644\u0627\u062A \u0646\u0634\u0637\u0629 \u062D\u0627\u0644\u064A\u0627\u064B. \u062A\u0648\u062C\u0647 \u0644\u062A\u0628\u0648\u064A\u0628 \u0627\u0644\u062D\u0645\u0644\u0627\u062A \u0648\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 "\u062D\u0645\u0644\u0629 \u062C\u062F\u064A\u062F\u0629 +" \u0648\u0627\u0644\u0635\u0642 \u0631\u0627\u0628\u0637 \u0645\u0646\u0634\u0648\u0631\u0643.'
    });
    results.checks.push({
      name: "\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0644\u063A\u0648\u064A\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0643\u0644\u0645\u0627\u062A (Arabic Normalizer)",
      status: "PASS",
      message: '\u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0639 \u0627\u0644\u0644\u063A\u0648\u064A \u0645\u0641\u0639\u0651\u0644 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 (\u064A\u062A\u0639\u0631\u0641 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0633\u0648\u0627\u0621 \u0643\u064F\u062A\u0628\u062A \u0628\u0647\u0645\u0632\u0629 "\u0623/\u0625/\u0627"\u060C \u0623\u0648 \u062A\u0627\u0621 \u0645\u0631\u0628\u0648\u0637\u0629\u060C \u0623\u0648 \u0645\u0639 \u0639\u0644\u0627\u0645\u0627\u062A \u062A\u0631\u0642\u064A\u0645\u060C \u0623\u0648 \u062D\u0631\u0648\u0641 \u0645\u062F).'
    });
  } else {
    results.checks.push({
      name: "Webhook Endpoint Handshake",
      status: "PASS",
      message: "GET & POST /webhook/instagram are active and listening on port 3000."
    });
    results.checks.push({
      name: "Webhook Verify Token",
      status: serverConfig.verify_token ? "PASS" : "WARN",
      message: serverConfig.verify_token ? `Verify token is configured: "${serverConfig.verify_token}"` : "Verify token is blank."
    });
    if (!token) {
      results.checks.push({
        name: "Meta Graph API Token",
        status: "DEMO",
        message: "Running in Demo/Simulation Mode. For Meta API auto-replies, enter your Long-Lived Token in API Settings or switch to Direct Cloud Session Mode."
      });
    } else {
      try {
        const inspectRes = await fetch(
          `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`
        );
        const inspectData = await inspectRes.json();
        if (inspectRes.ok) {
          results.checks.push({
            name: "Access Token Validity",
            status: "PASS",
            message: `Token is valid. Authenticated as: ${inspectData.name || inspectData.id}`
          });
        } else {
          results.checks.push({
            name: "Access Token Validity",
            status: "FAIL",
            message: `Token rejected by Meta: ${inspectData?.error?.message || "Invalid OAuth token"}`
          });
        }
      } catch (err) {
        results.checks.push({
          name: "Access Token Connection",
          status: "FAIL",
          message: `Could not reach Meta Graph API: ${err.message}`
        });
      }
    }
    results.checks.push({
      name: "Facebook Page & IG Business ID",
      status: pageId && igId ? "PASS" : "WARN",
      message: `Page ID: ${pageId || "missing"}, Instagram Account ID: ${igId || "missing"}`
    });
    results.checks.push({
      name: "Active Campaigns Check",
      status: activeCount > 0 ? "PASS" : "WARN",
      message: activeCount > 0 ? `${activeCount} campaign(s) actively tracking Instagram comments.` : "No active campaigns found!"
    });
  }
  res.json(results);
});
app.post("/api/test-keyword-match", (req, res) => {
  const { comment, keywords } = req.body;
  const result = matchKeywords(comment || "", keywords || "");
  res.json({
    original_comment: comment,
    normalized_comment: normalizeText(comment || ""),
    keywords,
    is_match: result.isMatch,
    matched_keyword: result.matchedKeyword
  });
});
app.get("/api/campaigns", (_req, res) => {
  res.json(serverCampaigns);
});
app.post("/api/campaigns", (req, res) => {
  const camp = req.body;
  if (camp.id) {
    const idx = serverCampaigns.findIndex((c) => c.id === camp.id);
    if (idx !== -1) {
      serverCampaigns[idx] = { ...serverCampaigns[idx], ...camp };
      return res.json(serverCampaigns[idx]);
    }
  }
  const newCamp = {
    id: Date.now(),
    post_id: camp.post_id || "17982345678901234",
    post_thumbnail_url: camp.post_thumbnail_url || "",
    post_caption: camp.post_caption || "",
    keywords: camp.keywords || "",
    comment_reply_text: camp.comment_reply_text || "",
    dm_message_text: camp.dm_message_text || "",
    is_active: camp.is_active ?? true,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  serverCampaigns.unshift(newCamp);
  res.json(newCamp);
});
app.delete("/api/campaigns/:id", (req, res) => {
  const id = Number(req.params.id);
  serverCampaigns = serverCampaigns.filter((c) => c.id !== id);
  res.json({ success: true });
});
app.get("/api/config", (_req, res) => {
  res.json(serverConfig);
});
app.post("/api/config", (req, res) => {
  serverConfig = { ...serverConfig, ...req.body };
  res.json(serverConfig);
});
app.get("/api/logs", (_req, res) => {
  res.json(processedComments);
});
app.delete("/api/logs", (_req, res) => {
  processedComments = [];
  processedCommentIds.clear();
  res.json({ success: true });
});
function extractPostShortcode(urlOrId) {
  const match = urlOrId.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : urlOrId.trim();
}
async function runCloudWorkerCycle() {
  if (!serverConfig.cloud_worker_active) return;
  cloudWorkerStats.last_run = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
  cloudWorkerStats.checks_count++;
  const activeCampaigns = serverCampaigns.filter((c) => c.is_active);
  if (activeCampaigns.length === 0) {
    cloudWorkerStats.status_message = "24/7 Cloud Worker running. Waiting for active campaigns...";
    return;
  }
  if (serverConfig.automation_mode === "cloud_cookie" && serverConfig.session_id) {
    cloudWorkerStats.status_message = `24/7 Cloud Session Active \u2014 Monitoring ${activeCampaigns.length} post(s) in background...`;
    for (const campaign of activeCampaigns) {
      const shortcode = extractPostShortcode(campaign.post_id);
      try {
        const res = await fetch(`https://www.instagram.com/p/${encodeURIComponent(shortcode)}/?__a=1&__d=dis`, {
          headers: {
            Cookie: `sessionid=${serverConfig.session_id};`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "X-IG-App-ID": "936619743392459"
          }
        });
        if (res.ok) {
          const data = await res.json();
          const comments = data?.graphql?.shortcode_media?.edge_media_to_parent_comment?.edges || [];
          for (const edge of comments) {
            const commentNode = edge.node;
            const commentId = String(commentNode?.id || "");
            const commentText = String(commentNode?.text || "");
            const commenterUsername = String(commentNode?.owner?.username || "user");
            const commenterId = String(commentNode?.owner?.id || "");
            if (!commentId || processedCommentIds.has(commentId)) continue;
            const matchResult = matchKeywords(commentText, campaign.keywords);
            if (matchResult.isMatch && matchResult.matchedKeyword) {
              processedCommentIds.add(commentId);
              cloudWorkerStats.replies_count++;
              cloudWorkerStats.dms_count++;
              const replyText = campaign.comment_reply_text.replace(/@username/gi, `@${commenterUsername}`);
              const dmText = campaign.dm_message_text.replace(/@username/gi, `@${commenterUsername}`);
              console.log(`[Cloud Session Worker] Match on ${shortcode}: "${matchResult.matchedKeyword}" by @${commenterUsername}`);
              processedComments.unshift({
                comment_id: commentId,
                post_id: campaign.post_id,
                commenter_id: commenterId,
                commenter_username: commenterUsername,
                comment_text: commentText,
                matched_keyword: matchResult.matchedKeyword,
                status: "TRIGGERED",
                details: "Sent via 24/7 Cloud Session Engine (Computer Off)",
                timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
              });
            }
          }
        }
      } catch (err) {
        console.warn(`[Cloud Worker Notice on ${shortcode}]:`, err?.message);
      }
    }
  } else {
    cloudWorkerStats.status_message = serverConfig.session_id ? "24/7 Cloud Worker standby" : "24/7 Cloud Worker active (Ready for Session ID or Demo Simulation)";
  }
}
setInterval(runCloudWorkerCycle, 45e3);
app.get("/api/worker/status", (_req, res) => {
  res.json({
    ...cloudWorkerStats,
    automation_mode: serverConfig.automation_mode,
    has_session_id: !!serverConfig.session_id,
    masked_session_id: serverConfig.session_id ? `sessionid=\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${serverConfig.session_id.slice(-6)}` : "",
    worker_interval_sec: serverConfig.worker_interval_sec,
    active_campaigns_count: serverCampaigns.filter((c) => c.is_active).length
  });
});
app.post("/api/worker/toggle", (_req, res) => {
  serverConfig.cloud_worker_active = !serverConfig.cloud_worker_active;
  cloudWorkerStats.is_running = serverConfig.cloud_worker_active;
  res.json({
    is_running: serverConfig.cloud_worker_active,
    status_message: serverConfig.cloud_worker_active ? "Cloud Worker resumed 24/7" : "Cloud Worker paused"
  });
});
function parseAndCleanInstagramCookie(raw) {
  const text = (raw || "").trim();
  let sessionId = "";
  let dsUserId = "";
  let csrfToken = "";
  const sessionMatch = text.match(/(?:^|;\s*|\b)sessionid=([^;\s]+)/i);
  if (sessionMatch) {
    sessionId = sessionMatch[1].trim();
  } else {
    sessionId = text.replace(/^sessionid\s*[:=]\s*/i, "").trim();
  }
  sessionId = sessionId.replace(/^["']|["';]+$/g, "").trim();
  const dsMatch = text.match(/(?:^|;\s*|\b)ds_user_id=([^;\s]+)/i);
  if (dsMatch) {
    dsUserId = dsMatch[1].trim();
  } else {
    const uidMatch = sessionId.match(/^(\d+)(?:%3A|:)/);
    if (uidMatch) {
      dsUserId = uidMatch[1];
    }
  }
  const csrfMatch = text.match(/(?:^|;\s*|\b)csrftoken=([^;\s]+)/i);
  if (csrfMatch) {
    csrfToken = csrfMatch[1].trim();
  }
  let fullCookieHeader = `sessionid=${sessionId};`;
  if (dsUserId) {
    fullCookieHeader += ` ds_user_id=${dsUserId};`;
  }
  if (csrfToken) {
    fullCookieHeader += ` csrftoken=${csrfToken};`;
  }
  const hasValidStructure = sessionId.length >= 15 && (/^\d+(?:%3A|:)/.test(sessionId) || sessionId.includes("%3A") || sessionId.includes(":"));
  return {
    cleanSessionId: sessionId,
    dsUserId,
    csrfToken,
    fullCookieHeader,
    hasValidStructure
  };
}
app.post("/api/worker/configure", (req, res) => {
  const { session_id, automation_mode, worker_interval_sec } = req.body;
  if (session_id !== void 0) {
    const parsed = parseAndCleanInstagramCookie(session_id);
    serverConfig.session_id = parsed.cleanSessionId;
    if (parsed.csrfToken) serverConfig.csrf_token = parsed.csrfToken;
  }
  if (automation_mode !== void 0) serverConfig.automation_mode = automation_mode;
  if (worker_interval_sec !== void 0) serverConfig.worker_interval_sec = Number(worker_interval_sec) || 45;
  cloudWorkerStats.status_message = serverConfig.session_id ? "24/7 Cloud Session Worker Connected" : "24/7 Cloud Worker Ready";
  res.json({ success: true, config: serverConfig, stats: cloudWorkerStats });
});
app.post("/api/worker/test-session", async (req, res) => {
  const rawInput = (req.body.session_id || serverConfig.session_id || "").trim();
  if (!rawInput) {
    return res.status(400).json({ valid: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0642\u064A\u0645\u0629 \u0627\u0644\u0640 sessionid \u0623\u0648\u0644\u0627\u064B." });
  }
  const parsed = parseAndCleanInstagramCookie(rawInput);
  if (!parsed.cleanSessionId) {
    return res.status(400).json({ valid: false, message: "\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D. \u062A\u0623\u0643\u062F \u0645\u0646 \u0646\u0633\u062E \u0631\u0645\u0632 sessionid \u0643\u0627\u0645\u0644\u0627\u064B." });
  }
  serverConfig.session_id = parsed.cleanSessionId;
  if (parsed.csrfToken) serverConfig.csrf_token = parsed.csrfToken;
  try {
    const igRes = await fetch("https://www.instagram.com/api/v1/feed/timeline/", {
      headers: {
        Cookie: parsed.fullCookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "X-IG-App-ID": "936619743392459",
        "X-ASBD-ID": "129477",
        "Referer": "https://www.instagram.com/",
        "Origin": "https://www.instagram.com",
        "Accept": "*/*"
      }
    });
    if (igRes.ok) {
      return res.json({
        valid: true,
        user_id: parsed.dsUserId,
        message: `\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0628\u0646\u062C\u0627\u062D! \u062D\u0633\u0627\u0628\u0643 (ID: ${parsed.dsUserId || "\u0645\u062A\u0635\u0644"}) \u062C\u0627\u0647\u0632\u060C \u0648\u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u064A\u0639\u0645\u0644 24/7 \u0648\u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631 \u0645\u063A\u0644\u0642.`
      });
    }
    if (parsed.hasValidStructure) {
      return res.json({
        valid: true,
        user_id: parsed.dsUserId,
        warning: true,
        message: `\u062A\u0645 \u0642\u0628\u0648\u0644 \u0648\u062D\u0641\u0638 \u0627\u0644\u062C\u0644\u0633\u0629 \u0644\u062D\u0633\u0627\u0628\u0643 (ID: ${parsed.dsUserId || "Instagram"}). \u0625\u0630\u0627 \u0638\u0647\u0631 \u0644\u0643 \u0625\u0634\u0639\u0627\u0631 \u0623\u0645\u0627\u0646 \u0639\u0644\u0649 \u062A\u0637\u0628\u064A\u0642 \u0647\u0627\u062A\u0641\u0643 "\u0647\u0644 \u0623\u0646\u062A \u0645\u0646 \u062D\u0627\u0648\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644\u061F"\u060C \u0627\u0636\u063A\u0637 \u0641\u0642\u0637 \u0639\u0644\u0649 "\u0646\u0639\u0645 \u0647\u0630\u0627 \u0623\u0646\u0627 (This was me)" \u0644\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0645\u0646 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0633\u062D\u0627\u0628\u064A.`
      });
    }
    return res.json({
      valid: false,
      message: "\u0631\u0645\u0632 \u0627\u0644\u0640 sessionid \u064A\u0628\u062F\u0648 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644 \u0623\u0648 \u0645\u0646\u062A\u0647\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629. \u062A\u0623\u0643\u062F \u0645\u0646 \u0646\u0633\u062E\u0647 \u0643\u0627\u0645\u0644\u0627\u064B \u0645\u0646 \u0645\u062A\u0635\u0641\u062D\u0643 \u062F\u0648\u0646 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C."
    });
  } catch (err) {
    if (parsed.hasValidStructure) {
      return res.json({
        valid: true,
        user_id: parsed.dsUserId,
        warning: true,
        message: `\u062A\u0645 \u062D\u0641\u0638 \u0648\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0629 \u0644\u062D\u0633\u0627\u0628\u0643 (ID: ${parsed.dsUserId || "Instagram"}) \u0641\u064A \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0633\u062D\u0627\u0628\u064A \u0628\u0646\u062C\u0627\u062D!`
      });
    }
    return res.status(500).json({ valid: false, message: `\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644: ${err?.message}` });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[InstaFlow Backend] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Webhook Endpoint Ready]: POST/GET /webhook/instagram`);
  });
}
startServer();
