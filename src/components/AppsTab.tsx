import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  HelpCircle, 
  Compass, 
  Type, 
  ShieldAlert, 
  MessageSquare, 
  RefreshCw, 
  ChevronRight, 
  AlertTriangle, 
  Sparkles,
  Search
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

// Sub-component for FAQ Editing
function FaqEditor({ initialFaqs }: { initialFaqs: {question: string, answer: string}[] }) {
  const [faqs, setFaqs] = useState(initialFaqs || []);

  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const removeFaq = (index: number) => setFaqs(faqs.filter((_, i) => i !== index));
  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Interactive FAQ System</h3>
      <input type="hidden" name="faqs_json" value={JSON.stringify(faqs)} />
      {faqs.map((faq, idx) => (
        <div key={idx} className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 space-y-3 relative">
          <button 
            type="button" 
            onClick={() => removeFaq(idx)} 
            className="absolute top-3 right-3 text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-1.5 rounded-lg transition-all border-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="grid gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Question</label>
              <input 
                type="text" 
                value={faq.question} 
                onChange={e => updateFaq(idx, 'question', e.target.value)} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                placeholder="e.g. Is this app safe?" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Answer (HTML supported)</label>
              <textarea 
                value={faq.answer} 
                onChange={e => updateFaq(idx, 'answer', e.target.value)} 
                rows={3} 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                placeholder="Yes, it is 100% safe..."
              ></textarea>
            </div>
          </div>
        </div>
      ))}
      <button 
        type="button" 
        onClick={addFaq} 
        className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-50 dark:bg-blue-950/20 border border-dashed border-blue-200 dark:border-blue-900/30 rounded-xl text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-950/40 transition-all font-bold cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Add FAQ Item
      </button>
    </div>
  );
}

