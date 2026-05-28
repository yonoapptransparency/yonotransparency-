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

export const mockApps: AppConfig[] = [
  {
    "is_featured": false,
    "faqs": [],
    "name": "YONO RUMMY",
    "serial_number": 1,
    "canonical_url": "",
    "screenshots": [],
    "id": "tahynyt00",
    "seo_description": "Yono Rummy is a platform focused on online rummy information, gameplay insights, user experience, bonus updates, and transparent customer feedback. Rummy is recognized as a skill-based game in India, making it popular among players who enjoy strategy, quick thinking, and smart decision-making. Explore detailed guides, smooth interface experience, trusted reviews, secure platform information, and the latest updates related to rummy entertainment in one place. Designed with a clean and user-friendly experience for Indian users who enjoy skill-focused online gaming.",
    "slug": "yono-rummy",
    "developer": "Yono ",
    "og_image_url": "https://res.cloudinary.com/dq34n0ncz/image/upload/f_auto,q_auto/1000086624_zufwo6",
    "yellow_box_msg": " \"Disclaimer: Any financial transactions or data usage occur directly within the third-party app. Our website is not responsible for any issues related to external app performance.\"",
    "category": "All App, Yono",
    "idea_box_msg": "\"Transparency First: Our ratings are based on aggregated user feedback to help you make informed decisions. We prioritize your clarity over app promotion.\"",
    "custom_admin_box_html": "",
    "release_notes": "*Improved UI responsiveness, optimized loading speeds, and enhanced security protocols for a smoother gaming experience.",
    "is_new": false,
    "description_html": "",
    "custom_admin_box_heading": "\"Our Commitment to You: Independent Review & Analysis\"",
    "icon_url": "https://res.cloudinary.com/dq34n0ncz/image/upload/f_auto,q_auto/1000086624_zufwo6",
    "target_region": "India (Tier 1 & Tier 2 Search Optimization)",
    "safety_status": "Unsafe",
    "seo_title": "YONO RUMMY",
    "version": "2.5V",
    "seo_keywords": " yono rummy, yono rummy game, yono rummy online, yono rummy india, yono rummy platform, yono rummy review, yono rummy gameplay, yono rummy app experience, yono rummy bonus, yono rummy card game, yono rummy skill game, yono rummy entertainment, yono rummy updates, yono rummy user reviews, yono rummy secure platform",
    "created_at": "2026-05-15T09:41:53.521Z",
    "red_box_msg": "\"Important Notice: This website is an independent information platform. We are not the developer of this application and cannot guarantee its performance or security.\"",
    "file_size": "45MB",
    "encrypted_download_url": "https://yonorummy017.com/?code=VIPKUM7BRZR&t=1779200519",
    "rating": 4
  },
  {
    "custom_admin_box_html": "",
    "idea_box_msg": "Tip: Use our rating system to compare app performance and stability before you decide to download",
    "is_new": false,
    "release_notes": "Performance Optimization: Cleaned up code structure for faster app response times.\nReliability Updates: Addressed minor stability issues reported by the community to ensure a smoother experience.\nFeature Refinements: Enhanced navigation tools to make finding information and app ratings easier.\nSecurity Patch: Updated internal protocols to better protect user privacy and data integrity.",
    "custom_admin_box_heading": "Spin Crush is a mobile gaming application that is part of the broader \"Yono Games\" ecosystem (which includes related apps like Yono Rummy, Yono Slots, and Yono VIP). It is primarily designed for Android devices and offers a collection of casual, puzzle, and casino-style \"spin\" games.",
    "icon_url": "https://res.cloudinary.com/dq34n0ncz/image/upload/f_auto,q_auto/1000119573_wzwse4",
    "description_html": "",
    "seo_title": "Spin Crush Review 2026 – User Reviews, Gameplay Analysis, Skill-Based Gaming & Platform Insights",
    "safety_status": "Unsafe",
    "target_region": "India, South Asia",
    "seo_keywords": "spin crush special, spin crush review, spin crush game, spin crush platform, spin crush analysis, spin crush user reviews, skill based gaming, gameplay insights, responsible gaming, gaming transparency, spin crush experience, platform analysis, card gaming platform, user experience, mobile gaming insights, online gaming india, gaming awareness, transparent reviews",
    "version": "1.0",
    "rating": 5,
    "file_size": "45",
    "encrypted_download_url": "https://bkfadsegtgs.safelyearnmillionsbysharingonepersonaqfxzqyj8.com/?code=ADE32PAX9UM&t=  1779194369",
    "red_box_msg": "This is a real-money gaming app. Financial risk is involved. We are an independent review site and are not responsible for any financial loss.\"",
    "created_at": "2026-05-19T12:43:59.040Z",
    "name": "SPIN CRUSH ",
    "faqs": [
      {
        "question": "",
        "answer": ""
      }
    ],
    "is_featured": false,
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 2,
    "id": "q82dbbwh4",
    "developer": "Bingo ",
    "slug": "spin-crush-",
    "seo_description": "Spin Crush Special is a platform focused on transparent gameplay insights, user reviews, platform analysis, and responsible gaming awareness. Explore skill-based gaming experiences, interface performance, user feedback, gameplay features, and detailed platform insights designed to help users make informed decisions with confidence.",
    "og_image_url": "https://res.cloudinary.com/dq34n0ncz/image/upload/f_auto,q_auto/1000119573_wzwse4",
    "category": "All App, Yono",
    "yellow_box_msg": "Game responsibly. Your security and your budget are under your control. Use this app only for entertainment, never as a source of income."
  },
  {
    "description_html": "",
    "custom_admin_box_heading": "Our Commitment to You: Independent Review & Analysis\"",
    "icon_url": "https://13eehe59cj.ucarecd.net/67a16d31-6771-4617-b88b-288db51d321d/-/preview/554x554/",
    "idea_box_msg": "Transparency First: Our ratings are based on aggregated user feedback to help you make informed decisions. We prioritize your clarity over app promotion",
    "custom_admin_box_html": "",
    "release_notes": "Improved UI responsiveness, optimized loading speeds, and enhanced security protocols for a smoother gaming experience.",
    "is_new": false,
    "encrypted_download_url": "https://yonoarcadeapk16.com/?code=N34SQ1Q94VM&t=1779216410",
    "file_size": "Unknown",
    "rating": 5,
    "red_box_msg": "\"Important Notice: This website is an independent information platform. We are not the developer of this application and cannot guarantee its performance or security ",
    "created_at": "2026-05-19T19:04:26.373Z",
    "safety_status": "Caution",
    "target_region": "India",
    "seo_title": "Yono Arcade App: All Games List, Review & Best Promo Codes",
    "seo_keywords": "yono arcade, yono arcade apk, yono arcade download, yono arcade app, yono arcade game list, yono arcade login, yono arcade signup bonus, yono arcade real or fake, yono arcade review, yono arcade customer care number, yono arcade safe or not, download yono arcade latest version, best rummy apps, money earning gaming apps, yono arcade promo code, yono arcade withdrawal proof, yono slots, cash gaming apps india",
    "version": "1.0",
    "id": "31og4l26i",
    "developer": "Admin",
    "seo_description": "Yono Arcade is a platform focused on gameplay insights, user reviews, skill-based gaming experiences, and responsible gaming awareness. Explore transparent platform analysis, mobile gaming performance, user experience feedback, and strategic gameplay information designed to help users make informed decisions.",
    "slug": "yono-arcade",
    "name": "YONO ARCADE",
    "is_featured": false,
    "faqs": [
      {
        "answer": "Answer: Yono Arcade is a popular multi-game mobile application in India that brings together a large collection of casual, card, and slot games under a single app dashboard. Users can play games like Rummy, Teen Patti, Ludo, and various arcade slots to compete for real cash prizes",
        "question": "1. What is Yono Arcade?"
      },
      {
        "question": "2. How can I download the latest Yono Arcade APK safely?",
        "answer": "Answer: To ensure security, always download the verified APK from trusted informational sources or the official Yono ecosystem links. Avoid downloading from unverified third-party blogs to prevent malware or fake versions from entering your device."
      },
      {
        "question": "3. Is Yono Arcade a safe and legal app to play in India?",
        "answer": "Answer: Yono Arcade features skill-based games like Rummy and Teen Patti, which are legally permissible in most Indian states. However, because it involves real-money transactions, players must be 18+ and should check their state regulations, as real-money gaming is restricted in regions like Assam, Telangana, and Odisha."
      },
      {
        "question": "4. Why is my Yono Arcade account frozen or deposit showing pending?",
        "answer": "Answer: Deposits or accounts generally face restrictions due to network glitches, incomplete KYC verification, or a violation of fair-play policies (such as creating multiple accounts on the same device). Always ensure a stable internet connection before initiating a transaction."
      },
      {
        "question": "5. Does Yonoinfo own or run Yono Arcade?",
        "answer": "Answer: No. Yonoinfo is an independent review, testing, and informational platform. We do not own, develop, or operate Yono Arcade. Our goal is strictly to provide unbiased reviews, safety audits, and transparent download links to help players make informed decisions before putting their money into any application"
      },
      {
        "question": "6. Is Yono Arcade real or fake? How does Yonoinfo verify it?",
        "answer": "Answer: Yono Arcade is a real, functioning application with live cash games. However, to keep you safe, the Yonoinfo team runs rigorous tests on the app, checking the APK file for hidden malware, reviewing user withdrawal success rates, and assessing player feedback. We flag any potential risks right here on our site so you don't lose your money to fraud."
      },
      {
        "answer": "Answer: Many third-party blogs distribute modified, outdated, or corrupted APK files that can steal your personal data or freeze your device. Yonoinfo ensures transparency by hosting only verified, secure, and clean download links directly from the original source files, alongside honest warnings about the risks involved.",
        "question": "7. Why should I download Yono Arcade through Yonoinfo instead of other sites?"
      },
      {
        "question": "8. What should I do if I face a withdrawal issue with Yono Arcade?",
        "answer": "Answer: Since Yonoinfo is an independent review portal, we cannot directly access your game wallet or speed up your payouts. If your withdrawal is stuck, we recommend checking the app's internal \"Support\" chat or emailing their official helpline with your Game UID and the specific UTR transaction number from your bank."
      },
      {
        "question": "9. Does Yonoinfo encourage real-money gaming or betting?",
        "answer": "Answer: Not at all. We believe in complete transparency and responsible gaming. Real-money apps involve significant financial risk. Our reviews are meant to analyze the technical and functional safety of the app. We strongly advise all players to treat these games strictly as entertainment, set strict budgets, and never gamble with money they cannot afford to lose."
      }
    ],
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 3,
    "yellow_box_msg": "Disclaimer: Any financial transactions or data usage occur directly within the third-party app. Our website is not responsible for any issues related to external app performance.\"",
    "category": "All App, Yono",
    "og_image_url": ""
  },
  {
    "custom_admin_box_heading": "📋 Technical Specifications & App Overview",
    "icon_url": "https://res.cloudinary.com/dyigysy26/image/upload/f_auto,q_auto/1000119609_fkc9fm",
    "description_html": "",
    "custom_admin_box_html": "",
    "idea_box_msg": "💡 PRO TIP: When installing the app for the first time, make sure to link your mobile number immediately using the OTP verification process. Many players make the mistake of playing as a \"Guest\" account, which can cause you to lose your welcome bonus chips and any initial winnings if the app accidentally closes or clears its cache.",
    "release_notes": "Performance Boost: Optimized core code for faster game loading times and zero lag during intense matches.\nUI Enhancement: Refreshed user interface for smoother navigation across the gaming dashboard.\nBug Fixes: Resolved sudden app crashes and minor login issues reported in previous builds.\nSecurity Check: Fully audited and verified APK file structure to ensure malware-free installation.",
    "is_new": true,
    "rating": 5,
    "file_size": "Unknown",
    "encrypted_download_url": "https://jaiho91app.com/?code=VZLHHLUXWDH&t=1779218266",
    "created_at": "2026-05-19T19:23:07.133Z",
    "red_box_msg": "🛑 SAFETY NOTICE: Under local state regulations in India, playing real-money apps is legally restricted in regions including Assam, Telangana, Odisha, Andhra Pradesh, Sikkim, and Nagaland. If you reside in these states, please do not download the APK or deposit cash. Verify your local regulations before participating.",
    "seo_title": "Jaiho 91 App - New Games List, Promo Codes & Withdrawal Proof",
    "target_region": "India",
    "safety_status": "Caution",
    "seo_keywords": "jaiho 91, jaiho 91 apk, jaiho 91 download, jaiho 91 app, jaiho 91 login, jaiho 91 signup bonus, jaiho 91 review, jaiho 91 real or fake, jaiho 91 customer care number, jaiho 91 safe or not, download jaiho 91 latest version, jaiho 91 promo code, jaiho 91 withdrawal proof, new rummy apps, money earning games 2026, online cash gaming apps, yonoinfo app reviews",
    "version": "1.0",
    "id": "s5u553ymi",
    "developer": "Admin",
    "slug": "jaiho-91",
    "seo_description": "Download the latest Jaiho 91 APK securely! Claim your official signup bonus, explore the new games list, and read our independent safety review today.",
    "name": "JAIHO 91",
    "faqs": [
      {
        "question": "1. What is Jaiho 91 and how does it work?",
        "answer": "Answer: Jaiho 91 is a real-money gaming application that features a variety of casual, prediction, and traditional Indian card games on a single platform. Players register an account, navigate the multi-game dashboard, and compete against other real players online to earn cash rewards."
      },
      {
        "question": "2. How can I download the verified Jaiho 91 APK safely?",
        "answer": "Answer: To protect your mobile device from malware or tampered software, you should always access the official, unmodified Jaiho 91 APK package. Avoid installing files from random social media channels or unverified blogs. Yonoinfo provides direct links to the official, tested source files for maximum technical safety."
      },
      {
        "answer": "Answer: Jaiho 91 is a functional real-money gaming application with active gameplay rooms and live transaction processing systems. However, because it is a relatively new software platform in the market, the Yonoinfo team continuously tracks its withdrawal fulfillment rates and security certificates to keep our readers updated on its overall reliability.",
        "question": "3. Is Jaiho 91 a real or fake application?"
      },
      {
        "question": "4. How do I claim the official Jaiho 91 Signup Bonus?",
        "answer": "Answer: New players can secure the welcome bonus chips by downloading the official application and completing their profile registration. Once you link your active mobile number and complete the standard OTP verification process, the promotional bonus cash will be credited directly to your in-game wallet balance."
      },
      {
        "answer": "Answer: The application updates its catalog frequently, featuring popular categories such as:\nPrediction Formats: Color prediction and high-speed matching modules.\nClassic Card Games: Point Rummy, Pool Rummy, and Teen Patti variations.\nArcade/Slots: High-engagement casual games, crash games, and themed virtual slot machines.",
        "question": "5. What games are packed inside the Jaiho 91 app?"
      },
      {
        "question": "6. Can players from all Indian states legally join Jaiho 91?",
        "answer": "Answer: No. While skill-based card gaming is permitted in many regions, several states enforce strict prohibitions on all cash-stakes gaming networks. Residents living in Assam, Telangana, Odisha, Andhra Pradesh, Sikkim, Nagaland, Arunachal Pradesh, and Tamil Nadu are legally restricted from downloading the APK or participating in real-money rooms."
      },
      {
        "question": "7. What is Yonoinfo and why do you review apps like Jaiho 91?",
        "answer": "Answer: Yonoinfo is an independent informational directory and technical review platform. We do not host or develop games. Our mission is to test, audit, and analyze popular mobile applications in India—especially real-money gaming apps—to give users an honest breakdown of their security, withdrawal reliability, and hidden operational risks before they choose to download them."
      },
      {
        "answer": "Answer: The internet is flooded with fake download links and heavily biased reviews that hide the financial dangers of gaming apps just to get signups. At Yonoinfo, we believe players deserve absolute transparency. We openly share the technical integrity of the APK files, document genuine player feedback, and highlight the financial risks so you can make highly informed, safe decisions.",
        "question": "8. Why does Yonoinfo emphasize \"Transparency\" so much in these reviews?"
      },
      {
        "answer": "Answer: No. Yonoinfo maintains a strict corporate firewall and operates with 100% independence. We have zero business partnerships, shared investments, or commercial integrations with the developers of Jaiho 91. Because we are completely unaligned, we can freely expose app glitches, withdrawal delays, or safety concerns without any outside censorship.",
        "question": "9. Does Yonoinfo receive money or commissions from Jaiho 91?"
      },
      {
        "answer": "Answer: No, we cannot. Because we are an independent review platform and have no access to Jaiho 91's backend database, our team has no administrative power over their software. We cannot reverse transactions or modify account statuses. We strongly advise using the direct link to the verified APK files provided here to avoid security issues, and to play with strict, responsible budgets.",
        "question": "10. Can Yonoinfo help me recover lost money or unfreeze my Jaiho 91 account?"
      }
    ],
    "is_featured": false,
    "screenshots": [],
    "serial_number": 3,
    "canonical_url": "",
    "category": "All App, Yono",
    "yellow_box_msg": "💡 NOTICE: Yonoinfo is a 100% independent review and informational portal. We have no official partnership, affiliation, or business association with this application or its developers. The links provided point to official, unmodified source files strictly for educational and testing purposes.",
    "og_image_url": ""
  },
  {
    "custom_admin_box_html": "",
    "idea_box_msg": "Track Version Stability: Before checking out any application's metrics, compare your device's operating system build against our listed Release Notes. If you are on an older Android version, certain UI elements or patch updates might load differently.",
    "release_notes": "Engine & Stability Fixes: Resolved sudden application crash loops observed during high-traffic multiplayer lobby matching.\nUI Asset Patching: Fixed graphical layering bugs where card numbers and bingo grid overlays sometimes misaligned on smaller mobile screens (specifically 16:9 aspect ratio aspect ratios).\nConnectivity Fix: Patched network timeout issues that triggered random disconnection errors on slow or fluctuating 3G/4G networks.\nAudio Synchronization: Corrected a sound delay glitch where caller announcements did not match the visual number highlights on screen.",
    "is_new": false,
    "custom_admin_box_heading": "DETAILED SPECIFICATIONS & ARCHITECTURAL METRICS",
    "icon_url": "https://13eehe59cj.ucarecd.net/d3f6486a-b216-4582-b15d-0c735ff6b08f/-/preview/554x554/",
    "description_html": "",
    "seo_title": "Bingo 101 Honest Review & Safety Analysis | Yonoinfo",
    "target_region": "North & West India: Uttar Pradesh, Bihar, Maharashtra, Rajasthan, Punjab, Haryana, and Delhi NCR. East & Central India: West Bengal, Jharkhand, and Madhya Pradesh.",
    "safety_status": "Caution",
    "version": "1.0",
    "seo_keywords": "bingo 101 review, bingo 101 honest review, bingo 101 app analysis, is bingo 101 safe, bingo 101 safety disclosures, independent bingo 101 review, unbiased bingo 101 rating, bingo 101 app insights, bingo 101 performance metrics, yonoinfo bingo 101, bingo 101 informational guide, bingo 101 risk analytics, is bingo 101 real or fake, bingo 101 game analysis, bingo 101 review portal, transparent app evaluations, independent software analytics",
    "red_box_msg": "REGIONAL GEOGRAPHIC RESTRICTIONS: Participation and app access guidelines vary strictly by territory. Real-money gaming and associated casual apps are highly restricted or prohibited under state laws in regions including Assam, Telangana, Nagaland, Sikkim, Andhra Pradesh, Tamil Nadu, and Karnataka. If you reside in any of these states, please exit this review immediately and ensure compliance with your local laws.",
    "created_at": "2026-05-20T03:09:33.880Z",
    "rating": 5,
    "file_size": "Unknown",
    "encrypted_download_url": "https://bingo101i.com/?code=6YFLVGJJR1Q&t=1779246431",
    "faqs": [],
    "is_featured": false,
    "name": "BINGO 101",
    "canonical_url": "",
    "serial_number": 5,
    "screenshots": [],
    "id": "awus3qajs",
    "slug": "bingo-101",
    "seo_description": "Get the honest truth about Bingo 101. Yonoinfo provides independent reviews, objective app metrics, and transparent safety disclosures without bias",
    "developer": "Admin",
    "og_image_url": "https://13eehe59cj.ucarecd.net/d3f6486a-b216-4582-b15d-0c735ff6b08f/-/preview/554x554/",
    "category": "All App, Yono",
    "yellow_box_msg": "INDEPENDENT VERIFICATION: The performance metrics, UI testing logs, and feature notes detailed below are based strictly on our independent editorial observation of the latest Bingo 101 version. We maintain no affiliation with the application developers"
  },
  {
    "canonical_url": "",
    "serial_number": 6,
    "screenshots": [],
    "faqs": [
      {
        "question": "1. What is Ok Rummy and how does the game system operate?",
        "answer": "Answer: Ok Rummy is a mobile gaming client that aggregates classic Indian card matching variants, primarily 13-Card Points Rummy, Pool Rummy, and Deal Rummy. Players join digital lobbies, compete against real online opponents by creating valid sequences and sets, and secure reward points based on skill rules."
      },
      {
        "answer": "Answer: Yes, playing card games like Rummy for real stakes is constitutionally legal in the majority of Indian states. The Supreme Court of India has established that Rummy is predominantly a \"game of skill\" rather than a game of chance, meaning it is protected under Article 19(1)(g) as a valid business activity and is exempt from central anti-gambling statutes. ",
        "question": "2. Is playing Ok Rummy legal in India?"
      },
      {
        "question": "3. What states explicitly prohibit or ban Ok Rummy real-stakes lobbies?",
        "answer": "Answer: While central law protects skill games, individual state regulations vary. Due to localized legal bans and strict enforcement, residents of the following states are completely blocked from playing real-money matches or adding funds:  \nRestricted Territories: Andhra Pradesh, Arunachal Pradesh, Assam, Nagaland, Odisha, Sikkim, Tamil Nadu, and Telangana."
      },
      {
        "question": "4. What is Yonoinfo and what is its role?",
        "answer": "Answer: Yonoinfo is an autonomous, independent mobile application directory and technical review database. We do not design apps, run gaming software, or handle lobby matchmaking. Our team tests popular third-party APK packages to deliver unbiased security audits, download files, and withdrawal speed verifications for consumer awareness."
      },
      {
        "answer": "Answer: The online space is filled with deceptive, sponsored marketing materials that omit the risks of real-money gaming apps to secure quick referral signups. Yonoinfo enforces an absolute transparency policy—freely highlighting application bugs, withdrawal delays, legal state restrictions, and capital risks—so players have access to data that is objective and balanced.",
        "question": "5. Why does Yonoinfo emphasize \"Transparency FAQs\" and strict disclaimers?"
      },
      {
        "answer": "Answer: The core Ok Rummy app package file is safe and free from security vulnerabilities when obtained through the original source paths. Because the file is distributed as an independent Android APK outside mainstream storefronts, your device may display a standard \"Unknown Sources\" alert. Yonoinfo analyzes and hosts only unedited, signed source files to ensure a clean setup.",
        "question": "6. Is the Ok Rummy APK package safe to install on Android?"
      },
      {
        "answer": "Answer: No. Yonoinfo operates behind a strict corporate firewall and maintains zero commercial partnerships, shared assets, or operational ties with the management of Ok Rummy. This unaligned status ensures our technical reviews and reliability grades remain independent and uninfluenced by outside developers.",
        "question": "7. Does Yonoinfo receive payment or maintain partnerships with Ok Rummy?"
      },
      {
        "question": "8. What are the minimum withdrawal limits and processing times?",
        "answer": "Answer: Payout thresholds generally initiate between ₹100 and ₹200 depending on the current platform version. Under stable banking hours, automated payment paths process cashouts directly to your linked UPI handle or IMPS account within 5 to 30 minutes. However, heavy bank traffic or network maintenance can push settlements into a temporary verification delay of 24 to 72 hours."
      },
      {
        "question": "9. Can Yonoinfo help resolve pending withdrawals or account freezes?",
        "answer": "Answer: No, we cannot. Because Yonoinfo is entirely independent and has no administrative rights or database access to the Ok Rummy server infrastructure, we cannot modify player files or reverse transactions. If a transaction goes pending or your account faces a freeze, you must open the app's internal live customer service desk and supply your Game UID and bank UTR numbers."
      },
      {
        "answer": "Answer: Access to the real-stakes tournament pools is restricted by two strict criteria:\nAge Requirement: Users must be a minimum age of 18 or older to register.\nGeographic Location: Players must reside outside the legally restricted Indian states listed above.\nNote: Real-money gaming carries financial risk; participants are strongly urged to establish strict limits and treat it strictly as a form of casual recreation.",
        "question": "10. Who is legally permitted to download and play on Ok Rummy?"
      }
    ],
    "is_featured": false,
    "name": "OK RUMMY",
    "slug": "ok-rummy",
    "seo_description": "Is Ok Rummy safe to play? Read the unbiased Yonoinfo audit. Get verified Ok Rummy APK download links, withdrawal speed checks, and signup bonus details.",
    "developer": "Admin",
    "id": "0uiuuhdrj",
    "og_image_url": "https://13eehe59cj.ucarecd.net/97512d34-f561-4ede-8517-2112440079eb/-/preview/554x554/",
    "category": "All App, Yono",
    "yellow_box_msg": "NOTICE: Yonoinfo is an entirely autonomous review, testing, and informational portal. We hold no official corporate ties, partnership alignment, or commercial backing from Ok Rummy or its operational management. The installation packages provided link directly to official, unedited source files strictly for testing and educational evaluations.",
    "release_notes": "Gameplay Optimization: Refined core client engine for faster 13-card table matchmaking and zero latency drops during active rounds.\nInterface Fluidity: Enhanced visual responsiveness across the primary lobby dashboard for seamless game mode switching.\nBug Resolutions: Fixed minor background runtime crashes and intermittent profile load errors reported in previous versions.\nSecurity Verification: Package structure thoroughly audited by Yonoinfo to guarantee an unmodified, malware-free installation file.",
    "is_new": false,
    "custom_admin_box_html": "",
    "idea_box_msg": "💡 PRO TIP: When initiating your first session on Ok Rummy, prioritize linking your permanent mobile credentials via the internal OTP verification path immediately. Avoid playing extensively on a temporary \"Guest Profile,\" as clearing your mobile web cache, losing connection, or updating the application can permanently erase your unwithdrawn winnings and welcome chips.",
    "icon_url": "https://13eehe59cj.ucarecd.net/97512d34-f561-4ede-8517-2112440079eb/-/preview/554x554/",
    "custom_admin_box_heading": "🔍 Verified App Summary & Security Audit Details",
    "description_html": "",
    "version": "1.0",
    "seo_keywords": "ok rummy, ok rummy apk, ok rummy app download, new rummy app 2026, ok rummy real or fake, ok rummy withdrawal proof, ok rummy customer care number, best rummy app in india, ok rummy login bonus, real money rummy app, download ok rummy verified apk, yonoinfo rummy reviews",
    "seo_title": "OK RUMMY",
    "safety_status": "Caution",
    "target_region": "Indian Subcontinent (IN / South Asia Regional)",
    "red_box_msg": "⚠️ IMPORTANT DISCLAIMER: Ok Rummy is a real-money gaming application that involves a high level of financial risk. Yonoinfo is a 100% independent review platform; we are not responsible for any financial losses, transaction failures, or gameplay risks you encounter while using this third-party app. Please play responsibly and within your personal budget",
    "created_at": "2026-05-20T03:50:33.674Z",
    "rating": 5,
    "encrypted_download_url": "https://www.okrummy29.com/?code=27BLG6NREZ3&t=1779248901",
    "file_size": "Unknown"
  },
  {
    "og_image_url": "",
    "yellow_box_msg": "",
    "category": "All App, Yono",
    "is_featured": false,
    "faqs": [],
    "name": "JAIHO SLOTS",
    "serial_number": 7,
    "canonical_url": "",
    "screenshots": [],
    "id": "4yt0f4yd0",
    "seo_description": "",
    "slug": "jaiho-slots",
    "developer": "Admin",
    "target_region": "",
    "safety_status": "Verified",
    "seo_title": "JAIHO SLOTS",
    "version": "1.0",
    "seo_keywords": "",
    "red_box_msg": "",
    "created_at": "2026-05-20T03:53:24.482Z",
    "file_size": "Unknown",
    "encrypted_download_url": "https://www.jaihoslotsvip.com/?code=TAEE2EPRBTR&t=1779249059",
    "rating": 5,
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "is_new": false,
    "release_notes": "",
    "description_html": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/2dfe5d55-7896-4f96-8f2b-132190e44f6f/-/preview/540x540/",
    "custom_admin_box_heading": ""
  },
  {
    "red_box_msg": "",
    "created_at": "2026-05-20T03:56:42.075Z",
    "file_size": "Unknown",
    "encrypted_download_url": "https://www.bossrummyq.com/?code=LSHXPU9G9F6&t=1779249229",
    "rating": 5,
    "safety_status": "Verified",
    "target_region": "",
    "seo_title": "BOSS RUMMY",
    "version": "1.0",
    "seo_keywords": "",
    "description_html": "",
    "custom_admin_box_heading": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/b5e9d896-71e8-49d6-b091-a971871161e0/-/preview/1000x1000/",
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "is_new": false,
    "release_notes": "",
    "yellow_box_msg": "",
    "category": "All App",
    "og_image_url": "",
    "id": "9r044fyi0",
    "seo_description": "",
    "slug": "boss-rummy",
    "developer": "Admin",
    "is_featured": false,
    "faqs": [],
    "name": "BOSS RUMMY",
    "serial_number": 8,
    "canonical_url": "",
    "screenshots": []
  },
  {
    "is_featured": false,
    "faqs": [],
    "name": "RUMMY 91",
    "serial_number": 9,
    "canonical_url": "",
    "screenshots": [],
    "id": "5b7fj0cq7",
    "seo_description": "",
    "slug": "rummy-91",
    "developer": "Admin",
    "og_image_url": "",
    "yellow_box_msg": "",
    "category": "All App",
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "is_new": false,
    "release_notes": "",
    "description_html": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/393c07ea-4f5e-43a9-ab0c-e12dfe7d755a/-/preview/474x474/",
    "custom_admin_box_heading": "",
    "target_region": "",
    "safety_status": "Verified",
    "seo_title": "RUMMY 91",
    "version": "1.0",
    "seo_keywords": "",
    "created_at": "2026-05-20T04:01:04.611Z",
    "red_box_msg": "",
    "file_size": "Unknown",
    "encrypted_download_url": "https://www.rummy91n.bet/?code=EY7E6BUM17X&t=1779249501",
    "rating": 5
  },
  {
    "icon_url": "https://13eehe59cj.ucarecd.net/0d710f11-2c9d-4312-89de-be65ce21a4fe/-/preview/750x750/",
    "custom_admin_box_heading": "​📑 COMPLETE RISK ASSESSMENT AND REGULATORY MATRIX: ILLEGAL CASH GAMING IN INDIA ​SECTION I: STATUTORY HEADING AND LEGAL FRAMEWORKSECTION II: OPERATIONAL THREAT LEVEL (THE \"GOGO RUMMY\" & \"UONO\" CASE STUDIES)SECTION III: CRIMINAL PENALTIES & ENFORCEMENT TIMELINESSECTION IV: LITMUS TEST FOR LEGAL VS. ILLEGAL APPS",
    "description_html": "",
    "custom_admin_box_html": "",
    "idea_box_msg": "Gogo Rummy are usually not available on the official Google Play Store due to safety policies. They force you to download an unverified APK file from random websites, WhatsApp, or Telegram. Downloading these files can inject malware into your phone",
    "is_new": false,
    "release_notes": "Gogo Rummy advertise a common set of features designed to attract mobile card players. However, because these apps are unverified, third-party APK platforms operating in violation of central Indian gaming laws, it is important to separate their advertised features from the reality of how they work.",
    "created_at": "2026-05-20T06:58:27.643Z",
    "red_box_msg": "🚨 Public Warning: Illegal Real-Money Gaming & Betting Apps ​Operating, playing on, or promoting illegal real-money gambling and betting apps in India carries severe financial and legal risks.",
    "rating": 5,
    "file_size": "Unknown",
    "encrypted_download_url": "https://www.gogotop.bet/?code=V4UJ84W1V3Z&t=1779260352",
    "seo_title": "gogorummy ",
    "target_region": "India,",
    "safety_status": "Unsafe",
    "version": "1.0",
    "seo_keywords": "Gogorummy, Gogorummy app",
    "id": "ieam3hkbq",
    "slug": "gogo-rummy-",
    "seo_description": "Welcome to Yono GoGo Rummy, the most thrilling and fast-paced mobile card game designed for rummy lovers worldwide. Whether you are a casual player looking for entertainment or a skilled card strategist, Yono GoGo Rummy delivers a seamless, high-speed, and secure gaming environment directly to your smartphone",
    "developer": "Admin",
    "faqs": [
      {
        "question": "Q1: Does the app support offline gameplay?",
        "answer": "Ans: Partially. While some single-player practice modes can run without cellular data, the core multiplayer modes require a continuous internet connection. Furthermore, even \"offline\" modes typically require an initial online connection at launch to complete asset downloads and verify your application build."
      },
      {
        "answer": "​Ans: Legitimate app stores maintain strict security, regional legality, and data privacy thresholds. Apps like Gogo Rummy fail to meet these criteria because they operate outside India's centralized gaming regulations and use unverified payment/data-handling practices. Consequently, they are restricted from official platforms",
        "question": "Q2: Why is Gogo Rummy not available on the official Google Play Store or Apple App Store?"
      },
      {
        "question": "​Q3: Is downloading a third-party APK file safe for my smartphone?",
        "answer": "Ans: No, it carries significant risks. Sideloading an APK file requires you to deliberately disable your device's native security protocols (\"Install from Unknown Sources\"). Unverified APK packages are frequently modified to bundle hidden background spyware or keyloggers capable of monitoring your banking OTPs, text messages, and personal files."
      },
      {
        "answer": "Ans: Based on security audits of rogue gaming hubs, these applications demand highly invasive permissions that are entirely unnecessary for a card game. This includes tracking your exact GPS Location, scanning your Personal Contacts, accessing Local Device Storage, and monitoring device identity data.",
        "question": "​Q4: What device permissions does the app collect?"
      },
      {
        "answer": "Ans: Absolutely not. Under the central Promotion and Regulation of Online Gaming (PROG) Act, all online money games involving real-world stakes, cash entries, or monetary deposits are completely banned across India. Any app claiming to offer real cash payouts is operating entirely illegally.",
        "question": "Q5: Can I play Gogo Rummy for real money or cash rewards in India?"
      },
      {
        "question": "Q6: My cash withdrawal is frozen or \"pending\" inside the app. How can I recover it?",
        "answer": "Ans: Recovery is highly unlikely. Because these underground platforms operate outside Indian financial laws, they routinely use dummy accounts or unregulated offshore channels. When a user requests a withdrawal, the system intentionally blocks the transaction or locks the account. Because the application is illicit, players have no legal recourse or protection through Indian Consumer Courts."
      }
    ],
    "is_featured": false,
    "name": "GOGO RUMMY ",
    "serial_number": 10,
    "canonical_url": "",
    "screenshots": [],
    "category": "All App, Yono",
    "yellow_box_msg": "​💡Many fake apps use names similar to reputable platforms to trick users. Once you download these applications (often via unsafe third-party APK links)",
    "og_image_url": "https://13eehe59cj.ucarecd.net/0d710f11-2c9d-4312-89de-be65ce21a4fe/-/preview/750x750/"
  },
  {
    "seo_title": "Club INR APK Download (Latest 2026) Official App Setup — Yonoinfo",
    "target_region": "India (Tier 1 & Tier 2 Search Optimization)",
    "safety_status": "Caution",
    "seo_keywords": "club inr, club inr app review, club inr real or fake, club inr app analysis, new gaming app 2026, club inr withdrawal tracking, club inr customer care, club inr login bonus rules, real money app reviews india, club inr safety check, club inr app details, yonoinfo club inr review",
    "version": "1.0",
    "rating": 5,
    "file_size": "Unknown",
    "encrypted_download_url": "https://clubinrvip1.vip/?code=D1LX2DH3EVW&t=1779263956",
    "red_box_msg": "🚫 TERRITORIAL RESTRICTION WARNING: Multiple states within India explicitly prohibit or restrict cash-based skill gaming applications. Residents of Andhra Pradesh, Arunachal Pradesh, Assam, Nagaland, Odisha, Sikkim, Tamil Nadu, and Telangana are legally barred from real-stake pools on Club INR. Yonoinfo strongly advises cross-referencing your provincial statutes before entering any external gaming lobbies.",
    "created_at": "2026-05-20T08:02:40.971Z",
    "custom_admin_box_html": "",
    "idea_box_msg": "💡 PRO TIP: Before committing significant time or capital to any new real-money interface like Club INR, implement a \"Verification Tier\" testing rule. Test the platform's stability by interacting only with minimum-stake lobbies (such as micro card pools) to independently check system latency and withdrawal processing efficiency before engaging further.",
    "is_new": false,
    "release_notes": "Dashboard Optimization: Refined core interface data modules to ensure seamless, low-latency navigation across the casual game menu.\nPerformance Patch: Addressed background rendering issues to improve stability and prevent frame drops during long sessions.\nLogic Tuning: Corrected internal logic loops and minor interface glitches reported in earlier software builds.\nCompliance Verified: Structural behavior thoroughly monitored by Yonoinfo to evaluate data-handling standards and local stability metrics.",
    "custom_admin_box_heading": "🔍 Independent Regulatory Review & Verification Metrics",
    "icon_url": "https://13eehe59cj.ucarecd.net/3059d25d-1497-4cff-aead-68758187fe0b/-/preview/554x554/",
    "description_html": "",
    "og_image_url": "https://13eehe59cj.ucarecd.net/3059d25d-1497-4cff-aead-68758187fe0b/-/preview/554x554/",
    "category": "All App, Yono",
    "yellow_box_msg": "💡 NOTICE: Yonoinfo operates as an entirely autonomous testing, auditing, and informational registry. We do not maintain corporate partnerships, marketing alignments, or joint commercial backing from Club INR or its administrative team. This profile exists solely to supply objective consumer evaluations and data-driven security analysis.",
    "name": "CLUB INR",
    "faqs": [
      {
        "question": "1. What is Club INR and what system infrastructure does it use? ",
        "answer": "Answer: Club INR is a mobile matchmaking client and casual gaming hub optimized for Indian card game formats, primarily 13-Card Rummy variations like Points, Pool, and Deals Rummy. The platform utilizes automated lobby pairing protocols to connect real online players globally across secure virtual tables where performance relies strictly on skill metrics."
      },
      {
        "question": "2. Is utilizing the Club INR interface legally permitted in India?",
        "answer": "Answer: Yes, engaging in skill-based card matching systems for real stakes is legally protected across the vast majority of Indian states. The Supreme Court of India has consistently ruled that Rummy is primarily a \"game of skill\" rather than a game of chance. Consequently, it is classified as a legitimate business and recreational activity under Article 19(1)(g) of the Indian Constitution."
      },
      {
        "question": "3. What regional or geographic restrictions apply to Club INR players?",
        "answer": "Answer: While central legislation validates skill gaming, specific state-level statutes enforce total prohibitions. Due to regional regulatory filters, residents of the following territories are legally barred from participating in real-stake pools or deploying funds on external clients:\nRestricted States: Andhra Pradesh, Arunachal Pradesh, Assam, Nagaland, Odisha, Sikkim, Tamil Nadu, and Telangana"
      },
      {
        "question": "4. What is Yonoinfo and how does it interface with Club INR?",
        "answer": "Answer: Yonoinfo operates strictly as an autonomous, unaligned informational database and application directory. We do not design software, host gaming lobbies, manage financial transaction portals, or distribute setup packages. Our team provides empirical technical analysis, consumer safety audits, and transparency metrics regarding popular apps for educational reference."
      },
      {
        "answer": "Answer: Digital media landscapes are heavily saturated with sponsored referral marketing and biased endorsements that hide player risks to secure quick signups. Yonoinfo enforces a strict neutrality mandate—explicitly listing platform bugs, potential capital risks, structural changes, and state legal barriers—ensuring consumers can access an objective, balanced truth.",
        "question": "5. Why does Yonoinfo emphasize \"Website Transparency FAQs\"?"
      },
      {
        "answer": "Answer: No. Yonoinfo maintains an absolute corporate firewall and has zero financial alignments, joint ventures, or commercial ties with the operators or development team of Club INR. Our review profiles are generated through independent end-user benchmarking to guarantee our reliability grades remain 100% uninfluenced by external platforms.",
        "question": "6. Does Yonoinfo maintain corporate partnerships or financial ties with Club INR?"
      },
      {
        "question": "7. Does Yonoinfo provide download links or installation packages for Club INR?",
        "answer": "Answer: No, Yonoinfo does not provide direct download links, signed APK files, or configuration packages for Club INR. Our network functions solely as a technical reporting hub. Users seeking to engage with the third-party client must navigate to verified distribution networks independently, ensuring our data remains strictly informational."
      },
      {
        "answer": "Answer: Based on performance data tracking under standard banking hours, the client's automated withdrawal paths process cashouts via IMPS or verified UPI channels within 5 to 30 minutes. However, network congestion, server maintenance, or banking queue delays can trigger manual verification holds, occasionally extending transaction times up to 24 to 72 hours.",
        "question": "8. What are the typical transaction processing timelines on Club INR?"
      },
      {
        "question": "9. Can the Yonoinfo support team assist with pending withdrawals or frozen profiles?",
        "answer": "Answer: No, we cannot provide database support. Because Yonoinfo is an entirely separate informational portal, we possess zero administrative rights or server-side access to the Club INR infrastructure. If you experience stuck deposits, pending cashouts, or temporary account freezes, you must contact the application’s native customer service desk directly with your Game UID and bank UTR receipts."
      },
      {
        "question": "10. What criteria are required for responsible consumer participation?",
        "answer": "Answer: Before evaluating any external real-money interactive platform like Club INR, users must fulfill these non-negotiable protection guardrails:\nAge Status: You must be a minimum age of 18 or older to register or play.\nGeographic Compliance: You must reside outside the legally restricted Indian states listed above.\nFiscal Boundaries: Real-money gaming involves clear financial variance. All activities must be viewed strictly as casual recreation, and users should establish strict personal budget limits to prevent capital exposure."
      }
    ],
    "is_featured": false,
    "screenshots": [],
    "serial_number": 11,
    "canonical_url": "",
    "id": "5j5b7qbrw",
    "developer": "Admin",
    "slug": "club-inr",
    "seo_description": "Is Club INR safe to play? Read the independent Yonoinfo audit. Get unbiased Club INR app reviews, payout speed tracking, and real player risk assessments"
  },
  {
    "developer": "Admin",
    "slug": "abc-rummy-",
    "seo_description": "",
    "id": "f4ktp4dfi",
    "screenshots": [],
    "serial_number": 12,
    "canonical_url": "",
    "name": "ABC Rummy ",
    "faqs": [],
    "is_featured": false,
    "category": "All App",
    "yellow_box_msg": "",
    "og_image_url": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/f7108631-b74a-49e5-8abf-37cec6950f7c/-/preview/512x512/",
    "custom_admin_box_heading": "",
    "description_html": "",
    "release_notes": "",
    "is_new": false,
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "rating": 5,
    "file_size": "Unknown",
    "encrypted_download_url": "https://www.44abcrummy.com/?code=VYBJ3XBYV4T&t=1779778907",
    "created_at": "2026-05-26T07:04:36.330Z",
    "red_box_msg": "",
    "seo_keywords": "",
    "version": "1.0",
    "seo_title": "ABC Rummy ",
    "safety_status": "Unsafe",
    "target_region": ""
  },
  {
    "created_at": "2026-05-26T07:09:01.068Z",
    "red_box_msg": "",
    "rating": 5,
    "encrypted_download_url": "https://www.777game5.com/?code=KJVSYL1VRM7&t=1779779124",
    "file_size": "Unknown",
    "seo_title": "777.Rummy",
    "safety_status": "Verified",
    "target_region": "",
    "version": "1.0",
    "seo_keywords": "",
    "custom_admin_box_heading": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/fb951184-b849-4ff0-8882-a4d826508fb7/-/preview/190x190/",
    "description_html": "",
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "release_notes": "",
    "is_new": false,
    "category": "All App",
    "yellow_box_msg": "",
    "og_image_url": "",
    "id": "4w1yxs6mm",
    "slug": "777-rummy",
    "seo_description": "",
    "developer": "Admin",
    "faqs": [],
    "is_featured": false,
    "name": "777.Rummy",
    "serial_number": 13,
    "canonical_url": "",
    "screenshots": []
  },
  {
    "custom_admin_box_heading": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/74347710-3cb2-468c-98eb-5666a0af487c/-/preview/190x190/",
    "description_html": "",
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "release_notes": "",
    "is_new": false,
    "created_at": "2026-05-26T07:12:55.821Z",
    "red_box_msg": "",
    "rating": 5,
    "file_size": "Unknown",
    "encrypted_download_url": "https://EVER777A6.COM/?code=Y9AMCSS7GYB&t=1779779423",
    "seo_title": "EVER 777",
    "target_region": "",
    "safety_status": "Verified",
    "version": "1.0",
    "seo_keywords": "",
    "id": "w1sttlwv7",
    "slug": "ever-777",
    "seo_description": "",
    "developer": "Admin",
    "faqs": [],
    "is_featured": false,
    "name": "EVER 777",
    "serial_number": 14,
    "canonical_url": "",
    "screenshots": [],
    "category": "All App",
    "yellow_box_msg": "",
    "og_image_url": ""
  },
  {
    "developer": "Admin",
    "slug": "game-rummy",
    "seo_description": "",
    "id": "dp2lcn2ae",
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 15,
    "name": "Game Rummy",
    "faqs": [],
    "is_featured": false,
    "category": "All App",
    "yellow_box_msg": "",
    "og_image_url": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/4b2bd57d-9855-40a8-b452-34edee84ed09/-/preview/190x190/",
    "custom_admin_box_heading": "",
    "description_html": "",
    "release_notes": "",
    "is_new": false,
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "rating": 5,
    "encrypted_download_url": "https://gamerummy.me/?code=JXA8Q8SN2CM&t=1779779664",
    "file_size": "Unknown",
    "red_box_msg": "",
    "created_at": "2026-05-26T07:16:08.600Z",
    "seo_keywords": "",
    "version": "1.0",
    "seo_title": "Game Rummy",
    "safety_status": "Verified",
    "target_region": ""
  },
  {
    "name": "Hi Rummy ",
    "is_featured": false,
    "faqs": [],
    "screenshots": [],
    "serial_number": 16,
    "canonical_url": "",
    "id": "4lgypb90h",
    "developer": "Admin",
    "seo_description": "",
    "slug": "hi-rummy-",
    "og_image_url": "",
    "yellow_box_msg": "",
    "category": "All App",
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "is_new": false,
    "release_notes": "",
    "description_html": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/c01e9676-e748-4342-9ac7-e972030981fc/-/preview/190x190/",
    "custom_admin_box_heading": "",
    "safety_status": "Verified",
    "target_region": "",
    "seo_title": "Hi Rummy ",
    "seo_keywords": "",
    "version": "1.0",
    "encrypted_download_url": "https://hirummyrefer08.cc/?code=XL9TNBW9PQU&t=1779779809",
    "file_size": "Unknown",
    "rating": 5,
    "created_at": "2026-05-26T07:18:29.456Z",
    "red_box_msg": ""
  },
  {
    "og_image_url": "",
    "category": "Yono",
    "yellow_box_msg": "",
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 17,
    "name": "INR Rummy",
    "faqs": [],
    "is_featured": false,
    "developer": "Admin",
    "slug": "inr-rummy",
    "seo_description": "",
    "id": "2f90a87hv",
    "seo_keywords": "",
    "version": "1.0",
    "seo_title": "INR Rummy",
    "target_region": "",
    "safety_status": "Verified",
    "rating": 5,
    "encrypted_download_url": "https://inrrummy.club/?code=AGTXA3K61GJ&t=1779779957",
    "file_size": "Unknown",
    "red_box_msg": "",
    "created_at": "2026-05-26T07:21:55.085Z",
    "is_new": false,
    "release_notes": "",
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "custom_admin_box_heading": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/2a718650-0602-495f-9ca4-b13c86e58c02/-/preview/190x190/",
    "description_html": ""
  },
  {
    "og_image_url": "",
    "yellow_box_msg": "",
    "category": "All App",
    "is_featured": false,
    "faqs": [],
    "name": "JAIHO RUMMY ",
    "canonical_url": "",
    "serial_number": 18,
    "screenshots": [],
    "id": "9a05609sb",
    "seo_description": "",
    "slug": "jaiho-rummy-",
    "developer": "Admin",
    "target_region": "",
    "safety_status": "Verified",
    "seo_title": "JAIHO RUMMY ",
    "version": "1.0",
    "seo_keywords": "",
    "created_at": "2026-05-26T07:26:42.606Z",
    "red_box_msg": "",
    "encrypted_download_url": "https://jaihorummyagent.net/?code=JUR59VM573U&t=1779780342",
    "file_size": "Unknown",
    "rating": 5,
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "is_new": false,
    "release_notes": "",
    "description_html": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/c693366d-d543-4d76-84ba-3963a3f3c792/-/preview/190x190/",
    "custom_admin_box_heading": ""
  },
  {
    "custom_admin_box_heading": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/cf0b4466-3d5b-4eb5-bc88-afc9a8213ac4/-/preview/190x190/",
    "description_html": "",
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "is_new": false,
    "release_notes": "",
    "rating": 5,
    "encrypted_download_url": "https://www.loverummy11.com/?code=GQ4AN6PNC3H&t=1779780454",
    "file_size": "Unknown",
    "created_at": "2026-05-26T07:31:59.173Z",
    "red_box_msg": "",
    "seo_title": "Love Rummy",
    "safety_status": "Verified",
    "target_region": "",
    "seo_keywords": "",
    "version": "1.0",
    "id": "l7a60keix",
    "developer": "Admin",
    "slug": "love-rummy",
    "seo_description": "",
    "name": "Love Rummy",
    "faqs": [],
    "is_featured": false,
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 19,
    "category": "Yono",
    "yellow_box_msg": "",
    "og_image_url": ""
  },
  {
    "encrypted_download_url": "https://www.joyrummy7.com/?code=SXXLEFWEBG9&t=1779780760",
    "file_size": "Unknown",
    "rating": 5,
    "red_box_msg": "",
    "created_at": "2026-05-26T07:34:35.782Z",
    "seo_keywords": "",
    "version": "1.0",
    "safety_status": "Verified",
    "target_region": "",
    "seo_title": "JOY RUMMY",
    "description_html": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/e0898894-5d5b-47ab-a14f-13b4514b3b4f/-/preview/190x190/",
    "custom_admin_box_heading": "",
    "is_new": false,
    "release_notes": "",
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "yellow_box_msg": "",
    "category": "All App, Yono",
    "og_image_url": "",
    "developer": "Admin",
    "seo_description": "",
    "slug": "joy-rummy",
    "id": "4paka7kie",
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 20,
    "name": "JOY RUMMY",
    "is_featured": false,
    "faqs": []
  },
  {
    "rating": 5,
    "encrypted_download_url": "https://on-mahagames.com/?code=PD36BWN48UY&t=1779780920",
    "file_size": "Unknown",
    "red_box_msg": "",
    "created_at": "2026-05-26T07:37:07.122Z",
    "seo_keywords": "",
    "version": "1.0",
    "seo_title": "MAHA GAMES",
    "target_region": "",
    "safety_status": "Verified",
    "icon_url": "https://13eehe59cj.ucarecd.net/2d664adc-3e1f-4317-805c-dea453f52389/-/preview/190x190/",
    "custom_admin_box_heading": "",
    "description_html": "",
    "release_notes": "",
    "is_new": false,
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "category": "All App",
    "yellow_box_msg": "",
    "og_image_url": "",
    "developer": "Admin",
    "slug": "maha-games",
    "seo_description": "",
    "id": "2768ohu2a",
    "screenshots": [],
    "serial_number": 21,
    "canonical_url": "",
    "name": "MAHA GAMES",
    "faqs": [],
    "is_featured": false
  },
  {
    "is_featured": false,
    "faqs": [],
    "name": "Rummy Lodo",
    "canonical_url": "",
    "serial_number": 22,
    "screenshots": [],
    "id": "us5xuk5bm",
    "seo_description": "",
    "slug": "rummy-lodo",
    "developer": "Admin",
    "og_image_url": "",
    "yellow_box_msg": "",
    "category": "All App",
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "is_new": false,
    "release_notes": "",
    "description_html": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/6aa28ca8-cef1-4d1a-b054-13e242eaef02/-/preview/190x190/",
    "custom_admin_box_heading": "",
    "target_region": "",
    "safety_status": "Verified",
    "seo_title": "Rummy Lodo",
    "version": "1.0",
    "seo_keywords": "",
    "red_box_msg": "",
    "created_at": "2026-05-26T07:39:44.282Z",
    "encrypted_download_url": "https://ramiludo.net/?code=WZTYJ9NFSPS&t=1779781063",
    "file_size": "Unknown",
    "rating": 5
  },
  {
    "yellow_box_msg": "",
    "category": "All App",
    "og_image_url": "",
    "developer": "Admin",
    "seo_description": "",
    "slug": "rummy-77",
    "id": "69x1lstq7",
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 23,
    "name": "Rummy 77",
    "is_featured": false,
    "faqs": [],
    "file_size": "Unknown",
    "encrypted_download_url": "https://rummy77a.net/?code=5FNQLU87FXE&t=1779781211",
    "rating": 5,
    "red_box_msg": "",
    "created_at": "2026-05-26T07:42:24.615Z",
    "seo_keywords": "",
    "version": "1.0",
    "target_region": "",
    "safety_status": "Verified",
    "seo_title": "Rummy 77",
    "description_html": "",
    "custom_admin_box_heading": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/d17abcfc-c8dc-4c36-8558-e3408002d37e/-/preview/190x190/",
    "is_new": false,
    "release_notes": "",
    "idea_box_msg": "",
    "custom_admin_box_html": ""
  },
  {
    "icon_url": "https://13eehe59cj.ucarecd.net/2738be7d-f198-4f70-a7d8-c8eb5f452eb0/-/preview/190x190/",
    "custom_admin_box_heading": "",
    "description_html": "",
    "is_new": false,
    "release_notes": "",
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "rating": 5,
    "encrypted_download_url": "https://share177.com/?code=Y6GM4JYT21F&t=1779781372",
    "file_size": "Unknown",
    "red_box_msg": "",
    "created_at": "2026-05-26T07:44:32.442Z",
    "seo_keywords": "",
    "version": "1.0",
    "seo_title": "Share Slots",
    "safety_status": "Verified",
    "target_region": "",
    "developer": "Admin",
    "slug": "share-slots",
    "seo_description": "",
    "id": "j79n2g3l9",
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 24,
    "name": "Share Slots",
    "faqs": [],
    "is_featured": false,
    "category": "All App",
    "yellow_box_msg": "",
    "og_image_url": ""
  },
  {
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "is_new": false,
    "release_notes": "",
    "description_html": "",
    "custom_admin_box_heading": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/e4314d5e-eb77-46b9-8998-8e0f94970b38/-/preview/72x72/",
    "safety_status": "Verified",
    "target_region": "",
    "seo_title": "567 SLOTS",
    "version": "1.0",
    "seo_keywords": "",
    "created_at": "2026-05-26T07:51:47.637Z",
    "red_box_msg": "",
    "encrypted_download_url": "https://567slotsrefer05.cc/?code=WTP44BFECD6&t=1779781668",
    "file_size": "Unknown",
    "rating": 5,
    "is_featured": false,
    "faqs": [],
    "name": "567 SLOTS",
    "serial_number": 26,
    "canonical_url": "",
    "screenshots": [],
    "id": "n3w2vjk0b",
    "seo_description": "",
    "slug": "567-slots",
    "developer": "Admin",
    "og_image_url": "",
    "yellow_box_msg": "",
    "category": "All App"
  },
  {
    "category": "All App",
    "yellow_box_msg": "",
    "og_image_url": "",
    "id": "owxg4aekg",
    "developer": "Admin",
    "slug": "789jackpots",
    "seo_description": "",
    "name": "789Jackpots",
    "faqs": [],
    "is_featured": false,
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 27,
    "rating": 5,
    "encrypted_download_url": "https://789jackpotsrefer10.cc/?code=LXMDL1JKK8H&t=1779781990",
    "file_size": "Unknown",
    "created_at": "2026-05-26T07:56:30.478Z",
    "red_box_msg": "",
    "seo_title": "789Jackpots",
    "safety_status": "Verified",
    "target_region": "",
    "seo_keywords": "",
    "version": "1.0",
    "icon_url": "https://13eehe59cj.ucarecd.net/a0cedc36-33b0-4e75-a1ea-cd963b3ee0ca/-/preview/190x190/",
    "custom_admin_box_heading": "",
    "description_html": "",
    "custom_admin_box_html": "",
    "idea_box_msg": "",
    "is_new": false,
    "release_notes": ""
  },
  {
    "screenshots": [],
    "canonical_url": "",
    "serial_number": 28,
    "name": "YONO VIP",
    "is_featured": false,
    "faqs": [],
    "developer": "Admin",
    "seo_description": "",
    "slug": "yono-vip",
    "id": "fw5wsziec",
    "og_image_url": "",
    "yellow_box_msg": "",
    "category": "All App",
    "release_notes": "",
    "is_new": false,
    "idea_box_msg": "",
    "custom_admin_box_html": "",
    "description_html": "",
    "custom_admin_box_heading": "",
    "icon_url": "https://13eehe59cj.ucarecd.net/d9226164-7447-425e-ba61-618d72ed28df/-/preview/190x190/",
    "seo_keywords": "",
    "version": "1.0",
    "safety_status": "Verified",
    "target_region": "",
    "seo_title": "YONO VIP",
    "file_size": "Unknown",
    "encrypted_download_url": "https://yonovippro.com/?code=5NFD5E5WTRC&t=1779782313",
    "rating": 5,
    "red_box_msg": "",
    "created_at": "2026-05-26T08:00:01.636Z"
  }
];

