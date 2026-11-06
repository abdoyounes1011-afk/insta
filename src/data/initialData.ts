import { Campaign, Config, Metrics, PresetPost, ProcessedComment, SimDM, SimThreadComment } from '../types';

export const PRESET_IG_POSTS: Record<string, PresetPost> = {
  '17982345678901234': {
    id: '17982345678901234',
    media_type: 'REELS',
    thumbnail_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&q=80',
    caption: "🚀 Want my complete 2026 AI Automation Blueprint + 15 workflows? Comment 'GUIDE' or 'LINK' below and I'll DM it to you right now!",
    caption_ar: '🚀 هل تريد دليل أتمتة الذكاء الاصطناعي الكامل لعام 2026؟ اكتب "دليل" أو "GUIDE" أو "رابط" في التعليقات وسأرسله لك على الخاص فوراً!',
    permalink: 'https://www.instagram.com/reel/C8aiBlueprint/'
  },
  '18045678901234567': {
    id: '18045678901234567',
    media_type: 'CAROUSEL_ALBUM',
    thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
    caption: "💻 Built a full-stack SaaS starter kit. Drop 'SAAS' or 'CODE' in the comments and my bot will send the GitHub repo to your DMs!",
    caption_ar: '💻 أطلقت قالب برمجيات متكامل (SaaS Starter). اكتب "كود" أو "SAAS" في التعليقات وسيصلك رابط المشروع على الخاص!',
    permalink: 'https://www.instagram.com/p/C9saasTemplate/'
  },
  '18199887766554433': {
    id: '18199887766554433',
    media_type: 'VIDEO',
    thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
    caption: "🔥 Flash 40% VIP Discount on our Creator Bootcamp! Comment 'VIP' or 'PRICE' below to get your private checkout link in DMs.",
    caption_ar: '🔥 خصم فوري 40% VIP على معسكر صناع المحتوى! اكتب "VIP" أو "سعر" بالتعليقات لتحصل على كوبون الخصم في رسائلك الخاصة.',
    permalink: 'https://www.instagram.com/reel/C9vipDrop/'
  }
};

export const DEFAULT_CONFIG: Config = {
  access_token: '',
  page_id: '104928374651928',
  instagram_account_id: '17841405309211844',
  verify_token: 'my_secure_custom_verify_token_2026',
  backend_url: ''
};

export const DEFAULT_METRICS: Metrics = {
  replies_sent: 14,
  dms_sent: 14,
  duplicates_blocked: 3
};

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    post_id: '17982345678901234',
    post_thumbnail_url: PRESET_IG_POSTS['17982345678901234'].thumbnail_url,
    post_caption: "🚀 Want my complete 2026 AI Automation Blueprint + 15 workflows? Comment 'GUIDE' or 'LINK' below and I'll DM it to you right now!",
    keywords: 'guide, link, blueprint, ai, دليل, رابط',
    comment_reply_text: 'تم إرسال دليل أتمتة الذكاء الاصطناعي إلى رسائلك الخاصة يا @username! 🚀 تفقد صندوق طلبات المراسلة الآن.',
    dm_message_text: 'أهلاً بك @username! 👋 شكراً على تعليقك. إليك رابط الوصول الفوري لدليل الأتمتة لعام 2026: https://instaflow.dev/ai-blueprint',
    is_active: true,
    created_at: '2026-10-29T10:15:00Z'
  },
  {
    id: 2,
    post_id: '18045678901234567',
    post_thumbnail_url: PRESET_IG_POSTS['18045678901234567'].thumbnail_url,
    post_caption: "💻 Built a full-stack SaaS starter kit. Drop 'SAAS' or 'CODE' in the comments and my bot will send the GitHub repo to your DMs!",
    keywords: 'saas, code, repo, template, كود, ساس',
    comment_reply_text: 'تفقد رسائلك الخاصة @username! أرسلت لك رابط المستودع البرمجي الآن 💻✨',
    dm_message_text: 'يسعدني تواصلك @username! إليك رابط مشروع SaaS الذي طلبته: https://github.com/instaflow/saas-starter',
    is_active: true,
    created_at: '2026-10-30T14:20:00Z'
  }
];

export const DEFAULT_PROCESSED_COMMENTS: ProcessedComment[] = [
  {
    comment_id: '17990011223344550',
    post_id: '17982345678901234',
    commenter_id: '178900112233',
    commenter_username: 'sarah_creates',
    comment_text: 'محتوى رائع جداً! ممكن ترسل لي الـ GUIDE 🔥',
    matched_keyword: 'guide',
    status: 'TRIGGERED',
    timestamp: '2026-11-01 17:45:12'
  },
  {
    comment_id: '17990011223344550',
    post_id: '17982345678901234',
    commenter_id: '178900112233',
    commenter_username: 'sarah_creates',
    comment_text: 'محتوى رائع جداً! ممكن ترسل لي الـ GUIDE 🔥',
    matched_keyword: 'guide',
    status: 'DUPLICATE_BLOCKED',
    timestamp: '2026-11-01 17:45:15'
  }
];

export const DEFAULT_SIM_THREADS: Record<string, SimThreadComment[]> = {
  '17982345678901234': [
    {
      comment_id: '17990011223344550',
      username: 'sarah_creates',
      text: 'محتوى رائع جداً! ممكن ترسل لي الـ GUIDE 🔥',
      time: '12m',
      reply: 'تم إرسال دليل أتمتة الذكاء الاصطناعي إلى رسائلك الخاصة يا @sarah_creates! 🚀 تفقد صندوق طلبات المراسلة الآن.'
    }
  ],
  '18045678901234567': [
    {
      comment_id: '17990099887766554',
      username: 'omar.builds',
      text: 'ممكن رابط الـ SAAS لو سمحت؟',
      time: '28m',
      reply: 'تفقد رسائلك الخاصة @omar.builds! أرسلت لك رابط المستودع البرمجي الآن 💻✨'
    }
  ]
};

