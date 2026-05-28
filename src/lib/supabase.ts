import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  logo_url: string;
  description: string;
  ceo_name: string;
  ceo_description: string;
  seo_title: string;
  seo_description: string;
  seo_keywords?: string;
  og_image_url?: string;
  canonical_url?: string;
  target_region?: string;
  content: string;
  published_at?: string;
  link: string;
}

export interface AppConfig {
  id: string;
  name: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image_url?: string;
  canonical_url?: string;
  target_region?: string;
  category: string;
  version: string;
  file_size: string;
  developer: string;
  icon_url: string;
  screenshots: string[];
  encrypted_download_url: string;
  description_html: string;
  red_box_msg: string;
  yellow_box_msg: string;
  idea_box_msg: string;
  safety_status: 'Verified' | 'Caution' | 'Unsafe';
  serial_number: number;
  is_featured: boolean;
  is_new: boolean;
  release_notes: string;
  rating: number;
  created_at: string;
  custom_admin_box_html?: string;
  custom_admin_box_heading?: string;
  faqs?: {question: string; answer: string}[];
}

export interface Review {
  id: string;
  app_id: string;
  username: string;
  rating: number;
  comment: string;
  is_approved: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  cover_url: string;
  published_at: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  target_region?: string;
}

export interface NewsUpdate {
  id: string;
  title: string;
  content_html: string;
  category: string;
  published_at: string;
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

const savedApps = typeof window !== 'undefined' ? localStorage.getItem('rummystore_apps') : null;
export const mockApps: AppConfig[] = savedApps ? (() => {
  try { return JSON.parse(savedApps); } catch { return []; }
})() : [
  {
    id: 'game1',
    name: 'Subway Surfers',
    slug: 'subway-surfers',
    category: 'Games, Action',
    version: '3.10.0',
    file_size: '150 MB',
    developer: 'SYBO Games',
    icon_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    ],
    encrypted_download_url: 'U2FsdGVkX19xxxxxx',
    description_html: '<p>Dash as fast as you can. Dodge the oncoming trains.</p>',
    red_box_msg: '',
    yellow_box_msg: '',
    idea_box_msg: '',
    safety_status: 'Verified',
    serial_number: 1,
    is_new: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '1',
    name: 'Instagram SafeMod',
    slug: 'instagram-safemod',
    category: 'Social',
    version: '2.4.1',
    file_size: '45.2 MB',
    developer: 'Meta Privacy Team',
    icon_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
    ],
    encrypted_download_url: 'U2FsdGVkX19xxxxxx',
    description_html: '<p>A privacy-focused version of Instagram that restricts tracking and excessive permissions.</p>',
    red_box_msg: '',
    yellow_box_msg: '',
    idea_box_msg: 'Always ensure your device permissions are set to strictly necessary.',
    safety_status: 'Verified',
    serial_number: 1,
    is_featured: true,
    is_new: true,
    release_notes: '* Fixed tracking bugs.\n* Enhanced encryption layer.',
    rating: 4.8,
    created_at: '2026-05-11T10:00:00Z'
  },
  {
    id: '2',
    name: 'Suspicious Messaging App',
    slug: 'suspicious-msg',
    category: 'Communication',
    version: '1.0',
    file_size: '12 MB',
    developer: 'Unknown',
    icon_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=128&h=128&fit=crop',
    screenshots: [],
    encrypted_download_url: '',
    description_html: '<p>This app requests unnecessary permissions like contact lists and precise location.</p>',
    red_box_msg: 'Do NOT install without a sandbox.',
    yellow_box_msg: 'Rejected by safety moderators.',
    idea_box_msg: '',
    safety_status: 'Unsafe',
    serial_number: 2,
    is_featured: false,
    is_new: false,
    release_notes: '',
    rating: 1.2,
    created_at: '2026-04-10T10:00:00Z'
  }
];

export const saveMockApps = (apps: AppConfig[]) => {
  localStorage.setItem('rummystore_apps', JSON.stringify(apps));
  mockApps.splice(0, mockApps.length, ...apps);
};

