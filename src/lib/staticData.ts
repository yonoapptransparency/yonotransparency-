import { secureStorage } from './secureStorage';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export interface GlobalSettings {
  site_title: string;
  meta_description: string;
  logo_url: string;
  favicon_url: string;
  helpline_whatsapp: string;
  helpline_telegram: string;
  support_email: string;
  disclaimer_text: string;
  disclaimer_heading?: string;
  ethics_discrimination_text: string;
  ethics_heading?: string;
  portal_heading?: string;
  important_notice_heading?: string;
  ticker_text: string;
  animations_enabled: boolean;
  seo_keywords?: string;
  about_content?: string;
  contact_content?: string;
  privacy_content?: string;
  terms_content?: string;
  responsibility_content?: string;
  important_notice?: string;
  categories: string[];
  banners: Banner[];
  last_updated?: string;
  secure_index_title?: string;
  secure_index_subtitle?: string;
  trending_searches?: string[];
  hero_title_text?: string;
  hero_title_color?: string;
  hero_title_style?: string;
  hero_title_animation?: string;
  hero_title_subtitle?: string;
  hero_title_visible?: boolean;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  logo_url: string;
  description: string;
  description_html: string;
  date: string;
  author: string;
  read_time: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  seo_keywords?: string;
  ceo_name?: string;
  ceo_description?: string;
  og_image_url?: string;
  canonical_url?: string;
  target_region?: string;
  content?: string;
  link?: string;
  published_at?: string;
}

export interface AppConfig {
  id: string;
  name: string;
  developer: string;
  slug: string;
  version: string;
  file_size: string;
  icon_url: string;
  og_image_url?: string;
  canonical_url?: string;
  category: string;
  is_coming_soon?: boolean;
  publish_date?: string;
  description_html: string;
  custom_admin_box_html?: string;
  custom_admin_box_heading?: string;
  red_box_msg?: string;
  yellow_box_msg?: string;
  idea_box_msg?: string;
  rating: number;
  is_verified?: boolean;
  safety_status?: 'Verified' | 'Caution' | 'Unsafe';
  is_featured?: boolean;
  is_new?: boolean;
  release_notes?: string;
  screenshots: string[];
  target_region?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  faqs?: { question: string; answer: string }[];
  created_at: string;
  more_information_url?: string;
  serial_number?: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  description_html: string;
  thumbnail_url: string;
  author: string;
  publish_date: string;
  seo_title: string;
  seo_description: string;
  seo_keywords?: string;
  read_time: string;
  tags: string[];
  created_at: string;
  published_at: string;
  content?: string;
  cover_url?: string;
  canonical_url?: string;
  target_region?: string;
}

export interface VideoItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  youtube_url: string;
  seo_title: string;
  seo_description: string;
  seo_keywords?: string;
  created_at: string;
}

// All defaults explicitly empty strings and arrays
export const mockApps: AppConfig[] = [];
export const mockSettings: GlobalSettings = {
  site_title: "",
  meta_description: "",
  logo_url: "",
  favicon_url: "",
  helpline_whatsapp: "",
  helpline_telegram: "",
  support_email: "",
  disclaimer_text: "",
  ethics_discrimination_text: "",
  ticker_text: "",
  animations_enabled: true,
  categories: [],
  banners: []
};
export const mockNews: NewsItem[] = [];
export const mockBlogs: BlogPost[] = [];
export const mockVideos: VideoItem[] = [];