// Main AppsTab Component
const AppsTab = React.memo(({ appsList, editingAppId, setEditingAppId, handleDeleteApp, handleSaveApp, categories, saving }: any) => {
  const editApp = editingAppId ? appsList.find((a: any) => a.id === editingAppId) : null;

  // Selected app for Inspector (not editing/adding)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Form Fields State
  const [formFields, setFormFields] = useState<any>({
    name: '',
    slug: '',
    icon_url: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    og_image_url: '',
    canonical_url: '',
    target_region: '',
    safety_status: 'Verified',
    serial_number: '',
    version: '1.0',
    file_size: 'Unknown',
    developer: 'Admin',
    rating: 5.0,
    is_new: true,
    is_coming_soon: false,
    publish_date: '',
    release_notes: '',
    more_information_url: '',
    red_box_msg: '',
    yellow_box_msg: '',
    idea_box_msg: '',
    features_html: '',
    custom_admin_box_heading: '',
    custom_admin_box_html: '',
    description_html: '',
    category_list: [] as string[],
    custom_category: '',
    faqs: [] as {question: string, answer: string}[],
  });

  const [activeFormTab, setActiveFormTab] = useState<'general' | 'seo' | 'content' | 'alerts' | 'faqs'>('general');

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Verified' | 'Caution' | 'Unsafe' | 'is_new' | 'is_coming_soon'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Sync state when editApp changes
  useEffect(() => {
    if (editingAppId !== null && editingAppId !== '') {
      setFormFields({
        name: editApp?.name || '',
        slug: editApp?.slug || '',
        icon_url: editApp?.icon_url || '',
        seo_title: editApp?.seo_title || '',
        seo_description: editApp?.seo_description || '',
        seo_keywords: editApp?.seo_keywords || '',
        og_image_url: editApp?.og_image_url || '',
        canonical_url: editApp?.canonical_url || '',
        target_region: editApp?.target_region || '',
        safety_status: editApp?.safety_status || 'Verified',
        serial_number: editApp?.serial_number !== undefined ? editApp.serial_number : '',
        version: editApp?.version || '1.0',
        file_size: editApp?.file_size || 'Unknown',
        developer: editApp?.developer || 'Admin',
        rating: editApp?.rating !== undefined ? editApp.rating : 5.0,
        is_new: editApp ? !!editApp.is_new : true,
        is_coming_soon: editApp ? !!editApp.is_coming_soon : false,
        publish_date: editApp?.publish_date ? new Date(new Date(editApp.publish_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        release_notes: editApp?.release_notes || '',
        more_information_url: editApp?.more_information_url || '',
        red_box_msg: editApp?.red_box_msg || '',
        yellow_box_msg: editApp?.yellow_box_msg || '',
        idea_box_msg: editApp?.idea_box_msg || '',
        features_html: editApp?.features_html || '',
        custom_admin_box_heading: editApp?.custom_admin_box_heading || '',
        custom_admin_box_html: editApp?.custom_admin_box_html || '',
        description_html: editApp?.description_html || '',
        category_list: editApp?.category ? editApp.category.split(',').map((c: string) => c.trim()) : [],
        custom_category: editApp?.category ? editApp.category.split(',').map((c: string) => c.trim()).filter((c: string) => !categories?.map((cg: string) => cg.toLowerCase()).includes(c.toLowerCase())).join(', ') : '',
        faqs: editApp?.faqs || []
      });
    } else if (editingAppId === '') {
      // Clear form for new app
      setFormFields({
        name: '',
        slug: '',
        icon_url: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
        og_image_url: '',
        canonical_url: '',
        target_region: '',
        safety_status: 'Verified',
        serial_number: appsList.length + 1,
        version: '1.0',
        file_size: 'Unknown',
        developer: 'Admin',
        rating: 5.0,
        is_new: true,
        is_coming_soon: false,
        publish_date: '',
        release_notes: '',
        more_information_url: '',
        red_box_msg: '',
        yellow_box_msg: '',
        idea_box_msg: '',
        features_html: '',
        custom_admin_box_heading: '',
        custom_admin_box_html: '',
        description_html: '',
        category_list: [] as string[],
        custom_category: '',
        faqs: [] as {question: string, answer: string}[],
      });
    }
  }, [editApp, editingAppId, categories, appsList.length]);

  // Auto-select first app when list loads or changes
  useEffect(() => {
    if (!selectedAppId && appsList && appsList.length > 0) {
      setSelectedAppId(appsList[0].id);
    }
  }, [appsList, selectedAppId]);

  const handleFieldChange = (field: string, value: any) => {
    setFormFields((prev: any) => ({ ...prev, [field]: value }));
  };

  // Filter appsList based on Search and Filter states
  const filteredApps = appsList.filter((app: any) => {
    const matchesSearch = 
      app.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.seo_keywords?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      categoryFilter === 'all' || 
      app.category?.toLowerCase().split(',').map((c: string) => c.trim().toLowerCase()).includes(categoryFilter.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'Verified' && app.safety_status === 'Verified') ||
      (statusFilter === 'Caution' && app.safety_status === 'Caution') ||
      (statusFilter === 'Unsafe' && app.safety_status === 'Unsafe') ||
      (statusFilter === 'is_new' && app.is_new) ||
      (statusFilter === 'is_coming_soon' && app.is_coming_soon);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedApp = appsList.find((a: any) => a.id === selectedAppId) || appsList[0];

  // Render FAQ List Accordion in Preview
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Stats Counters
  const totalAppsCount = appsList.length;
  const verifiedCount = appsList.filter((a: any) => a.safety_status === 'Verified').length;
  const cautionCount = appsList.filter((a: any) => a.safety_status === 'Caution').length;
  const unsafeCount = appsList.filter((a: any) => a.safety_status === 'Unsafe').length;
  const newCount = appsList.filter((a: any) => a.is_new).length;
  const soonCount = appsList.filter((a: any) => a.is_coming_soon).length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Metrics Row at the Top */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button 
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            statusFilter === 'all' 
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">All Catalog</div>
          <div className="text-2xl font-bold mt-1">{totalAppsCount}</div>
        </button>
        <button 
          type="button"
          onClick={() => setStatusFilter('Verified')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            statusFilter === 'Verified' 
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/20 text-slate-900 dark:text-white'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">🟢 Verified</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">{verifiedCount}</div>
        </button>
        <button 
          type="button"
          onClick={() => setStatusFilter('Caution')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            statusFilter === 'Caution' 
              ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/20 text-slate-900 dark:text-white'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">🟡 Caution</div>
          <div className="text-2xl font-bold mt-1 text-amber-500 dark:text-amber-400 group-hover:scale-105 transition-transform">{cautionCount}</div>
        </button>
        <button 
          type="button"
          onClick={() => setStatusFilter('Unsafe')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            statusFilter === 'Unsafe' 
              ? 'bg-rose-600 border-rose-600 text-white shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-500/20 text-slate-900 dark:text-white'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">🔴 Unsafe</div>
          <div className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">{unsafeCount}</div>
        </button>
        <button 
          type="button"
          onClick={() => setStatusFilter('is_new')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            statusFilter === 'is_new' 
              ? 'bg-blue-500 border-blue-500 text-white shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/20 text-slate-900 dark:text-white'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">🔥 New Badges</div>
          <div className="text-2xl font-bold mt-1 text-blue-500 dark:text-blue-400 group-hover:scale-105 transition-transform">{newCount}</div>
        </button>
        <button 
          type="button"
          onClick={() => setStatusFilter('is_coming_soon')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            statusFilter === 'is_coming_soon' 
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/20 text-slate-900 dark:text-white'
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">⏳ Soon</div>
          <div className="text-2xl font-bold mt-1 text-indigo-500 dark:text-indigo-400 group-hover:scale-105 transition-transform">{soonCount}</div>
        </button>
      </div>

      {/* Main Container - Two Columns Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Compact App List & Quick Filters */}
        <div className="lg:col-span-5 xl:col-span-5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 h-[780px] flex flex-col justify-between">
          <div className="flex flex-col h-full overflow-hidden">
            
            {/* Header row with Add App & Quick Search */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4 text-blue-500" />
                Catalog
                <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-500 dark:text-slate-400">
                  {filteredApps.length}
                </span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setEditingAppId("");
                  setActiveFormTab('general');
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New App
              </button>
            </div>

            {/* Quick Search and Dropdown Category Filter */}
            <div className="space-y-2 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apps, slug, keywords..." 
                  className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 pl-9 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-sm font-semibold p-0.5 border-0 bg-transparent cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">📁 All Categories</option>
                    {categories?.map((cat: string) => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40 rounded-xl p-2 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Apps List Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar pb-4">
              {filteredApps.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60 rounded-xl">
                  <LayoutDashboard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">No applications match your search</p>
                </div>
              ) : (
                filteredApps.map((app: any) => {
                  const isSelected = selectedAppId === app.id;
                  const isBeingEdited = editingAppId === app.id;
                  
                  return (
                    <div 
                      key={app.id}
                      onClick={() => {
                        setSelectedAppId(app.id);
                        if (editingAppId !== null && editingAppId !== app.id) {
                          setEditingAppId(null);
                        }
                      }}
                      onDoubleClick={() => {
                        setEditingAppId(app.id);
                        setActiveFormTab('general');
                      }}
                      className={`group relative rounded-xl p-3 border transition-all cursor-pointer flex items-center gap-3 select-none ${
                        isBeingEdited 
                          ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/5' 
                          : isSelected 
                            ? 'border-blue-500/60 dark:border-blue-500/40 bg-white dark:bg-slate-900 shadow-sm ring-1 ring-blue-500/5' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <img 
                        src={app.icon_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop'} 
                        className="w-11 h-11 object-cover rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 shrink-0" 
                        alt="" 
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {app.name}
                          </h4>
                          <span className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                            #{app.serial_number || 0}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {app.category}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium leading-none ${
                            app.safety_status === 'Verified' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30' 
                              : app.safety_status === 'Caution'
                                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30'
                                : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30'
                          }`}>
                            {app.safety_status === 'Verified' ? 'Verified' : app.safety_status === 'Caution' ? 'Caution' : 'Unsafe'}
                          </span>

                          {app.is_new && (
                            <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">NEW</span>
                          )}

                          {app.is_coming_soon && (
                            <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">SOON</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-transform ${isSelected ? 'translate-x-0.5 text-blue-500' : ''}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-3 mt-1.5 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span>💡 Double-click an app to edit instantly</span>
            <span className="bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded">Console Ver 1.4</span>
          </div>

        </div>

        {/* Right Column - Inspector Panel or Editing Drawer Form */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl h-[780px] flex flex-col overflow-hidden shadow-sm">
          
          {editingAppId !== null ? (
            /* ========================================================= */
            /* =============== ACTIVE FORM EDITOR MODE ================= */
            /* ========================================================= */
            <form onSubmit={handleSaveApp} className="flex flex-col h-full overflow-hidden">
              
              {/* Form Sticky Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <Edit2 className="w-4 h-4 text-blue-500 shrink-0" />
                    {editingAppId === "" ? 'Add New Application' : `Edit: ${formFields.name || 'Untitled'}`}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                    {editingAppId === "" ? 'CATALOG_CREATION_MODE' : `APP_ID: ${editingAppId}`}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setEditingAppId(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Form Secondary Tabs Strip */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto shrink-0 bg-white dark:bg-slate-900 px-3 py-1 custom-scrollbar">
                {[
                  { id: 'general', label: 'Basic Info', icon: HelpCircle },
                  { id: 'seo', label: 'SEO & Meta', icon: Compass },
                  { id: 'content', label: 'HTML Body', icon: Type },
                  { id: 'alerts', label: 'Info Alerts', icon: ShieldAlert },
                  { id: 'faqs', label: 'FAQs List', icon: MessageSquare }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeFormTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFormTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap border-0 cursor-pointer ${
                        isActive 
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10' 
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Form Scrollable Body content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/10">
                
                {activeFormTab === 'general' && (
                  <div className="animate-fade-in space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">App Name *</label>
                        <input 
                          type="text" 
                          name="name" 
                          required
                          value={formFields.name} 
                          onChange={e => handleFieldChange('name', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                          placeholder="e.g., Turbo VPN"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Slug (Auto-generated if empty)</label>
                        <input 
                          type="text" 
                          name="slug" 
                          value={formFields.slug} 
                          onChange={e => handleFieldChange('slug', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                          placeholder="e.g. turbo-vpn"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-1">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">App Icon URL</label>
                        <div className="flex gap-3 items-center">
                          <input 
                            type="text" 
                            name="icon_url" 
                            value={formFields.icon_url} 
                            onChange={e => handleFieldChange('icon_url', e.target.value)} 
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                            placeholder="https://..."
                          />
                          <img 
                            src={formFields.icon_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop'} 
                            className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 shadow-xs shrink-0" 
                            alt="preview" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop';
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-100/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/50">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Assign Categories</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories?.map((cat: string) => (
                          <label key={cat} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <input 
                              type="checkbox" 
                              name="category_list" 
                              value={cat} 
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const list = [...formFields.category_list];
                                if (checked) {
                                  if (!list.includes(cat)) list.push(cat);
                                } else {
                                  const idx = list.indexOf(cat);
                                  if (idx > -1) list.splice(idx, 1);
                                }
                                handleFieldChange('category_list', list);
                              }}
                              checked={formFields.category_list.includes(cat)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Custom Extra Categories (Comma separated)</label>
                        <input 
                          type="text" 
                          name="custom_category" 
                          placeholder="e.g. Security, Free, Premium" 
                          value={formFields.custom_category}
                          onChange={e => handleFieldChange('custom_category', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">App Status *</label>
                        <select 
                          name="safety_status" 
                          value={formFields.safety_status} 
                          onChange={e => handleFieldChange('safety_status', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Verified">🟢 Verified (Green)</option>
                          <option value="Caution">🟡 Caution (Yellow)</option>
                          <option value="Unsafe">🔴 Unsafe (Red)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Sort Order # *</label>
                        <input 
                          type="number" 
                          name="serial_number" 
                          required
                          value={formFields.serial_number} 
                          onChange={e => handleFieldChange('serial_number', parseInt(e.target.value) || 0)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Rating (Out of 10) *</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0.0" 
                          max="10.0" 
                          name="rating" 
                          required
                          value={formFields.rating} 
                          onChange={e => handleFieldChange('rating', parseFloat(e.target.value) || 5.0)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Version *</label>
                        <input 
                          type="text" 
                          name="version" 
                          required
                          value={formFields.version} 
                          onChange={e => handleFieldChange('version', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                          placeholder="e.g. 2.4.1"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">File Size *</label>
                        <input 
                          type="text" 
                          name="file_size" 
                          required
                          value={formFields.file_size} 
                          onChange={e => handleFieldChange('file_size', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                          placeholder="e.g. 28.4 MB"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Developer *</label>
                        <input 
                          type="text" 
                          name="developer" 
                          required
                          value={formFields.developer} 
                          onChange={e => handleFieldChange('developer', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-xs">New Release Badge</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Show glowing NEW tag on app icon.</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              name="is_new" 
                              checked={formFields.is_new} 
                              onChange={e => handleFieldChange('is_new', e.target.checked)} 
                              className="sr-only peer" 
                            />
                            <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-xs">Coming Soon Status</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Prevent gateway triggers on frontend.</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              name="is_coming_soon" 
                              checked={formFields.is_coming_soon} 
                              onChange={e => handleFieldChange('is_coming_soon', e.target.checked)} 
                              className="sr-only peer" 
                            />
                            <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50/20 dark:bg-indigo-950/5 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1">Publish Launch Timer (Local Time)</label>
                      <input 
                        type="datetime-local" 
                        name="publish_date" 
                        value={formFields.publish_date} 
                        onChange={e => handleFieldChange('publish_date', e.target.value)} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                      />
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">If set, app remains locked for general users until this precise timestamp is reached.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Release Notes (What's New text format)</label>
                      <textarea 
                        name="release_notes" 
                        value={formFields.release_notes} 
                        onChange={e => handleFieldChange('release_notes', e.target.value)} 
                        rows={3} 
                        placeholder="* Fixed security bypass issue&#10;* Improved memory allocation efficiency" 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                      ></textarea>
                    </div>
                  </div>
                )}

                {activeFormTab === 'seo' && (
                  <div className="animate-fade-in space-y-5">
                    
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Live Google SERP Simulator Preview</label>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs max-w-full font-sans">
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 font-normal truncate flex items-center gap-1">
                          <span>https://apk-gatekeeper.com</span>
                          <span className="text-slate-400">› {formFields.slug || 'url-slug'}</span>
                        </div>
                        <div className="text-[18px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer leading-tight truncate mt-0.5">
                          {formFields.seo_title || formFields.name || 'Set SEO title below...'}
                        </div>
                        <p className="text-[13px] text-slate-600 dark:text-slate-400 font-normal leading-normal mt-1 line-clamp-2">
                          {formFields.seo_description || 'Write an eye-catching SEO description to maximize organic click-through rate on Google...'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">SEO Meta Title Tag</label>
                      <input 
                        type="text" 
                        name="seo_title" 
                        value={formFields.seo_title} 
                        onChange={e => handleFieldChange('seo_title', e.target.value)} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                        placeholder="e.g. Free VPN Download - Safe APK Gatekeeper"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">SEO Description Tag</label>
                      <textarea 
                        name="seo_description" 
                        value={formFields.seo_description} 
                        onChange={e => handleFieldChange('seo_description', e.target.value)} 
                        rows={3} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                        placeholder="Securely download VPN tool. Rated 4.8/5 on catalog."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">SEO Meta Keywords</label>
                      <input 
                        type="text" 
                        name="seo_keywords" 
                        value={formFields.seo_keywords} 
                        onChange={e => handleFieldChange('seo_keywords', e.target.value)} 
                        placeholder="Comma separated: vpn, secure, tools, download" 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Canonical URL</label>
                        <input 
                          type="url" 
                          name="canonical_url" 
                          value={formFields.canonical_url} 
                          onChange={e => handleFieldChange('canonical_url', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Audience Region</label>
                        <input 
                          type="text" 
                          name="target_region" 
                          value={formFields.target_region} 
                          onChange={e => handleFieldChange('target_region', e.target.value)} 
                          placeholder="Global" 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">OpenGraph OG Image URL (Social Sharing thumbnail)</label>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="text" 
                          name="og_image_url" 
                          value={formFields.og_image_url} 
                          onChange={e => handleFieldChange('og_image_url', e.target.value)} 
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                          placeholder="https://..."
                        />
                        <img 
                          src={formFields.og_image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80'} 
                          className="w-16 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 shadow-xs shrink-0" 
                          alt="og-preview" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'content' && (
                  <div className="animate-fade-in space-y-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Primary Gateway Access Link (Target URL to secure & encrypt)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          name="more_information_url" 
                          value={formFields.more_information_url} 
                          onChange={e => handleFieldChange('more_information_url', e.target.value)} 
                          placeholder="https://..." 
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                        />
                        {formFields.more_information_url.startsWith('U2FsdGVkX1') && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const token = await auth.currentUser?.getIdToken();
                                const res = await fetch('/api/v1/admin/decrypt-url', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ encryptedUrl: formFields.more_information_url })
                                });
                                const data = await res.json();
                                if (data.decrypted) {
                                  alert('Decrypted Link URL:\n' + data.decrypted);
                                } else {
                                  alert('Failed to decrypt URL.');
                                }
                              } catch(e) {
                                alert('Error decrypting URL.');
                              }
                            }}
                            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all whitespace-nowrap cursor-pointer border-0"
                          >
                            Reveal Link
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">On save, APK-Gatekeeper will securely hash and encrypt this link on the server, keeping backend code completely invisible to client browsers.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Key Features HTML List</label>
                        <textarea 
                          name="features_html" 
                          value={formFields.features_html} 
                          onChange={e => handleFieldChange('features_html', e.target.value)} 
                          rows={6} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-blue-500"
                          placeholder="<li>Secure encryption</li>&#10;<li>Unlimited bandwidth</li>"
                        ></textarea>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Custom Extra Box Banner Title</label>
                          <input 
                            type="text" 
                            name="custom_admin_box_heading" 
                            value={formFields.custom_admin_box_heading} 
                            onChange={e => handleFieldChange('custom_admin_box_heading', e.target.value)} 
                            placeholder="e.g. SPECIAL COMPATIBILITY NOTE"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Custom Extra Box HTML Description</label>
                          <textarea 
                            name="custom_admin_box_html" 
                            value={formFields.custom_admin_box_html} 
                            onChange={e => handleFieldChange('custom_admin_box_html', e.target.value)} 
                            rows={3} 
                            placeholder="<p>This VPN might require Google Services framework to operate optimally on newer tablets.</p>"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-blue-400 focus:outline-none focus:border-blue-500"
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Full Description Rich HTML Body</label>
                      <textarea 
                        name="description_html" 
                        value={formFields.description_html} 
                        onChange={e => handleFieldChange('description_html', e.target.value)} 
                        rows={12} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                        placeholder="<p>Write standard paragraph HTML here...</p>"
                      ></textarea>
                    </div>
                  </div>
                )}

                {activeFormTab === 'alerts' && (
                  <div className="animate-fade-in space-y-5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure Markdown system notifications displayed in full-width alert cards directly on the app download page.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-rose-500 mb-1">🔴 Danger / Security Alert Box (Markdown)</label>
                        <textarea 
                          name="red_box_msg" 
                          value={formFields.red_box_msg} 
                          onChange={e => handleFieldChange('red_box_msg', e.target.value)} 
                          rows={3} 
                          className="w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-2.5 text-xs font-semibold text-rose-800 dark:text-rose-100 focus:outline-none focus:border-rose-500"
                          placeholder="e.g. **CRITICAL:** Use of this older version is no longer recommended due to vulnerabilities."
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1">🟡 Warning / Caution Alert Box (Markdown)</label>
                        <textarea 
                          name="yellow_box_msg" 
                          value={formFields.yellow_box_msg} 
                          onChange={e => handleFieldChange('yellow_box_msg', e.target.value)} 
                          rows={3} 
                          className="w-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-2.5 text-xs font-semibold text-amber-800 dark:text-amber-100 focus:outline-none focus:border-amber-500"
                          placeholder="e.g. **NOTICE:** This app currently shows high battery overhead on Android 14."
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-1">🟢 Tip / Recommendation Alert Box (Markdown)</label>
                        <textarea 
                          name="idea_box_msg" 
                          value={formFields.idea_box_msg} 
                          onChange={e => handleFieldChange('idea_box_msg', e.target.value)} 
                          rows={3} 
                          className="w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-100 focus:outline-none focus:border-emerald-500"
                          placeholder="e.g. **TIP:** Select the nearest node during VPN startup for 40% faster latency."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'faqs' && (
                  <div className="animate-fade-in space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage interactive FAQs specific to this application. FAQs support structured HTML and formatting.</p>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                      <FaqEditor key={(editingAppId || 'new') + '_' + (formFields.faqs?.length || 0)} initialFaqs={formFields.faqs || []} />
                    </div>
                  </div>
                )}

              </div>

              {/* Form Sticky Action Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <button 
                  type="button"
                  onClick={() => setEditingAppId(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer border-0"
                >
                  {saving ? 'Synchronizing...' : <><Save className="w-3.5 h-3.5"/> Publish App Configuration</>}
                </button>
              </div>

            </form>
          ) : (
            /* ========================================================= */
            /* ================ INACTIVE DETAIL VIEW MODE ============== */
            /* ========================================================= */
            <div className="flex flex-col h-full overflow-hidden">
              {selectedApp ? (
                <div className="flex flex-col h-full">
                  
                  {/* Selected App Header panel */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 flex items-start gap-4 shrink-0">
                    <img 
                      src={selectedApp.icon_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop'} 
                      className="w-16 h-16 object-cover rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 bg-slate-100" 
                      alt="" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm">
                          {selectedApp.name}
                        </h3>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                          Order #{selectedApp.serial_number || 0}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Folder: <span className="text-blue-500 dark:text-blue-400 font-semibold">{selectedApp.category}</span>
                      </p>

                      <div className="flex gap-2 mt-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingAppId(selectedApp.id);
                            setActiveFormTab('general');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/40 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Configuration
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDeleteApp(selectedApp.id)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selected App Body Panel (Previews & Detailed Metrics) */}
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-white dark:bg-slate-900">
                    
                    {/* Google SERP Preview simulator */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-500" />
                        Google SEO Listing Simulation
                      </h4>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs max-w-full font-sans">
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 font-normal truncate flex items-center gap-1">
                          <span>https://apk-gatekeeper.com</span>
                          <span className="text-slate-400">› apps › {selectedApp.slug || selectedApp.id}</span>
                        </div>
                        <div className="text-[18px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer leading-tight truncate mt-0.5">
                          {selectedApp.seo_title || selectedApp.name}
                        </div>
                        <p className="text-[13px] text-slate-600 dark:text-slate-400 font-normal leading-normal mt-1 line-clamp-2">
                          {selectedApp.seo_description || `Download ${selectedApp.name} for Android. Fully scanned, verified safe and offline bypass setup complete. Size: ${selectedApp.file_size || 'Unknown'}...`}
                        </p>
                      </div>
                    </div>

                    {/* Basic Meta Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rating Score</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1">
                          ⭐ {selectedApp.rating !== undefined ? selectedApp.rating : 5.0} <span className="text-[10px] text-slate-400 font-normal">/ 10</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Package Size</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                          📦 {selectedApp.file_size || 'Unknown'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">App Version</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                          ℹ️ {selectedApp.version || '1.0'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Developer</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 truncate" title={selectedApp.developer}>
                          💻 {selectedApp.developer || 'Admin'}
                        </div>
                      </div>
                    </div>

                    {/* Custom alerts visualization */}
                    {(selectedApp.red_box_msg || selectedApp.yellow_box_msg || selectedApp.idea_box_msg) && (
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Live Notification Alerts Previews</h4>
                        
                        {selectedApp.red_box_msg && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-800 dark:text-rose-300 flex gap-2.5 items-start">
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold block mb-0.5 text-rose-900 dark:text-rose-400">RED CRITICAL NOTICE</strong>
                              <span className="font-medium">{selectedApp.red_box_msg}</span>
                            </div>
                          </div>
                        )}

                        {selectedApp.yellow_box_msg && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2.5 items-start">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold block mb-0.5 text-amber-900 dark:text-amber-400">YELLOW ALERT NOTICE</strong>
                              <span className="font-medium">{selectedApp.yellow_box_msg}</span>
                            </div>
                          </div>
                        )}

                        {selectedApp.idea_box_msg && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 flex gap-2.5 items-start">
                            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold block mb-0.5 text-emerald-900 dark:text-emerald-400">GREEN RECOMMENDATION TIP</strong>
                              <span className="font-medium">{selectedApp.idea_box_msg}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SEO Keywords panel */}
                    {selectedApp.seo_keywords && (
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">SEO Discovery Tags</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedApp.seo_keywords.split(',').map((keyword: string, idx: number) => (
                            <span key={idx} className="bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-semibold">
                              #{keyword.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description HTML content summary */}
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">HTML Body Length Indicators</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
                          <span>Description:</span>
                          <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-slate-500">
                            {selectedApp.description_html?.length || 0} chars
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
                          <span>Features List:</span>
                          <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-slate-500">
                            {selectedApp.features_html?.length || 0} chars
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selected App Interactive FAQs preview */}
                    {selectedApp.faqs && selectedApp.faqs.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                          FAQ Items Accordion ({selectedApp.faqs.length})
                        </h4>
                        <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedApp.faqs.map((faq: any, idx: number) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                              <div key={idx} className="bg-slate-50/20 dark:bg-slate-900/10 text-xs">
                                <button 
                                  type="button"
                                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                  className="w-full text-left p-3.5 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer border-0"
                                >
                                  <span>{faq.question}</span>
                                  <span className="text-slate-400 font-bold">{isOpen ? '−' : '+'}</span>
                                </button>
                                {isOpen && (
                                  <div 
                                    className="p-3.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800"
                                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/10">
                  <LayoutDashboard className="w-14 h-14 text-slate-300 dark:text-slate-700 animate-pulse mb-3" />
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Catalog is Empty</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                    Click the "New App" button in the upper corner to construct your very first app configuration.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
});

export default AppsTab;