const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('rummystore_settings') : null;
export const mockSettings: GlobalSettings = savedSettings ? ((): GlobalSettings => {
  try { return JSON.parse(savedSettings); } catch { return {} as GlobalSettings; }
})() : {
  site_title: 'RUMMY STORE. Virtual Coins & E-Sports Store',
  meta_description: 'The premier e-sports gaming review platform. Play and discover top rummy games with virtual coins. No real money involved, completely free sign up.',
  logo_url: '',
  favicon_url: '',
  helpline_whatsapp: '+1234567890',
  helpline_telegram: '@rummystore',
  support_email: 'support@rummystore.com',
  disclaimer_text: 'Rummy Store is an e-sports gaming review platform. We use virtual money (coins) provided free upon sign up. We do not provide or endorse any real money gaming. No financial deposits or withdrawals are involved.',
  disclaimer_heading: 'NO REAL MONEY GAMING DISCLAIMER',
  ethics_discrimination_text: 'We are committed to providing equal access to safe and free virtual gaming applications.',
  ethics_heading: 'ETHICS & PLATFORM POLICY',
  portal_heading: 'Virtual e-Sports <br/><span class="text-red-600">Review Portal</span>',
  important_notice_heading: 'VIRTUAL COINS ONLY',
  ticker_text: 'WELCOME TO RUMMY STORE • Enjoy free e-sports gaming reviews • Virtual coins only - No real money involved • Join our Telegram for updates •',
  animations_enabled: true,
  seo_keywords: 'rummy store, e-sports review, virtual rummy games, free rummy coins, safe gaming, no real money',
  about_content: '<p>Rummy Store is built with a single mission: to provide a transparent and secure environment for discovering the best e-sports gaming applications.</p><p>We strongly oppose real money gaming. Our platform operates entirely on virtual coins that users receive free of cost upon sign-up. There are no monetary transactions, deposits, or financial risks involved.</p>',
  contact_content: '<p>Have questions or feedback about our virtual gaming reviews? We\'d love to hear from you. Our team typically responds within 24-48 hours.</p>',
  privacy_content: '<h2>1. Information We Collect</h2><p>We collect basic information required for account creation to grant virtual coins. No payment or financial information is ever collected or requested.</p>',
  terms_content: '<h2>1. Virtual Currency Only</h2><p>By accessing Rummy Store, you acknowledge that all gaming reviews and applications listed operate purely on virtual currency. We do not facilitate any real-world financial rewards or transactions.</p>',
  responsibility_content: '<p>Our website is dedicated to maintaining the highest standards of gaming transparency. We take our responsibility seriously to ensure that every application featured strictly adheres to our "No Real Money" policy.</p><p>Users can enjoy our e-sports reviews and gameplay with complete peace of mind, knowing there is zero financial risk.</p>',
  important_notice: 'Please note: Rummy Store is purely for entertainment and review purposes. All games use virtual coins only.',
  categories: ['All Apps', 'Categories', 'Top Charts', 'Games', 'Tools'],
  secure_index_title: 'Secure Index',
  secure_index_subtitle: 'Verified E-Sports Gaming Reviews',
  banners: [
    { id: "1", title: "Virtual Rummy Pro", subtitle: "Top rated free virtual card game of the week", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80", link: "/" },
    { id: "2", title: "E-Sports Card Tournaments", subtitle: "Play with virtual coins & learn strategy", image: "https://images.unsplash.com/photo-1606167668511-22c64ee0fce6?auto=format&fit=crop&q=80&w=800", link: "/" },
    { id: "3", title: "No Real Money Allowed", subtitle: "100% Free Virtual Coin Gaming", image: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&q=80&w=800", link: "/" }
  ]
};

export const saveMockSettings = (settings: GlobalSettings) => {
  localStorage.setItem('rummystore_settings', JSON.stringify(settings));
  Object.assign(mockSettings, settings);
};

const savedNews = typeof window !== 'undefined' ? localStorage.getItem('rummystore_news') : null;
export const mockNews: NewsItem[] = savedNews ? (() => {
  try { return JSON.parse(savedNews); } catch { return []; }
})() : [
  {
    id: '1',
    slug: 'tech-innovations-2026',
    title: 'Technology Innovations in 2026',
    logo_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80',
    description: 'A deep dive into the most exciting technical leaps of this year.',
    ceo_name: 'Elena Vance',
    ceo_description: 'An experienced technical leader with 10+ years of building secure systems.',
    seo_title: 'Tech Innovations 2026 - Latest News',
    seo_description: 'Read the latest updates about tech innovations in 2026.',
    content: 'A comprehensive guide to digital transformations this year...',
    published_at: new Date().toISOString(),
    link: 'https://example.com/news/1'
  }
];

export const saveMockNews = (newsList: NewsItem[]) => {
  localStorage.setItem('rummystore_news', JSON.stringify(newsList));
  mockNews.splice(0, mockNews.length, ...newsList);
};

const savedBlogs = typeof window !== 'undefined' ? localStorage.getItem('rummystore_blogs') : null;
export const mockBlogs: BlogPost[] = savedBlogs ? (() => {
  try { return JSON.parse(savedBlogs); } catch { return []; }
})() : [
  {
    id: '1',
    slug: 'future-mobile-security',
    title: 'The Future of Mobile Security',
    content: 'As mobile devices become central to our lives, securing them is more important than ever...',
    author: 'Admin Team',
    cover_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
    published_at: new Date().toISOString(),
    seo_title: 'Future of Mobile Security - Blog',
    seo_description: 'Exploring the upcoming trends in mobile device protection.',
    seo_keywords: 'mobile security, privacy, encryption, 2026 tech'
  }
];

export const saveMockBlogs = (blogs: BlogPost[]) => {
  localStorage.setItem('rummystore_blogs', JSON.stringify(blogs));
  mockBlogs.splice(0, mockBlogs.length, ...blogs);
};

const savedVideos = typeof window !== 'undefined' ? localStorage.getItem('rummystore_videos') : null;
export const mockVideos: VideoItem[] = savedVideos ? (() => {
  try { return JSON.parse(savedVideos); } catch { return []; }
})() : [
  {
    id: '1',
    slug: 'intro-video',
    title: 'Intro to RUMMY STORE',
    description: 'A brief introduction to the RUMMY STORE platform and its virtual gaming offerings.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    seo_title: 'RUMMY STORE Introduction Video',
    seo_description: 'Watch the RUMMY STORE introduction video.',
    created_at: new Date().toISOString()
  }
];

export const saveMockVideos = (videos: VideoItem[]) => {
  localStorage.setItem('rummystore_videos', JSON.stringify(videos));
  mockVideos.splice(0, mockVideos.length, ...videos);
};
