/**
 * VideosPage interactive walkthrough directory
 * Displays lists of embedded gameplay instruction videos and interactive previews.
 */

import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { Video, Search, ArrowLeft, Play, Calendar, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function getYoutubeId(urlStr: string) {
  if (!urlStr) return '';
  try {
    const url = new URL(urlStr);
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/live/') || url.pathname.startsWith('/embed/') || url.pathname.startsWith('/v/')) {
        return url.pathname.split('/')[2] || url.pathname.split('/')[1] || '';
      }
      return url.searchParams.get('v') || '';
    } else if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1);
    }
  } catch (e) {
    if (urlStr.length === 11 && !urlStr.includes('/')) return urlStr;
  }
  const m = urlStr.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  if (m && m[1]) return m[1];
  return urlStr.split('/').pop()?.split('?')[0] || '';
}

export default function VideosPage() {
  const { videos: mockVideos, settings: mockSettings, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVideos = useMemo(() => {
    return mockVideos.filter(video => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        video.title?.toLowerCase().includes(term) ||
        video.description?.toLowerCase().includes(term)
      );
    });
  }, [mockVideos, searchTerm]);

  return (
    <div className="animate-fade-in min-h-screen max-w-[1550px] mx-auto plain-content px-3 sm:px-6 md:px-10">
      <div className="mb-12 pt-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors group"
        >
          <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Home
        </Link>
      </div>

      <Helmet>
        <title>Video Transmissions - {mockSettings.site_title}</title>
        <meta name="description" content="Watch high-quality video walkthroughs and tutorials of our catalog applications." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.origin + "/videos"} />
      </Helmet>

      <div className="mb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/40 rounded-2xl border border-blue-100 dark:border-blue-500/20">
            <Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 m-0">
              Videos
            </h1>
          </div>
        </div>
        
        <div className="relative max-w-xl">
          <input
            type="text"
            className="block w-full py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-black/10 dark:border-white/10 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium text-base rounded-[16px] px-5 pr-12 text-zinc-900 dark:text-zinc-100"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        </div>
      </div>

      {loading && filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium tracking-wide text-zinc-500 animate-pulse">Loading videos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredVideos.map((video, index) => {
            const ytId = getYoutubeId(video.youtube_url);
            const thumbUrl = ytId 
              ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` 
              : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80';

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                key={video.id}
                className="group flex flex-col bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 hover:border-black/10 dark:hover:border-white/10 transition-all duration-300"
              >
                {/* Visual Thumbnail Frame */}
                <Link to={`/videos/${video.slug || video.id}`} className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 block">
                  <img 
                    src={thumbUrl} 
                    alt={video.title}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    loading="eager"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle elegant gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  {/* Center glassmorphic Play Button indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-4 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-white shadow-xl scale-95 group-hover:scale-110 group-hover:bg-blue-600 group-hover:border-transparent transition-all duration-300">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Top Safety Status Pin Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-semibold tracking-wide text-white/90">Verified</span>
                  </div>
                </Link>

                {/* Video Info Panel */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Timestamp & Meta Row */}
                  <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-current shrink-0" />
                    <span>
                      {video.created_at ? new Date(video.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Recent'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    <Link to={`/videos/${video.slug || video.id}`}>
                      {video.title}
                    </Link>
                  </h3>
                  
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed mt-2.5 mb-6 line-clamp-3">
                    {video.description}
                  </p>

                  {/* Action Link Footer */}
                  <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-zinc-400">
                      REF: YT-{video.id.substring(0, 5).toUpperCase()}
                    </span>
                    <Link 
                      to={`/videos/${video.slug || video.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Watch
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && filteredVideos.length === 0 && (
        <div className="text-center py-32 max-w-xl mx-auto">
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">No videos found</h3>
          <p className="text-sm font-medium text-zinc-500">
            {searchTerm ? "Try searching for a different term." : "No videos have been uploaded yet."}
          </p>
        </div>
      )}
    </div>
  );
}
