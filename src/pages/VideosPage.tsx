import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { Video, Search, ArrowLeft, Play, Calendar, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function getYoutubeId(urlStr: string) {
  if (!urlStr) return '';
  let videoId = '';
  try {
    const url = new URL(urlStr);
    if (url.hostname.includes('youtube.com')) {
      videoId = url.searchParams.get('v') || '';
    } else if (url.hostname.includes('youtu.be')) {
      videoId = url.pathname.slice(1);
    }
  } catch (e) {
    const cleanStr = urlStr.trim();
    videoId = cleanStr.split('/').pop() || '';
  }
  return videoId;
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
        video.description?.toLowerCase().includes(term) ||
        video.seo_title?.toLowerCase().includes(term)
      );
    });
  }, [mockVideos, searchTerm]);

  return (
    <div className="animate-fade-in min-h-screen plain-content px-4">
      <div className="mb-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] opacity-40 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-3 h-3" />
          Gateway
        </Link>
      </div>

      <Helmet>
        <title>Video Transmissions - {mockSettings.site_title || 'RUMMY STORE'}</title>
        <meta name="description" content="Watch high-quality video walkthroughs, tutorials, and security analysis of our verified applications." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.origin + "/videos"} />
      </Helmet>

      <div className="mb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-600/10 rounded-2xl border border-red-600/15">
            <Video className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter italic leading-none m-0">
              Video<br/>Transmissions
            </h1>
          </div>
        </div>
        
        <div className="relative max-w-xl">
          <input
            type="text"
            className="block w-full py-4 bg-transparent border-b-2 border-black/10 placeholder-slate-400 focus:outline-none focus:border-red-600 transition-all font-black text-lg sm:text-xl uppercase italic rounded-none"
            placeholder="Search Transmissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
        </div>
      </div>

      {loading && filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 italic animate-pulse">Loading secure transmissions...</p>
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
                className="group flex flex-col bg-white border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-350"
              >
                {/* Visual Thumbnail Frame */}
                <Link to={`/videos/${video.slug}`} className="relative aspect-video w-full overflow-hidden bg-zinc-950 block">
                  <img 
                    src={thumbUrl} 
                    alt={video.title}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    loading="lazy"
                    className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle elegant gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  {/* Center glassmorphic Play Button indicator */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-4 rounded-full bg-white/25 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-white shadow-2xl scale-95 group-hover:scale-110 group-hover:bg-red-600 group-hover:border-transparent group-hover:text-white transition-all duration-300">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Top Safety Status Pin Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-zinc-950/75 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                    <ShieldCheck className="w-3 h-3 text-red-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/90 font-mono">Verified Stream</span>
                  </div>
                </Link>

                {/* Video Info Panel */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Timestamp & Meta Row */}
                  <div className="flex items-center gap-2 mb-3 text-[9px] font-black text-red-600 uppercase tracking-widest font-mono">
                    <Calendar className="w-3 h-3 text-red-500 shrink-0" />
                    <span>
                      {video.created_at ? new Date(video.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Secure Transmit'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-black uppercase tracking-tighter italic text-zinc-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                    <Link to={`/videos/${video.slug}`}>
                      {video.title}
                    </Link>
                  </h3>
                  
                  <p className="text-zinc-500 text-xs font-medium leading-relaxed mt-2.5 mb-6 line-clamp-3">
                    {video.description}
                  </p>

                  {/* Action Link Footer */}
                  <div className="mt-auto pt-4 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 font-mono">
                      REF: YT-{video.id.substring(0, 5).toUpperCase()}
                    </span>
                    <Link 
                      to={`/videos/${video.slug}`}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-950 hover:text-red-600 transition-colors group-hover/btn:translate-x-1"
                    >
                      Watch Stream
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
        <div className="text-center py-40 border-2 border-dashed border-black/5 rounded-[2rem] max-w-xl mx-auto">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-3">No Transmissions</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-[280px] mx-auto italic">
            {searchTerm ? "Search query returned zero matches" : "Syncing newly configured video broadcasts. Stand by."}
          </p>
        </div>
      )}
    </div>
  );
}
