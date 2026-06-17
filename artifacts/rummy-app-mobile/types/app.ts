export interface AppConfig {
  id: string;
  name: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  category: string;
  is_coming_soon?: boolean;
  publish_date?: string;
  version: string;
  file_size: string;
  developer: string;
  icon_url: string;
  screenshots: string[];
  description_html: string;
  red_box_msg: string;
  yellow_box_msg: string;
  idea_box_msg: string;
  safety_status: "Verified" | "Caution" | "Unsafe";
  serial_number: number;
  is_featured: boolean;
  is_new: boolean;
  release_notes: string;
  rating: number;
  created_at: string;
  features_html?: string;
  faqs?: { question: string; answer: string }[];
  link_configured?: boolean;
}

export interface GlobalSettings {
  site_title: string;
  meta_description?: string;
  logo_url?: string;
  favicon_url?: string;
  helpline_whatsapp?: string;
  helpline_telegram?: string;
  support_email?: string;
  disclaimer_text?: string;
  ticker_text?: string;
  categories?: string[];
}