export const saveMockApps = (apps: AppConfig[]) => {
  localStorage.setItem('yonostore_apps', JSON.stringify(apps));
  mockApps.splice(0, mockApps.length, ...apps);
};

export const mockSettings: GlobalSettings = {
  "ticker_text": "LIVE: Unbiased words. Uncompromised truth. YonoStore delivers pure transparency through independent reviews. ✒️",
  "privacy_content": "",
  "meta_description": "Master digital card games safely. We review the best free-to-play rummy platforms, offering 100% safe e-sports strategies and casual guides for players.",
  "secure_index_subtitle": " Transparent App Marketplace & TRUST",
  "terms_content": "",
  "last_updated": "2026-05-28T09:11:19.668Z",
  "important_notice_heading": "VERY IMPORTANT NOTICE ",
  "seo_keywords": " Bingo 101, Rummy Arcade, Ind club,  Ok Rummy, Boss Rummy, Jaiho 91, Club Inr, Jaiho Slots, Jaiho slots",
  "categories": [
    "All App",
    "Yono",
    "Movie",
    "Game"
  ],
  "secure_index_title": "RUMMY STORE",
  "ethics_discrimination_text": "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; max-width: 100%; margin: 0 auto; padding: 24px 16px; color: #334155; line-height: 1.6; box-sizing: border-box; text-align: left;\">\n\n  <!-- Glowing Top Grid Tracker -->\n  <div style=\"display: flex; align-items: center; gap: 12px; margin-bottom: 24px;\">\n    <span style=\"background: linear-gradient(135deg, #e0f2fe, #e0e7ff); color: #0284c7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; border: 1px solid #bae6fd; box-shadow: 0px 4px 15px rgba(14, 165, 233, 0.2);\">\n      ✦ E-SPORTS ETHICS // COMMUNITY PROTOCOLS\n    </span>\n    <div style=\"flex-grow: 1; height: 1px; background: linear-gradient(to right, #bae6fd, transparent);\"></div>\n  </div>\n\n  <!-- Intro Block with Subtle Radial Glow -->\n  <p style=\"font-size: 15.5px; line-height: 1.7; color: #334155; margin-bottom: 24px; background: linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%); padding: 18px; border-left: 4px solid #0ea5e9; border-radius: 12px; box-shadow: 0 4px 20px rgba(14, 165, 233, 0.06);\">\n    At <strong style=\"background: linear-gradient(to right, #0ea5e9, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; text-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);\">Rummy Store E-Sports Directory</strong>, our core values are built on absolute transparency, digital well-being, and community trust. We function strictly as an independent casual gaming blog and strategy platform:\n  </p>\n\n  <!-- Digital Value Cluster (Full Mobile Size Responsiveness) -->\n  <div style=\"display: flex; flex-direction: column; gap: 16px; margin-top: 15px;\">\n    \n    <!-- Value 1: Casual E-Sports Focus -->\n    <div style=\"background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); border-left: 4px solid #0ea5e9;\">\n      <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\">\n        <span style=\"font-size: 14px;\">🎮</span>\n        <strong style=\"color: #0f172a; font-size: 15px; font-weight: 700;\">Casual E-Sports Focus</strong>\n      </div>\n      <p style=\"margin: 0; font-size: 14px; color: #475569; line-height: 1.6;\">\n        We thoroughly investigate and evaluate the mechanics, graphics, and AI difficulty of free-to-play applications before sharing strategies, ensuring you receive factual and reliable casual gaming metrics.\n      </p>\n    </div>\n\n    <!-- Value X: System Architecture Restrictions -->\n    <div style=\"background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); border-left: 4px solid #f59e0b;\">\n      <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\">\n        <span style=\"font-size: 14px;\">🛡️</span>\n        <strong style=\"color: #0f172a; font-size: 15px; font-weight: 700;\">Strict Zero-Download Policy</strong>\n      </div>\n      <p style=\"margin: 0; font-size: 14px; color: #475569; line-height: 1.6;\">\n        Our infrastructure operates purely as a community blog and strategy wiki. We do not provide an app download system, deploy APK installation files, or offer setup links for any digital application.\n      </p>\n    </div>\n\n    <!-- Value 2: Unbiased Gameplay Reviews -->\n    <div style=\"background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.04); border-left: 4px solid #22c55e;\">\n      <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\">\n        <span style=\"font-size: 14px;\">📊</span>\n        <strong style=\"color: #14532d; font-size: 15px; font-weight: 700;\">Unbiased Gameplay Reviews</strong>\n      </div>\n      <p style=\"margin: 0; font-size: 14px; color: #166534; line-height: 1.6;\">\n        Our platform breakdowns are generated with 100% editorial independence. We evaluate virtual apps using practical metrics such as 3D animation smoothness, touch responsiveness, and free-to-play feature stability.\n      </p>\n    </div>\n\n    <!-- Value 3: Digital Well-Being & Transparency -->\n    <div style=\"background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%); border: 1px solid #e9d5ff; padding: 16px; border-radius: 12px; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.04); border-left: 4px solid #a855f7;\">\n      <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\">\n        <span style=\"font-size: 14px;\">🧠</span>\n        <strong style=\"color: #581c87; font-size: 15px; font-weight: 700;\">Digital Well-Being & Transparency</strong>\n      </div>\n      <p style=\"margin: 0; font-size: 14px; color: #6b21a8; line-height: 1.6;\">\n        We believe in keeping our gaming community safe. We openly highlight virtual chip constraints, encourage healthy screen-time habits, and remind players to balance digital entertainment with real-world responsibilities.\n      </p>\n    </div>\n\n  </div>\n\n  <!-- Premium Bottom Guard Text -->\n  <div style=\"border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; text-align: center;\">\n    <p style=\"margin: 0; font-size: 12px; background: linear-gradient(to right, #0284c7, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: 1px;\">\n      E-SPORTS DIRECTORY VERIFIED // COMMUNITY VALUES LOCKED\n    </p>\n  </div>\n\n</div>\n",
  "site_title": "Rummy Store",
  "logo_url": "https://13eehe59cj.ucarecd.net/82f8ec5c-1368-4ea4-8ff0-b2d129d54d98/-/preview/1000x1000/",
  "important_notice": "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; max-width: 100%; margin: 0 auto; padding: 24px 16px; color: #334155; line-height: 1.6; box-sizing: border-box; text-align: left;\">\n\n  <!-- Glowing Top Grid Tracker -->\n  <div style=\"display: flex; align-items: center; gap: 12px; margin-bottom: 24px;\">\n    <span style=\"background: linear-gradient(135deg, #e0f2fe, #e0e7ff); color: #0284c7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; border: 1px solid #bae6fd; box-shadow: 0px 4px 15px rgba(14, 165, 233, 0.2);\">\n      ✦ E-SPORTS GATEWAY // COMMUNITY VERIFICATION\n    </span>\n    <div style=\"flex-grow: 1; height: 1px; background: linear-gradient(to right, #bae6fd, transparent);\"></div>\n  </div>\n\n  <!-- Intro Block with Subtle Radial Glow -->\n  <p style=\"font-size: 15.5px; line-height: 1.7; color: #334155; margin-bottom: 24px; background: linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%); padding: 18px; border-left: 4px solid #0ea5e9; border-radius: 12px; box-shadow: 0 4px 20px rgba(14, 165, 233, 0.06);\">\n    You are accessing the <strong style=\"background: linear-gradient(to right, #0ea5e9, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; text-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);\">Rummy Store E-Sports Directory</strong>. To ensure a safe and entertaining community environment, our casual game reviews are processed through a strict, independent evaluation of 3D graphics, AI difficulty, and virtual gameplay mechanics.\n  </p>\n\n  <!-- Glowing Digital Alert Card (Full Mobile Size) -->\n  <div style=\"background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%); border: 1px solid #fde68a; border-left: 5px solid #d97706; padding: 18px; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 15px rgba(217, 119, 6, 0.05);\">\n    <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\">\n      <span style=\"font-size: 14px;\">⚠️</span>\n      <strong style=\"color: #78350f; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;\">Community Safety Notice</strong>\n    </div>\n    <p style=\"margin: 0 0 12px 0; color: #92400e; font-size: 14px; line-height: 1.6;\">\n      Please ensure you independently review the virtual mechanics and developer terms of any casual app you choose to research. Rummy Store provides strategy guides and UI analysis, but <span style=\"color: #b45309; font-weight: 600;\">managing your digital screen time and ensuring safe play on your personal device remains your own responsibility.</span>\n    </p>\n    <div style=\"background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px dashed #f59e0b; font-size: 13px; color: #78350f; font-weight: 600;\">\n      ℹ️ Operational Limit: We provide free-to-play strategy wikis and informational panels only. Our community platform does not feature an app download system, APK file storage, or direct game installation pathways.\n    </div>\n  </div>\n\n  <!-- Technical Disclaimer Subtext -->\n  <div style=\"background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); border-left: 4px solid #94a3b8; margin-bottom: 24px;\">\n    <p style=\"margin: 0; font-size: 13.5px; color: #475569; line-height: 1.6;\">\n      By interacting with our e-sports strategies, you verify that you understand our platform is strictly for casual entertainment, that you meet mature audience (18+) guidelines for digital card games, and that your participation complies fully with your local cyber laws.\n    </p>\n  </div>\n\n  <!-- Premium Bottom Guard Text -->\n  <div style=\"border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; text-align: center;\">\n    <p style=\"margin: 0; font-size: 12px; background: linear-gradient(to right, #0284c7, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: 1px;\">\n      E-SPORTS GATEWAY ACTIVE // CASUAL GAMING DIRECTORY\n    </p>\n  </div>\n\n</div>\n",
  "portal_heading": "IMPORTANT NOTICE ",
  "favicon_url": "https://13eehe59cj.ucarecd.net/82f8ec5c-1368-4ea4-8ff0-b2d129d54d98/-/preview/1000x1000/",
  "animations_enabled": true,
  "support_email": "support@yonostore.com",
  "about_content": "",
  "responsibility_content": "",
  "disclaimer_heading": "DISCLAIMER ",
  "banners": [],
  "ethics_heading": "ETHNICS",
  "helpline_whatsapp": "+1234567890",
  "helpline_telegram": "@yonostoreuhhdhs",
  "disclaimer_text": "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; max-width: 100%; margin: 0 auto; padding: 24px 16px; color: #334155; line-height: 1.6; box-sizing: border-box; text-align: left;\">\n\n  <!-- Glowing Top Grid Tracker -->\n  <div style=\"display: flex; align-items: center; gap: 12px; margin-bottom: 24px;\">\n    <span style=\"background: linear-gradient(135deg, #e0f2fe, #e0e7ff); color: #0284c7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; border: 1px solid #bae6fd; box-shadow: 0px 4px 15px rgba(14, 165, 233, 0.2);\">\n      ✦ SYSTEM DISCLOSURE // COMPLIANCE MATRIX\n    </span>\n    <div style=\"flex-grow: 1; height: 1px; background: linear-gradient(to right, #bae6fd, transparent);\"></div>\n  </div>\n\n  <!-- Intro Block with Subtle Radial Glow -->\n  <p style=\"font-size: 15.5px; line-height: 1.7; color: #334155; margin-bottom: 24px; background: linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%); padding: 18px; border-left: 4px solid #0ea5e9; border-radius: 12px; box-shadow: 0 4px 20px rgba(14, 165, 233, 0.06);\">\n    <strong style=\"background: linear-gradient(to right, #0ea5e9, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; text-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);\">Rummy Store E-Sports Directory</strong> is an independent, community-supported informational portal. We provide in-depth interface reviews, strategic e-sports guides, and comprehensive transparency for free-to-play social card games.\n  </p>\n\n  <!-- Section Divider Sub-Label -->\n  <p style=\"font-size: 14px; margin-top: 20px; color: #0f172a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;\">\n    <span>⚡</span> Please be explicitly aware of our community guidelines:\n  </p>\n\n  <!-- Digital List Cluster (Full Mobile Responsiveness) -->\n  <div style=\"display: flex; flex-direction: column; gap: 16px; margin-top: 12px;\">\n    \n    <!-- Item 1: Affiliation -->\n    <div style=\"background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); border-left: 4px solid #0ea5e9; transition: all 0.3s ease;\">\n      <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\">\n        <span style=\"font-size: 14px;\">🔗</span>\n        <strong style=\"color: #0f172a; font-size: 15px; font-weight: 700;\">No Studio Affiliation</strong>\n      </div>\n      <p style=\"margin: 0; font-size: 14px; color: #475569; line-height: 1.6;\">\n        Our directory is a fully independent fan and strategy platform. We are not officially affiliated, authorized, or endorsed by the developers or studios of the casual gaming apps listed on this site.\n      </p>\n    </div>\n\n    <!-- Item 2: No Distribution System -->\n    <div style=\"background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); border-left: 4px solid #f59e0b; transition: all 0.3s ease;\">\n      <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\">\n        <span style=\"font-size: 14px;\">🛡️</span>\n        <strong style=\"color: #0f172a; font-size: 15px; font-weight: 700;\">Zero Download System</strong>\n      </div>\n      <p style=\"margin: 0; font-size: 14px; color: #475569; line-height: 1.6;\">\n        We strictly provide educational metrics and visual evaluations. We do not manage, operate, or maintain any APK files, direct download links, or application hosting infrastructure.\n      </p>\n    </div>\n    \n    <!-- Item 3: Virtual Play & Age -->\n    <div style=\"background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%); border: 1px solid #fecdd3; padding: 16px; border-radius: 12px; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.04); border-left: 4px solid #f43f5e;\">\n      <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 8px;\">\n        <span style=\"font-size: 14px;\">🎮</span>\n        <strong style=\"color: #9f1239; font-size: 15px; font-weight: 700;\">Virtual Play & Mature Audience</strong>\n      </div>\n      <p style=\"margin: 0 0 12px 0; font-size: 14px; color: #475569; line-height: 1.6;\">\n        All strategies and digital applications discussed on this platform utilize virtual chips for casual entertainment. This content is intended for users who are \n        <span style=\"background: #ffeef0; color: #f43f5e; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; border: 1px solid #fecdd3; box-shadow: 0 2px 6px rgba(244, 63, 94, 0.1);\">18+ YEARS OLD</span>.\n      </p>\n      <div style=\"background: #ffffff; padding: 12px; border-radius: 8px; border: 1px dashed #fda4af; font-size: 13px; color: #9f1239; font-weight: 600; line-height: 1.5;\">\n        ⚠️ Legal Awareness: Even for free-to-play social gaming, local cyber laws strictly monitor digital entertainment in states like Assam, Odisha, Telangana, and Andhra Pradesh. Always verify your local laws.\n      </div>\n    </div>\n    \n    <!-- Item 4: Digital Well-being -->\n    <div style=\"background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); border-left: 4px solid #6366f1;\">\n      <div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\">\n        <span style=\"font-size: 14px;\">🧠</span>\n        <strong style=\"color: #0f172a; font-size: 15px; font-weight: 700;\">Digital Well-Being & Safe Play</strong>\n      </div>\n      <p style=\"margin: 0; font-size: 14px; color: #475569; line-height: 1.6;\">\n        While we prioritize providing high-level e-sports strategies, <strong>you must manage your digital screen time</strong>. Treat social gaming as a casual hobby, take regular breaks, and protect your privacy when interacting with any external applications.\n      </p>\n    </div>\n\n  </div>\n\n  <!-- Premium Bottom Guard Text -->\n  <div style=\"border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; text-align: center;\">\n    <p style=\"margin: 0; font-size: 12px; background: linear-gradient(to right, #0284c7, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: 1px;\">\n      SECURE PROTOCOL // VERIFIED CASUAL GAMING DATA\n    </p>\n  </div>\n\n</div>\n",
  "contact_content": ""
};

