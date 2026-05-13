import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, ShieldAlert, LogOut, Save, Upload, Type, Link as LinkIcon, ToggleLeft, Layers, Newspaper as BookIcon, Plus, Trash2, Video as VideoIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { auth } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

function FaqEditor({ initialFaqs }: { initialFaqs: {question: string, answer: string}[] }) {
  const [faqs, setFaqs] = React.useState(initialFaqs || []);

  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const removeFaq = (index: number) => setFaqs(faqs.filter((_, i) => i !== index));
  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg border-b border-slate-300 dark:border-white/10 pb-2">SEO Optimized FAQs</h3>
      <input type="hidden" name="faqs_json" value={JSON.stringify(faqs)} />
      {faqs.map((faq, idx) => (
        <div key={idx} className="bg-slate-100 dark:bg-white/5 p-4 rounded-lg border border-slate-300 dark:border-white/10 space-y-3 relative">
          <button type="button" onClick={() => removeFaq(idx)} className="absolute top-2 right-2 text-rose-500 hover:text-rose-600">
            <Trash2 className="w-4 h-4" />
          </button>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Question</label>
            <input type="text" value={faq.question} onChange={e => updateFaq(idx, 'question', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" placeholder="e.g. Is this app safe?" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Answer (HTML supported)</label>
            <textarea value={faq.answer} onChange={e => updateFaq(idx, 'answer', e.target.value)} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" placeholder="Yes, it is 100% safe..."></textarea>
          </div>
        </div>
      ))}
      <button type="button" onClick={addFaq} className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium">
        <Plus className="w-4 h-4" /> Add FAQ
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const { apps: mockApps, settings: mockSettings, news: mockNews, blogs: mockBlogs, videos: mockVideos, saveApps: saveMockApps, saveSettings: saveMockSettings, saveNews: saveMockNews, saveBlogs: saveMockBlogs, saveVideos: saveMockVideos } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [saving, setSaving] = useState(false);
  const [appsList, setAppsList] = useState(mockApps);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [newsList, setNewsList] = useState(mockNews);
  const [banners, setBanners] = useState(mockSettings.banners || []);
  const [blogs, setBlogs] = useState(mockBlogs);
  const [videosList, setVideosList] = useState(mockVideos);
  const [categoriesList, setCategoriesList] = useState<string[]>(mockSettings.categories || []);
  const [newCatInput, setNewCatInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => setAppsList(mockApps), [mockApps]);
  React.useEffect(() => setNewsList(mockNews), [mockNews]);
  React.useEffect(() => setBanners(mockSettings.banners || []), [mockSettings.banners]);
  React.useEffect(() => setBlogs(mockBlogs), [mockBlogs]);
  React.useEffect(() => setVideosList(mockVideos), [mockVideos]);
  React.useEffect(() => setCategoriesList(mockSettings.categories || []), [mockSettings.categories]);

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  const handleSaveCategories = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedSettings = {
        ...mockSettings,
        categories: categoriesList,
      };
      await saveMockSettings(updatedSettings);
      triggerHaptic();
      alert('Categories saved successfully!');
    } catch (err: any) {
      alert('Error saving categories: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (newCatInput.trim() && !categoriesList.includes(newCatInput.trim())) {
      setCategoriesList([...categoriesList, newCatInput.trim()]);
      setNewCatInput('');
    }
  };

  const removeCategory = (catToRemove: string) => {
    setCategoriesList(categoriesList.filter(c => c !== catToRemove));
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updatedSettings = {
        ...mockSettings,
        site_title: formData.get('site_title') !== null ? (formData.get('site_title') as string) : mockSettings.site_title,
        meta_description: formData.get('meta_description') !== null ? (formData.get('meta_description') as string) : mockSettings.meta_description,
        logo_url: formData.get('logo_url') !== null ? (formData.get('logo_url') as string) : mockSettings.logo_url,
        favicon_url: formData.get('favicon_url') !== null ? (formData.get('favicon_url') as string) : mockSettings.favicon_url,
        seo_keywords: formData.get('seo_keywords') !== null ? (formData.get('seo_keywords') as string) : mockSettings.seo_keywords,
        about_content: formData.get('about_content') !== null ? (formData.get('about_content') as string) : mockSettings.about_content,
        contact_content: formData.get('contact_content') !== null ? (formData.get('contact_content') as string) : mockSettings.contact_content,
        privacy_content: formData.get('privacy_content') !== null ? (formData.get('privacy_content') as string) : mockSettings.privacy_content,
        terms_content: formData.get('terms_content') !== null ? (formData.get('terms_content') as string) : mockSettings.terms_content,
        ticker_text: formData.get('ticker_text') !== null ? (formData.get('ticker_text') as string) : mockSettings.ticker_text,
        disclaimer_text: formData.get('disclaimer_text') !== null ? (formData.get('disclaimer_text') as string) : mockSettings.disclaimer_text,
        ethics_discrimination_text: formData.get('ethics_discrimination_text') !== null ? (formData.get('ethics_discrimination_text') as string) : mockSettings.ethics_discrimination_text,
        support_email: formData.get('support_email') !== null ? (formData.get('support_email') as string) : mockSettings.support_email,
        helpline_whatsapp: formData.get('helpline_whatsapp') !== null ? (formData.get('helpline_whatsapp') as string) : mockSettings.helpline_whatsapp,
        helpline_telegram: formData.get('helpline_telegram') !== null ? (formData.get('helpline_telegram') as string) : mockSettings.helpline_telegram,
        important_notice: formData.get('important_notice') !== null ? (formData.get('important_notice') as string) : '',
        categories: formData.get('categories') ? (formData.get('categories') as string).split(',').map(c => c.trim()).filter(Boolean) : mockSettings.categories,
        banners: banners
      };
      
      await saveMockSettings(updatedSettings);
      triggerHaptic();
      alert('Settings saved successfully. Reload to see changes everywhere.');
    } catch (err: any) {
      console.error(err);
      alert('Error saving settings: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string || 'New App';
      const appData = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        seo_title: formData.get('seo_title') as string || name,
        seo_description: formData.get('seo_description') as string || '',
        seo_keywords: formData.get('seo_keywords') as string || '',
        og_image_url: formData.get('og_image_url') as string || '',
        canonical_url: formData.get('canonical_url') as string || '',
        icon_url: formData.get('icon_url') as string || '',
        category: formData.getAll('category_list').length > 0 ? formData.getAll('category_list').join(', ') : mockSettings.categories?.[0] || 'General',
        version: '1.0',
        file_size: 'Unknown',
        developer: 'Admin',
        screenshots: [],
        encrypted_download_url: formData.get('download_url') as string,
        description_html: formData.get('description_html') as string || '<p>A new application.</p>',
        custom_admin_box_heading: formData.get('custom_admin_box_heading') as string,
        custom_admin_box_html: formData.get('custom_admin_box_html') as string,
        red_box_msg: formData.get('red_box_msg') as string,
        yellow_box_msg: formData.get('yellow_box_msg') as string,
        idea_box_msg: formData.get('idea_box_msg') as string,
        safety_status: (formData.get('safety_status') as 'Verified' | 'Caution' | 'Unsafe') || 'Verified',
        serial_number: parseInt(formData.get('serial_number') as string) || appsList.length + 1,
        is_featured: false,
        is_new: formData.get('is_new') === 'on',
        release_notes: formData.get('release_notes') as string,
        rating: 5.0,
        created_at: new Date().toISOString(),
        faqs: JSON.parse((formData.get('faqs_json') as string) || '[]')
      };
      
      let updatedApps;
      if (editingAppId) {
        updatedApps = appsList.map(a => a.id === editingAppId ? { ...a, ...appData, id: a.id, created_at: a.created_at, screenshots: a.screenshots } : a);
      } else {
        updatedApps = [...appsList, appData];
      }
      
      await saveMockApps(updatedApps);
      setAppsList(updatedApps);
      triggerHaptic();
      setEditingAppId(null);
      alert(editingAppId ? 'App updated successfully.' : 'App added successfully. Browse to Home Page to see.');
    } catch (err: any) {
      console.error(err);
      alert('Error saving app: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteApp = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this app?")) {
      try {
        const updatedApps = appsList.filter(a => a.id !== id);
        await saveMockApps(updatedApps);
        setAppsList(updatedApps);
      } catch (err: any) {
        alert('Error deleting app: ' + err.message);
      }
    }
  };

  const handleSaveBooks = async () => {
    setSaving(true);
    try {
      await saveMockNews(newsList);
      triggerHaptic();
      alert('Books saved successfully. Go to Book Section to see.');
    } catch (err: any) {
      alert('Error saving news: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNewsChange = (id: string, field: string, value: string) => {
    setNewsList(newsList.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const handleBannerChange = (id: string, field: string, value: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleAddBanner = () => {
    const newBanner = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Banner',
      subtitle: 'Subtitle text',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
      link: '/'
    };
    setBanners([...banners, newBanner]);
  };

  const handleDeleteBanner = (id: string) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  const handleAddNews = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      slug: 'new-news',
      title: 'New News',
      logo_url: '',
      description: 'News description...',
      ceo_name: 'CEO Name',
      ceo_description: 'CEO Description',
      seo_title: 'News SEO Title',
      seo_description: 'News SEO Meta Description',
      seo_keywords: '',
      og_image_url: '',
      content: 'Detailed markdown content here...',
      link: ''
    };
    setNewsList([...newsList, newItem]);
  };

  const handleDeleteNews = (id: string) => {
    setNewsList(newsList.filter(n => n.id !== id));
  };

  const handleSaveBlogs = async () => {
    setSaving(true);
    try {
      await saveMockBlogs(blogs);
      triggerHaptic();
      alert('Blogs saved successfully.');
    } catch (err: any) {
      alert('Error saving blogs: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBlogChange = (id: string, field: string, value: string) => {
    setBlogs(blogs.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleAddBlog = () => {
    const newBlog = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Blog Post',
      content: 'Write something amazing...',
      author: 'Admin Team',
      cover_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
      published_at: new Date().toISOString()
    };
    setBlogs([...blogs, newBlog]);
  };

  const handleDeleteBlog = (id: string) => {
    setBlogs(blogs.filter(b => b.id !== id));
  };

  const handleVideosChange = (id: string, field: string, value: string) => {
    setVideosList(videosList.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleAddVideo = () => {
    const newVideo = {
      id: Math.random().toString(36).substr(2, 9),
      slug: 'new-video-' + Math.random().toString(36).substr(2, 4),
      title: 'New Video',
      description: 'Video description...',
      youtube_url: 'https://youtube.com/watch?v=...',
      seo_title: 'Video SEO Title',
      seo_description: 'Video SEO Meta Description',
      seo_keywords: '',
      created_at: new Date().toISOString()
    };
    setVideosList([...videosList, newVideo]);
  };

  const handleDeleteVideo = (id: string) => {
    setVideosList(videosList.filter(v => v.id !== id));
  };

  const handleSaveVideos = async () => {
    setSaving(true);
    try {
      await saveMockVideos(videosList);
      triggerHaptic();
      alert('Videos saved successfully.');
    } catch (err: any) {
      alert('Error saving videos: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    triggerHaptic();
    await signOut(auth);
  };

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center">Verifying credentials...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  if (user.email !== 'defentechscholar@gmail.com') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-4">Access Denied</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
          You are logged in as <span className="font-bold text-slate-900 dark:text-white">{user.email}</span>, but this account is not authorized to access the Admin Central.
        </p>
        <button onClick={handleLogout} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-bold">
          Sign Out & Try Another Account
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex justify-between items-center bg-pink-100 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-pink-400">YonoStore Admin Central</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Logged in as {user.email} • God Mode Active</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium text-sm min-h-[48px]">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid md:grid-cols-[250px_1fr] gap-8">
        <div className="glass-panel p-4 flex flex-col gap-2 h-fit">
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('dashboard'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'dashboard' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('apps'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'apps' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <FileText className="w-5 h-5" /> Manage Apps
          </button>
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('news'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'news' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <BookIcon className="w-5 h-5" /> Manage Books
          </button>
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('blogs'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'blogs' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <FileText className="w-5 h-5" /> Manage Blogs
          </button>
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('videos'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'videos' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <VideoIcon className="w-5 h-5" /> Manage Videos
          </button>
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('categories'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'categories' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <Layers className="w-5 h-5" /> Manage Categories
          </button>
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('banners'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'banners' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Home Page Banners
          </button>
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('reviews'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'reviews' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <ShieldAlert className="w-5 h-5" /> Moderation Queue
          </button>
          <button 
            onClick={() => { triggerHaptic(); setActiveTab('settings'); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all min-h-[48px] ${activeTab === 'settings' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
          >
            <Settings className="w-5 h-5" /> Global Settings
          </button>
        </div>

        <div className="glass-panel p-6 sm:p-8 min-h-[600px]">
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-6 border-b border-slate-300 dark:border-white/10 pb-4">Platform Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-300 dark:border-white/10">
                  <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total Apps</div>
                  <div className="text-2xl font-bold">{mockApps.length}</div>
                </div>
                <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-300 dark:border-white/10">
                  <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total News</div>
                  <div className="text-2xl font-bold">{newsList.length}</div>
                </div>
                <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-300 dark:border-white/10">
                  <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Pending Reviews</div>
                  <div className="text-2xl font-bold text-amber-400">12</div>
                </div>
                <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-300 dark:border-white/10">
                  <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Safe Links Encrypted</div>
                  <div className="text-2xl font-bold text-pink-400">100%</div>
                </div>
              </div>
            </div>
          )}          {activeTab === 'apps' && (
            <div className="animate-fade-in">
              {editingAppId !== null ? (
                <>
                  <div className="flex justify-between items-center mb-6 border-b border-slate-300 dark:border-white/10 pb-4">
                    <h2 className="text-xl font-bold">{editingAppId ? 'Edit Application' : 'Add New Application'}</h2>
                    <button onClick={() => setEditingAppId(null)} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white px-4 py-2">
                       Cancel
                    </button>
                  </div>
                  {(() => {
                    const editApp = editingAppId ? appsList.find(a => a.id === editingAppId) : null;
                    return (
                      <form onSubmit={handleSaveApp} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">App Name</label>
                            <input type="text" name="name" defaultValue={editApp?.name} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">App Icon / Logo URL</label>
                            <input type="text" name="icon_url" defaultValue={editApp?.icon_url} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" placeholder="Link to the app logo image" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Categories</label>
                            <div className="flex flex-wrap gap-2">
                              {mockSettings.categories?.map((cat) => (
                                <label key={cat} className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:bg-white/10 transition-colors">
                                  <input 
                                    type="checkbox" 
                                    name="category_list" 
                                    value={cat} 
                                    defaultChecked={editApp?.category.toLowerCase().split(',').map((c: string) => c.trim()).includes(cat.toLowerCase())}
                                    className="rounded border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-800 text-pink-500 focus:ring-pink-500 w-4 h-4"
                                  />
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">To add new categories to this list, go to "Manage Categories" in the sidebar.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Title Optimization</label>
                            <input type="text" name="seo_title" defaultValue={editApp?.seo_title} placeholder="Leave blank to use App Name" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Description</label>
                            <input type="text" name="seo_description" defaultValue={editApp?.seo_description} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Keywords (Comma Separated)</label>
                            <input type="text" name="seo_keywords" defaultValue={editApp?.seo_keywords} placeholder="e.g., vpn, privacy, security app" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO OG Image URL (Open Graph)</label>
                            <input type="text" name="og_image_url" defaultValue={editApp?.og_image_url} placeholder="Image URL to show when links are shared on social media" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Canonical URL</label>
                            <input type="url" name="canonical_url" defaultValue={editApp?.canonical_url} placeholder="If this content is syndicated, put original URL here to prevent SEO penalty" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Serial Number (Sort Order)</label>
                            <input type="number" name="serial_number" defaultValue={editApp?.serial_number || ''} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Traffic Light Status</label>
                            <select name="safety_status" defaultValue={editApp?.safety_status || 'Verified'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]">
                              <option value="Verified">🟢 Verified (Green)</option>
                              <option value="Caution">🟡 Caution (Yellow)</option>
                              <option value="Unsafe">🔴 Unsafe (Red)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-pink-500/30">
                          <button type="button" onClick={triggerHaptic} className="text-pink-500">
                            <ToggleLeft className="w-8 h-8" />
                          </button>
                          <div className="flex-1">
                            <div className="font-semibold text-pink-400">New App Tag</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Display "New" or "Major Update" badge on this app.</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" name="is_new" defaultChecked={editApp ? editApp.is_new : true} className="w-5 h-5 accent-pink-500" />
                            <span className="text-sm font-bold">Show Tag</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-pink-400 mb-1">Release Notes (What's New in this Version)</label>
                          <textarea name="release_notes" defaultValue={editApp?.release_notes || ''} rows={3} placeholder="* Fixed bugs&#10;* Added new tracker protections" className="w-full bg-slate-100 dark:bg-white/5 border border-pink-500/30 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>

                        <div className="border border-slate-300 dark:border-white/10 rounded-xl p-4 bg-slate-100 dark:bg-white/5 space-y-4">
                          <h3 className="font-semibold text-lg flex items-center gap-2"><LinkIcon className="w-4 h-4"/> Secure Private Link Config</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">The system will auto-encrypt this URL before saving. It will never be exposed raw.</p>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Raw Download Payload URL</label>
                          <input type="url" name="download_url" defaultValue={editApp?.encrypted_download_url || ''} className="w-full bg-white dark:bg-slate-900 border border-pink-500/30 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" placeholder="https://..." />
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg border-b border-slate-300 dark:border-white/10 pb-2 flex items-center gap-2"><Layers className="w-4 h-4"/> Custom UI Admin Boxes</h3>
                          <div>
                            <label className="block text-sm font-medium text-rose-400 mb-1">Red Box Warning Message</label>
                            <input type="text" name="red_box_msg" defaultValue={editApp?.red_box_msg || ''} className="w-full bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 min-h-[48px]" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-amber-400 mb-1">Yellow Box Notice Message</label>
                            <input type="text" name="yellow_box_msg" defaultValue={editApp?.yellow_box_msg || ''} className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 min-h-[48px]" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-pink-400 mb-1">Idea / Tip Message</label>
                            <input type="text" name="idea_box_msg" defaultValue={editApp?.idea_box_msg || ''} className="w-full bg-pink-100 dark:bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-purple-400 mb-1">Custom White Box Heading</label>
                          <input type="text" name="custom_admin_box_heading" defaultValue={editApp?.custom_admin_box_heading || ''} placeholder="e.g. Important Info" className="w-full bg-purple-100 dark:bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 min-h-[48px]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-400 mb-1">Custom White Box Content (HTML)</label>
                          <textarea name="custom_admin_box_html" defaultValue={editApp?.custom_admin_box_html || ''} rows={4} placeholder="<p>Some custom details here.</p>" className="w-full bg-purple-100 dark:bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"></textarea>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Massive Description (TipTap Editor HTML)</label>
                          <textarea name="description_html" defaultValue={editApp?.description_html || '<p>A new application.</p>'} rows={6} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                        
                        <div className="border border-slate-300 dark:border-white/10 rounded-xl p-4 bg-slate-100 dark:bg-white/5">
                          <FaqEditor initialFaqs={editApp?.faqs || []} />
                        </div>

                        <button type="submit" disabled={saving} className="min-h-[48px] w-full sm:w-auto px-8 bg-pink-500 hover:bg-pink-600 text-slate-900 dark:text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2">
                          {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Application</>}
                        </button>
                      </form>
                    );
                  })()}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold border-b border-slate-300 dark:border-white/10 pb-4 flex-1">Manage Applications</h2>
                    <button onClick={() => setEditingAppId("")} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg text-sm font-bold text-slate-900 dark:text-white transition-colors ml-4">
                      <Plus className="w-4 h-4"/> Add App
                    </button>
                  </div>
                  <div className="space-y-4">
                    {appsList.map(app => (
                      <div key={app.id} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-4 flex gap-4 items-center">
                        <img src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} alt={app.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">{app.name}</h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{app.category} • {app.is_new ? <span className="text-pink-400">New</span> : ''}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingAppId(app.id)} className="px-4 py-2 bg-slate-200 dark:bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteApp(app.id)} className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-6 border-b border-slate-300 dark:border-white/10 pb-4">Manage Global Categories</h2>
              <form onSubmit={handleSaveCategories} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Available Categories</label>
                  <p className="text-sm text-slate-500 mb-4">The first category in the list will be treated as your Home tab showing all apps.</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {categoriesList.map((cat, index) => (
                      <div key={cat} className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 px-3 py-2 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{index + 1}. {cat}</span>
                        <button 
                          type="button" 
                          onClick={() => removeCategory(cat)}
                          className="text-slate-500 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newCatInput} 
                      onChange={(e) => setNewCatInput(e.target.value)} 
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
                      className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" 
                      placeholder="Type a new category (e.g. Action Games) and press Enter" 
                    />
                    <button 
                      type="button" 
                      onClick={addCategory}
                      className="px-6 bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white font-bold rounded-lg transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={saving} className="min-h-[48px] px-8 bg-pink-500 hover:bg-pink-600 text-slate-900 dark:text-white font-bold rounded-lg transition-all flex items-center gap-2">
                  {saving ? 'Saving...' : <><Layers className="w-5 h-5"/> Save Categories</>}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'banners' && (
            <div className="animate-fade-in">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold border-b border-slate-300 dark:border-white/10 pb-4 flex-1">Manage Home Banners (Flipkart Style Ad)</h2>
                 <button onClick={handleAddBanner} className="bg-slate-200 dark:bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                   <Plus className="w-4 h-4" /> Add Banner
                 </button>
               </div>
               
               <div className="space-y-4">
                 {banners.map((banner) => (
                   <div key={banner.id} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-4 flex gap-4">
                     <img src={banner.image || undefined} className="w-40 h-24 object-cover rounded-lg" alt="" />
                     <div className="flex-1 space-y-2">
                       <div className="grid grid-cols-2 gap-4">
                         <input type="text" value={banner.title} onChange={(e) => handleBannerChange(banner.id, 'title', e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded p-2 text-sm" placeholder="Banner Title" />
                         <input type="text" value={banner.subtitle} onChange={(e) => handleBannerChange(banner.id, 'subtitle', e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded p-2 text-sm" placeholder="Subtitle" />
                       </div>
                       <div className="flex gap-2">
                         <input type="text" value={banner.link} onChange={(e) => handleBannerChange(banner.id, 'link', e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded p-2 text-xs flex-1" placeholder="Target Target URL (Link)" />
                         <input type="text" value={banner.image} onChange={(e) => handleBannerChange(banner.id, 'image', e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded p-2 text-xs flex-1" placeholder="Image URL" />
                         <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded transition-colors">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="mt-8 flex justify-end">
                 <button onClick={() => {
                   setSaving(true);
                   saveMockSettings({ ...mockSettings, banners });
                   triggerHaptic();
                   setTimeout(() => { setSaving(false); alert('Banners saved'); }, 500);
                 }} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-slate-900 dark:text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                   {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Banners</>}
                 </button>
               </div>
            </div>
          )}

                    {activeTab === 'news' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-300 dark:border-white/10 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BookIcon className="w-6 h-6 text-pink-500" /> Manage News
                </h2>
                <button
                  onClick={handleAddNews}
                  className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add News
                </button>
              </div>

              <div className="grid gap-6">
                {newsList.map((item) => (
                  <div key={item.id} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-6 relative">
                    <button 
                      onClick={() => handleDeleteNews(item.id)}
                      className="absolute top-4 right-4 text-rose-500 hover:text-rose-600 transition-colors p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                          <input type="text" value={item.title} onChange={e => handleNewsChange(item.id, 'title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Slug</label>
                          <input type="text" value={item.slug} onChange={e => handleNewsChange(item.id, 'slug', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Logo URL</label>
                          <input type="text" value={item.logo_url} onChange={e => handleNewsChange(item.id, 'logo_url', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                          <textarea value={item.description} onChange={e => handleNewsChange(item.id, 'description', e.target.value)} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">CEO Name</label>
                          <input type="text" value={item.ceo_name} onChange={e => handleNewsChange(item.id, 'ceo_name', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">CEO Description</label>
                          <textarea value={item.ceo_description} onChange={e => handleNewsChange(item.id, 'ceo_description', e.target.value)} rows={2} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Title</label>
                          <input type="text" value={item.seo_title} onChange={e => handleNewsChange(item.id, 'seo_title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Description</label>
                          <textarea value={item.seo_description} onChange={e => handleNewsChange(item.id, 'seo_description', e.target.value)} rows={2} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Keywords</label>
                          <input type="text" value={item.seo_keywords || ''} onChange={e => handleNewsChange(item.id, 'seo_keywords', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">OG Image URL</label>
                          <input type="text" value={item.og_image_url || ''} onChange={e => handleNewsChange(item.id, 'og_image_url', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Full Content (Markdown)</label>
                          <textarea value={item.content} onChange={e => handleNewsChange(item.id, 'content', e.target.value)} rows={6} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Source Link (Optional)</label>
                          <input type="text" value={item.link} onChange={e => handleNewsChange(item.id, 'link', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={async () => {
                  try {
                    setSaving(true);
                    await saveMockNews(newsList);
                    alert('News saved successfully');
                  } catch (err: any) {
                    alert('Error saving news: ' + err.message);
                  } finally {
                    setSaving(false);
                  }
                }} className="bg-pink-500 hover:bg-pink-600 text-slate-900 dark:text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                  <Save className="w-5 h-5"/> Save News
                </button>
              </div>
            </div>
          )}\n\n          {activeTab === 'blogs' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6 border-b border-slate-300 dark:border-white/10 pb-4">
                <h2 className="text-xl font-bold">Manage Blog Posts</h2>
                <button 
                  onClick={handleAddBlog}
                  className="bg-pink-500 hover:bg-pink-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Blog Post
                </button>
              </div>
              
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div key={blog.id} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 p-4 rounded-xl flex gap-4">
                    <img src={blog.cover_url || undefined} className="w-32 h-24 object-cover rounded-lg" alt="" />
                    <div className="flex-1 space-y-2">
                       <input type="text" value={blog.title} onChange={(e) => handleBlogChange(blog.id, 'title', e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded p-2 text-sm font-bold text-slate-900 dark:text-white mb-2" placeholder="Blog Title" />
                      
                      <textarea value={blog.content} onChange={(e) => handleBlogChange(blog.id, 'content', e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded p-2 text-xs" rows={3} placeholder="Full HTML Content"></textarea>
                      <div className="flex gap-2 items-center mt-2">
                        <input type="text" value={blog.author} onChange={(e) => handleBlogChange(blog.id, 'author', e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded p-2 text-xs w-32" placeholder="Author" />
                        <input type="text" value={blog.cover_url} onChange={(e) => handleBlogChange(blog.id, 'cover_url', e.target.value)} className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded p-2 text-xs flex-1" placeholder="Cover Image URL" />
                        <button onClick={() => handleDeleteBlog(blog.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={handleSaveBlogs} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-slate-900 dark:text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                  {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Blog Posts</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-300 dark:border-white/10 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <VideoIcon className="w-6 h-6 text-pink-500" /> Manage Videos
                </h2>
                <button
                  onClick={handleAddVideo}
                  className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Video
                </button>
              </div>
              
              <div className="grid gap-6">
                {videosList.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 p-6 rounded-xl shadow-sm relative group overflow-hidden">
                    <button 
                      onClick={() => handleDeleteVideo(item.id)}
                      className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="space-y-4 relative z-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                          <input type="text" value={item.title} onChange={e => handleVideosChange(item.id, 'title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Slug (URL)</label>
                          <input type="text" value={item.slug} onChange={e => handleVideosChange(item.id, 'slug', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">YouTube URL</label>
                          <input type="text" value={item.youtube_url} onChange={e => handleVideosChange(item.id, 'youtube_url', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                          <textarea value={item.description} onChange={e => handleVideosChange(item.id, 'description', e.target.value)} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Title</label>
                          <input type="text" value={item.seo_title} onChange={e => handleVideosChange(item.id, 'seo_title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Description</label>
                          <textarea value={item.seo_description} onChange={e => handleVideosChange(item.id, 'seo_description', e.target.value)} rows={2} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SEO Keywords</label>
                          <input type="text" value={item.seo_keywords || ''} onChange={e => handleVideosChange(item.id, 'seo_keywords', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg py-2 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={handleSaveVideos} className="bg-pink-500 hover:bg-pink-600 text-slate-900 dark:text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                  <Save className="w-5 h-5"/> Save Videos
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-6 border-b border-slate-300 dark:border-white/10 pb-4">Global Identity Settings (God-Mode)</h2>
              <form onSubmit={handleSaveSettings} className="space-y-8">
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-pink-400 border-b border-white/5 pb-2">Meta & Branding</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Site Title</label>
                      <input type="text" name="site_title" defaultValue={mockSettings.site_title} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Global SEO Description</label>
                      <input type="text" name="meta_description" defaultValue={mockSettings.meta_description} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Global SEO Keywords (comma separated)</label>
                      <input type="text" name="seo_keywords" defaultValue={mockSettings.seo_keywords} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Important Notice Box text (Red box in footer)</label>
                      <textarea name="important_notice" defaultValue={mockSettings.important_notice} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[80px]" />
                    </div>
                    
                    <div className="sm:col-span-2 text-slate-600 dark:text-slate-400 font-medium text-sm pt-2">Branding Assets</div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Logo URL (Direct Image Link)</label>
                      <input type="text" name="logo_url" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" defaultValue={mockSettings.logo_url} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Favicon URL (Direct Image Link)</label>
                      <input type="text" name="favicon_url" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" defaultValue={mockSettings.favicon_url} placeholder="https://..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-pink-400 border-b border-white/5 pb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5"/> Legal Pages Content (HTML Supported)
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 underline decoration-pink-500/30">About Us Page Content</label>
                      <textarea name="about_content" rows={6} defaultValue={mockSettings.about_content} className="w-full font-mono text-xs bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-500/20 rounded-lg p-4 text-pink-300 focus:ring-2 focus:ring-pink-500"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 underline decoration-pink-500/30">Contact Page Intro text</label>
                      <textarea name="contact_content" rows={4} defaultValue={mockSettings.contact_content} className="w-full font-mono text-xs bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-500/20 rounded-lg p-4 text-pink-300 focus:ring-2 focus:ring-pink-500"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 underline decoration-pink-500/30">Privacy Policy Body</label>
                      <textarea name="privacy_content" rows={8} defaultValue={mockSettings.privacy_content} className="w-full font-mono text-xs bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-500/20 rounded-lg p-4 text-pink-300 focus:ring-2 focus:ring-pink-500"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 underline decoration-pink-500/30">Terms & Conditions Body</label>
                      <textarea name="terms_content" rows={8} defaultValue={mockSettings.terms_content} className="w-full font-mono text-xs bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-500/20 rounded-lg p-4 text-pink-300 focus:ring-2 focus:ring-pink-500"></textarea>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-pink-400 border-b border-white/5 pb-2">Animations & Ticker</h3>
                  <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-300 dark:border-white/10">
                    <ToggleLeft className="w-8 h-8 text-pink-500" />
                    <div>
                      <div className="font-semibold">Enable Global Entrance Animations</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Toggles the Framer Motion staggered reveals</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Top Bar Ticker Text</label>
                    <input type="text" name="ticker_text" defaultValue={mockSettings.ticker_text} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-pink-400 border-b border-white/5 pb-2">Transparency Footers</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Global Transparency Disclaimer</label>
                    <textarea name="disclaimer_text" rows={3} defaultValue={mockSettings.disclaimer_text} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Ethics/Discrimination Policy</label>
                    <textarea name="ethics_discrimination_text" rows={3} defaultValue={mockSettings.ethics_discrimination_text} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500"></textarea>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-pink-400 border-b border-white/5 pb-2">Support Links</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                       <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Support Email</label>
                       <input type="email" name="support_email" defaultValue={mockSettings.support_email} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">WhatsApp URL/Number</label>
                      <input type="text" name="helpline_whatsapp" defaultValue={mockSettings.helpline_whatsapp} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Telegram URL</label>
                      <input type="text" name="helpline_telegram" defaultValue={mockSettings.helpline_telegram} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 min-h-[48px]" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="min-h-[48px] px-8 bg-pink-500 hover:bg-pink-600 text-slate-900 dark:text-white font-bold rounded-lg transition-all flex items-center gap-2">
                  {saving ? 'Syncing...' : <><Save className="w-5 h-5"/> Sync Global Config</>}
                </button>
              </form>
            </div>
          )}

          {(!['dashboard', 'apps', 'news', 'blogs', 'videos', 'categories', 'banners', 'settings'].includes(activeTab)) && (
             <div className="flex items-center justify-center h-full text-slate-500">
               Module "{activeTab}" is in development...
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
