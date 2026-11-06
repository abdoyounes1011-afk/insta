export type Language = 'ar' | 'en';

export interface Campaign {
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

export interface ProcessedComment {
  comment_id: string;
  post_id: string;
  commenter_id: string;
  commenter_username: string;
  comment_text: string;
  matched_keyword: string;
  status: 'TRIGGERED' | 'DUPLICATE_BLOCKED' | 'NO_MATCH';
  timestamp: string;
}

export interface Config {
  access_token: string;
  page_id: string;
  instagram_account_id: string;
  verify_token: string;
  backend_url: string;
}

export interface Metrics {
  replies_sent: number;
  dms_sent: number;
  duplicates_blocked: number;
}

export interface SimThreadComment {
  comment_id: string;
  username: string;
  text: string;
  time: string;
  reply: string | null;
}

export interface SimDM {
  id: string;
  recipient_username: string;
  comment_id: string;
  text: string;
  time: string;
}

export interface PresetPost {
  id: string;
  media_type: 'REELS' | 'CAROUSEL_ALBUM' | 'VIDEO' | 'IMAGE';
  thumbnail_url: string;
  caption: string;
  caption_ar?: string;
  permalink: string;
}

export interface PipelineStepState {
  step: number;
  status: 'idle' | 'pending' | 'success' | 'warning' | 'danger';
  title: string;
  description: string;
  badge: string;
}

export type TabKey = 'campaigns' | 'simulator' | 'logs' | 'settings' | 'guide';