export const saveMockSettings = (settings: GlobalSettings) => {
  localStorage.setItem('yonostore_settings', JSON.stringify(settings));
  Object.assign(mockSettings, settings);
};

export const mockNews: NewsItem[] = [
  {
    "ceo_description": "An experienced technical leader with 10+ years of building secure systems.",
    "description": "A deep dive into the most exciting technical leaps of this year.",
    "published_at": "2026-05-22T12:22:35.243Z",
    "logo_url": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
    "content": "",
    "id": "1",
    "slug": "tech-innovations-2026",
    "link": "https://example.com/news/1",
    "seo_description": "Read the latest updates about tech innovations in 2026.",
    "ceo_name": "Elena Vance",
    "seo_title": "Tech Innovations 2026 - Latest News",
    "title": "Technology Innovations in 2026"
  }
];

export const saveMockNews = (newsList: NewsItem[]) => {
  localStorage.setItem('yonostore_news', JSON.stringify(newsList));
  mockNews.splice(0, mockNews.length, ...newsList);
};

export const mockBlogs: BlogPost[] = [
  {
    "author": "Admin Team",
    "published_at": "2026-05-19T03:20:58.747Z",
    "seo_keywords": "mobile security, privacy, encryption, 2026 tech",
    "content": "",
    "id": "1",
    "slug": "future-mobile-security",
    "cover_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    "title": "The Future of Mobile Security",
    "seo_description": "Exploring the upcoming trends in mobile device protection.",
    "seo_title": "Future of Mobile Security - Blog"
  },
  {
    "seo_title": "New Blog Post",
    "seo_description": "Read our latest blog post.",
    "title": "New Blog Post",
    "cover_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    "slug": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    "id": "42hhnbphg",
    "content": "",
    "seo_keywords": "",
    "published_at": "2026-05-19T03:21:14.664Z",
    "author": "Admin Team"
  }
];

export const saveMockBlogs = (blogs: BlogPost[]) => {
  localStorage.setItem('yonostore_blogs', JSON.stringify(blogs));
  mockBlogs.splice(0, mockBlogs.length, ...blogs);
};

export const mockVideos: VideoItem[] = [
  {
    "title": "Intro to YonoStore",
    "seo_description": "Watch the YonoStore introduction video.",
    "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "seo_title": "YonoStore Introduction Video",
    "description": "A brief introduction to the YonoStore platform and its offerings.",
    "id": "1",
    "slug": "intro-video",
    "created_at": "2026-05-22T12:22:35.244Z"
  }
];

export const saveMockVideos = (videos: VideoItem[]) => {
  localStorage.setItem('yonostore_videos', JSON.stringify(videos));
  mockVideos.splice(0, mockVideos.length, ...videos);
};