export const DEFAULT_SIM_DMS: SimDM[] = [
  {
    id: 'dm_1',
    recipient_username: 'sarah_creates',
    comment_id: '17990011223344550',
    text: 'أهلاً بك @sarah_creates! 👋 شكراً على تعليقك. إليك رابط الوصول الفوري لدليل الأتمتة لعام 2026: https://instaflow.dev/ai-blueprint',
    time: '12m ago'
  }
];

export interface SetupStep {
  key: string;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  code?: string;
}

export const SETUP_GUIDE_STEPS: SetupStep[] = [
  {
    key: 'step1',
    title_en: '1. Convert Instagram Account to Professional (Business / Creator)',
    title_ar: '1. تحويل حساب انستغرام إلى حساب احترافي (Business أو Creator)',
    desc_en: 'Open the Instagram mobile app → Settings and privacy → Account type and tools → Switch to professional account and link it to a Facebook Page you manage.',
    desc_ar: 'افتح تطبيق انستغرام على هاتفك ← الإعدادات والخصوصية ← نوع الحساب والأدوات ← التحويل إلى حساب احترافي (Business أو Creator) وربطه بصفحة فيسبوك تديرها.'
  },
  {
    key: 'step2',
    title_en: '2. Create a Meta for Developers App',
    title_ar: '2. إنشاء تطبيق في منصة مطوري ميتا (Facebook Developers)',
    desc_en: "Visit developers.facebook.com → My Apps → Create App → Choose 'Business' type. Copy your App Secret from App Settings → Basic as FACEBOOK_APP_SECRET.",
    desc_ar: 'توجه إلى developers.facebook.com ← تطبيقاتي (My Apps) ← إنشاء تطبيق (Create App) ← اختر نوع "Business". انسخ مفتاح التطبيق السري (App Secret) لاستخدامه للتحقق من التوقيع الرقمي.'
  },
  {
    key: 'step3',
    title_en: '3. Add Instagram Graph API & Webhooks Products',
    title_ar: '3. إضافة منتجات Instagram Graph API و Webhooks',
    desc_en: "In your Meta App Dashboard sidebar, click 'Add Product' and set up both 'Instagram Graph API' and 'Webhooks'.",
    desc_ar: 'من القائمة الجانبية في لوحة تحكم مطوري ميتا، اضغط على "إضافة منتج" وفعّل كلاً من "Instagram Graph API" و"Webhooks".'
  },
  {
    key: 'step4',
    title_en: '4. Configure Required Graph API Permissions',
    title_ar: '4. تفعيل أذونات واجهة برمجة التطبيقات المطلوبة (Graph API Permissions)',
    desc_en: 'In Graph API Explorer, request: instagram_basic, instagram_manage_comments, instagram_manage_messages, pages_show_list, and pages_manage_metadata.',
    desc_ar: 'في مستكشف Graph API أو إعدادات التطبيق، اطلب الأذونات: instagram_basic، و instagram_manage_comments، و instagram_manage_messages، و pages_show_list، و pages_manage_metadata.'
  },
  {
    key: 'step5',
    title_en: '5. Generate & Refresh a 60-Day Long-Lived Access Token',
    title_ar: '5. استخراج وتجديد مفتاح وصول طويل الأجل (Long-Lived Token 60 Days)',
    desc_en: 'Exchange your short-lived token for a 60-day token, and refresh it before expiry:',
    desc_ar: 'قم بتبديل مفتاح الوصول المؤقت بمفتاح طويل الأجل صالح لمدة 60 يوماً عبر الأمر التالي:',
    code: `curl -G "https://graph.facebook.com/v21.0/oauth/access_token" \\
  --data-urlencode "grant_type=fb_exchange_token" \\
  --data-urlencode "client_id=YOUR_APP_ID" \\
  --data-urlencode "client_secret=YOUR_APP_SECRET" \\
  --data-urlencode "fb_exchange_token=SHORT_LIVED_TOKEN"`
  },
  {
    key: 'step6',
    title_en: '6. Subscribe Webhook to POST /webhook/instagram',
    title_ar: '6. تسجيل رابط الـ Webhook مع اشتراك حقل التعليقات (comments)',
    desc_en: "In Meta Dashboard → Webhooks → Select 'Instagram', set Callback URL to https://your-domain.com/webhook/instagram, enter your WEBHOOK_VERIFY_TOKEN, and subscribe to the 'comments' field.",
    desc_ar: 'في لوحة Meta ← Webhooks ← اختر "Instagram"، واكتب رابط الاستدعاء (Callback URL): https://your-domain.com/webhook/instagram وضع Verify Token واشترك في حدث "comments".'
  },
  {
    key: 'step7',
    title_en: '7. Fetch Instagram Post IDs via Graph API Explorer',
    title_ar: '7. جلب معرّفات المنشورات (Post IDs) عبر استعلام Graph API',
    desc_en: 'Query your Instagram Business Account media endpoint to copy the numeric Post ID for any Reel or post:',
    desc_ar: 'استعلم عن وسائط حسابك الاحترافي للحصول على الـ Post ID لأي ريلز أو منشور لتتبعه:',
    code: `GET https://graph.facebook.com/v21.0/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/media?fields=id,caption,media_type,thumbnail_url,permalink`
  }
];
