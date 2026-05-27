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

const savedApps = localStorage.getItem('yonostore_apps');
export const mockApps: AppConfig[] = savedApps ? (() => {
  const parsed = JSON.parse(savedApps);
  const defaultApps = [
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
    }
  ];
  // Merge missing items
  defaultApps.forEach(defApp => {
    if (!parsed.find((a: any) => a.id === defApp.id)) {
      parsed.push(defApp);
    }
  });
  return parsed;
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
  localStorage.setItem('yonostore_apps', JSON.stringify(apps));
  mockApps.splice(0, mockApps.length, ...apps);
};

const savedSettings = localStorage.getItem('yonostore_settings');
export const mockSettings: GlobalSettings = savedSettings ? JSON.parse(savedSettings) : {
  site_title: 'YonoStore',
  meta_description: 'The definitive transparency app store for privacy-conscious users.',
  logo_url: '',
  favicon_url: '',
  helpline_whatsapp: '+1234567890',
  helpline_telegram: '@yonostore',
  support_email: 'support@yonostore.com',
  disclaimer_text: 'YonoStore provides transparency reviews. Download applications at your own risk. We strictly verify safety, but you remain responsible for your device security.',
  disclaimer_heading: 'PLATFORM DISCLAIMER',
  ethics_discrimination_text: 'We are committed to providing equal access to safe applications without discrimination.',
  ethics_heading: 'ETHICS & DISCRIMINATION',
  portal_heading: 'Transparency <br/><span class="text-red-600">Review Portal</span>',
  important_notice_heading: 'IMPORTANT NOTICE',
  ticker_text: 'LIVE: Instagram SafeMod updated to v2.4.1 • All apps verified by the Transparency Team • Join our Telegram for updates •',
  animations_enabled: true,
  seo_keywords: 'app store, safe apps, secure download, verified apps, yonostore, app privacy',
  about_content: '<p>SafeApp Store was founded with a single mission: to provide a transparent and secure environment for discovering and downloading mobile applications.</p><p>In an era where privacy is often compromised, we take a different approach. Every application on our platform undergoes a rigorous manual review process.</p>',
  contact_content: '<p>Have questions or feedback? We\'d love to hear from you. Our team typically responds within 24-48 hours.</p>',
  privacy_content: '<h2>1. Information We Collect</h2><p>We collect information to provide better services to all our users. The types of information we collect include usage data and device info.</p>',
  terms_content: '<h2>1. Acceptance of Terms</h2><p>By accessing and using this application, you agree to be bound by these Terms and Conditions.</p>',
  responsibility_content: '<p>Our website is dedicated to maintaining the highest standards of transparency and user safety. We take our responsibility seriously to ensure that every application listed on our platform is thoroughly vetted.</p><p>Users are also encouraged to take responsibility for their own device security and data privacy.</p>',
  important_notice: 'Please note: Download apps at your own risk. We verify safety, but you are responsible for your device security.',
  categories: ['All Apps', 'Categories', 'Top Charts', 'Games', 'Tools'],
  secure_index_title: 'Secure Index',
  secure_index_subtitle: 'Verified & Transparent App Marketplace',
  banners: [
    { id: "1", title: "Hot Deals: 50% Off", subtitle: "Limited time offer on subscriptions", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80", link: "/" },
    { id: "2", title: "Top Games Collection", subtitle: "Experience gaming like never before", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80", link: "/" },
    { id: "3", title: "Flipkart Big Billion Days", subtitle: "Shop apps with exclusive rewards", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80", link: "/" }
  ]
};

export const saveMockSettings = (settings: GlobalSettings) => {
  localStorage.setItem('yonostore_settings', JSON.stringify(settings));
  Object.assign(mockSettings, settings);
};

const savedNews = localStorage.getItem('yonostore_news');
export const mockNews: NewsItem[] = savedNews ? JSON.parse(savedNews) : [
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
  localStorage.setItem('yonostore_news', JSON.stringify(newsList));
  mockNews.splice(0, mockNews.length, ...newsList);
};

const savedBlogs = localStorage.getItem('yonostore_blogs');
export const mockBlogs: BlogPost[] = savedBlogs ? JSON.parse(savedBlogs) : [
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
  localStorage.setItem('yonostore_blogs', JSON.stringify(blogs));
  mockBlogs.splice(0, mockBlogs.length, ...blogs);
};

const savedVideos = localStorage.getItem('yonostore_videos');
export const mockVideos: VideoItem[] = savedVideos ? JSON.parse(savedVideos) : [
  {
    id: '1',
    slug: 'intro-video',
    title: 'Intro to YonoStore',
    description: 'A brief introduction to the YonoStore platform and its offerings.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    seo_title: 'YonoStore Introduction Video',
    seo_description: 'Watch the YonoStore introduction video.',
    created_at: new Date().toISOString()
  }
];

export const saveMockVideos = (videos: VideoItem[]) => {
  localStorage.setItem('yonostore_videos', JSON.stringify(videos));
  mockVideos.splice(0, mockVideos.length, ...videos);
};
