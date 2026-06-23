/**
 * AdminDashboard modification control panel
 * Supports managing banners, directories, video walkthroughs, and blogs, synchronized live with DB.
 */

import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getAdminPath } from '../lib/utils';
import { LayoutDashboard, Users, FileText, Settings, ShieldAlert, Shield, LogOut, Save, Upload, Type, Link as LinkIcon, ToggleLeft, Layers, Newspaper, Plus, Trash2, Video as VideoIcon, Github, GitBranch, RefreshCw, CheckCircle2, AlertTriangle, Search, MessageSquare, CheckSquare, Sparkles, Compass, HelpCircle, Edit2, ChevronRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { db, auth } from '../lib/firebase';
import { AppConfig, GlobalSettings, NewsItem, BlogPost, VideoItem } from '../lib/staticData';

import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { generateStaticDataFileCode } from '../lib/githubSync';
import AppsTab from '../components/AppsTab';

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
      <h3 className="font-black text-lg border-b-2 border-pink-500/20 pb-2 uppercase tracking-tighter text-pink-500 italic">Effective FAQ System</h3>
      <input type="hidden" name="faqs_json" value={JSON.stringify(faqs)} />
      {faqs.map((faq, idx) => (
        <div key={idx} className="bg-black/5 p-5 rounded-[1.5rem] border-2 border-black/10 space-y-4 relative shadow-lg">
          <button type="button" onClick={() => removeFaq(idx)} className="absolute top-4 right-4 text-rose-500 hover:text-rose-600 bg-rose-500/10 p-2 rounded-full transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid gap-4">
            <div>
              <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic">Question</label>
              <input type="text" value={faq.question} onChange={e => updateFaq(idx, 'question', e.target.value)} className="w-full bg-white border-2 border-black/10 rounded-xl p-3 focus:ring-2 focus:ring-pink-500 font-bold" placeholder="e.g. Is this app safe?" />
            </div>
            <div>
              <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic">Answer (HTML supported)</label>
              <textarea value={faq.answer} onChange={e => updateFaq(idx, 'answer', e.target.value)} rows={4} className="w-full bg-white border-2 border-black/10 rounded-xl p-3 focus:ring-2 focus:ring-pink-500 font-medium" placeholder="Yes, it is 100% safe..."></textarea>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addFaq} className="w-full flex items-center justify-center gap-2 py-4 bg-pink-500/10 border-2 border-dashed border-pink-500/30 rounded-2xl text-sm text-pink-500 hover:bg-pink-500/20 transition-all font-black uppercase tracking-widest italic">
        <Plus className="w-5 h-5" /> Add New FAQ Item
      </button>
    </div>
  );
}

// Memoized Sidebar Item
const SidebarItem = React.memo(({ 
  id, 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  id: string, 
  active: boolean, 
  onClick: (id: string) => void, 
  icon: any, 
  label: string 
}) => {
  return (
    <button 
      onClick={() => onClick(id)}
      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all min-h-[48px] font-semibold text-sm group border-0 cursor-pointer ${
        active 
          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/15' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon className={`w-4 h-4 transition-transform group-active:scale-95 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} /> 
      {label}
    </button>
  );
});

// Extraction of Tab Content Components for better performance
const DashboardTab = React.memo(({ apps, news }: { apps: any[], news: any[] }) => (
  <div className="animate-fade-in space-y-6">
    <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Overview</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time stats and platform health metrics.</p>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/85 p-6 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Apps</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{apps.length}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <FileText className="w-6 h-6" />
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/85 p-6 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total News</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{news.length}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Newspaper className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/85 p-6 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pending Reviews</div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">12</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/85 p-6 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Gateway Health</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Compass className="w-6 h-6" />
        </div>
      </div>
    </div>
  </div>
));

// Redefined AppsTab to use the new modular component.
/*
const OldAppsTabUnused = React.memo(({ appsList, editingAppId, setEditingAppId, handleDeleteApp, handleSaveApp, categories, saving, faqsJson }: any) => {
  const editApp = editingAppId ? appsList.find((a: any) => a.id === editingAppId) : null;

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

  // AI Workshop State
  const [rawInput, setRawInput] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'sanitizing' | 'connecting' | 'processing' | 'success' | 'error'>('idle');
  const [aiError, setAiError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Sync state when editApp changes
  useEffect(() => {
    if (editingAppId !== null) {
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
    }
  }, [editApp, editingAppId, categories]);

  // Authenticate admin locally & unlock the workspace (Step 1 matching)
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      if (!active) return;
      if (usr) {
        try {
          const idToken = await usr.getIdToken();
          const res = await fetch('/api/v1/admin/verify', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          const data = await res.json();
          if (data.authorized && active) {
            setIsUnlocked(true);
          } else if (active) {
            setIsUnlocked(false);
          }
        } catch {
          if (active) setIsUnlocked(false);
        }
      } else {
        if (active) setIsUnlocked(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    setFormFields((prev: any) => ({ ...prev, [field]: value }));
  };

  if (editingAppId !== null) {
    return (
      <div className="animate-fade-in bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8 border-b border-black/10 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-500" />
              {editingAppId ? 'Edit Application' : 'Add New Application'}
            </h2>
            {editingAppId && <p className="text-xs text-slate-500 font-mono mt-1">ID: {editingAppId}</p>}
          </div>
          <button onClick={() => setEditingAppId(null)} className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white px-4 py-2 transition-all">Cancel</button>
        </div>

        <form onSubmit={handleSaveApp} className="space-y-8">
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">General Information</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">App Name</label>
                <input type="text" name="name" value={formFields.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Custom App Slug</label>
                <input type="text" name="slug" value={formFields.slug} onChange={e => handleFieldChange('slug', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Leave blank to auto-generate" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">App Icon URL</label>
                <input type="text" name="icon_url" value={formFields.icon_url} onChange={e => handleFieldChange('icon_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Categories</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {categories?.map((cat: string) => (
                    <label key={cat} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium dark:text-white">{cat}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Custom Categories (Comma separated)</label>
                  <input 
                    type="text" 
                    name="custom_category" 
                    placeholder="e.g. Action, Featured, Live" 
                    value={formFields.custom_category}
                    onChange={e => handleFieldChange('custom_category', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">SEO & Discovery</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Title</label>
                <input type="text" name="seo_title" value={formFields.seo_title} onChange={e => handleFieldChange('seo_title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Description</label>
                <textarea name="seo_description" value={formFields.seo_description} onChange={e => handleFieldChange('seo_description', e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Keywords</label>
                <input type="text" name="seo_keywords" value={formFields.seo_keywords} onChange={e => handleFieldChange('seo_keywords', e.target.value)} placeholder="Comma separated" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">OG Image URL (Social Sharing)</label>
                <input type="text" name="og_image_url" value={formFields.og_image_url} onChange={e => handleFieldChange('og_image_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Canonical URL</label>
                <input type="url" name="canonical_url" value={formFields.canonical_url} onChange={e => handleFieldChange('canonical_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Region</label>
                <input type="text" name="target_region" value={formFields.target_region} onChange={e => handleFieldChange('target_region', e.target.value)} placeholder="Global" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">App Details & Metadata</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select name="safety_status" value={formFields.safety_status} onChange={e => handleFieldChange('safety_status', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all">
                  <option value="Verified">🟢 Verified (Green)</option>
                  <option value="Caution">🟡 Caution (Yellow)</option>
                  <option value="Unsafe">🔴 Unsafe (Red)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sort Order</label>
                <input type="number" name="serial_number" value={formFields.serial_number} onChange={e => handleFieldChange('serial_number', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Version</label>
                <input type="text" name="version" value={formFields.version} onChange={e => handleFieldChange('version', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">File Size</label>
                <input type="text" name="file_size" value={formFields.file_size} onChange={e => handleFieldChange('file_size', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Developer</label>
                <input type="text" name="developer" value={formFields.developer} onChange={e => handleFieldChange('developer', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Rating</label>
                <input type="number" step="0.1" min="0.0" max="10.0" name="rating" value={formFields.rating} onChange={e => handleFieldChange('rating', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" required />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">New App Badge</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Display "New" or "Major Update" badge.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="is_new" checked={formFields.is_new} onChange={e => handleFieldChange('is_new', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-amber-900 dark:text-amber-400 text-sm">Coming Soon Phase</div>
                  <div className="text-xs text-amber-700 dark:text-amber-500/70 mt-1">Suspend gateway clearance on the frontend.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="is_coming_soon" checked={formFields.is_coming_soon} onChange={e => handleFieldChange('is_coming_soon', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-amber-200/50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-amber-900/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-amber-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>
              <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                <label className="block text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">Publish Launch Timer (Local Time)</label>
                <input type="datetime-local" name="publish_date" value={formFields.publish_date} onChange={e => handleFieldChange('publish_date', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/50 rounded-lg p-2.5 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 transition-all" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Release Notes (What's New)</label>
            <textarea name="release_notes" value={formFields.release_notes} onChange={e => handleFieldChange('release_notes', e.target.value)} rows={3} placeholder="* Fixed bugs&#10;* Added new features" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-blue-500"/> File Access Config</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target URL (Input new HTTP URL to encrypt)</label>
              <div className="flex gap-2">
                <input type="text" name="more_information_url" value={formFields.more_information_url} onChange={e => handleFieldChange('more_information_url', e.target.value)} placeholder="https://..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
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
                          alert('Decrypted URL: ' + data.decrypted);
                        } else {
                          alert('Failed to decrypt URL.');
                        }
                      } catch(e) {
                        alert('Error decrypting URL.');
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-all whitespace-nowrap"
                  >
                    Reveal
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500"/> Custom Information Boxes</h3>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Red Alert Box (Markdown)</label>
                <textarea name="red_box_msg" value={formFields.red_box_msg} onChange={e => handleFieldChange('red_box_msg', e.target.value)} rows={3} className="w-full bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-rose-500 transition-all"></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Yellow Warning Box (Markdown)</label>
                <textarea name="yellow_box_msg" value={formFields.yellow_box_msg} onChange={e => handleFieldChange('yellow_box_msg', e.target.value)} rows={3} className="w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-amber-500 transition-all"></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Idea/Tip Box (Markdown)</label>
                <textarea name="idea_box_msg" value={formFields.idea_box_msg} onChange={e => handleFieldChange('idea_box_msg', e.target.value)} rows={3} className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"></textarea>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
             <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Content & Description (HTML Supported)</h3>
             <div className="grid gap-6 sm:grid-cols-2">
               <div>
                 <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Features HTML</label>
                 <textarea name="features_html" value={formFields.features_html} onChange={e => handleFieldChange('features_html', e.target.value)} rows={6} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-mono text-xs dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Admin Custom Box Heading</label>
                 <input type="text" name="custom_admin_box_heading" value={formFields.custom_admin_box_heading} onChange={e => handleFieldChange('custom_admin_box_heading', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all mb-4" />
                 <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Admin Custom Box HTML</label>
                 <textarea name="custom_admin_box_html" value={formFields.custom_admin_box_html} onChange={e => handleFieldChange('custom_admin_box_html', e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-mono text-xs dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
               </div>
             </div>
             
             <div>
               <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Description HTML</label>
               <textarea name="description_html" value={formFields.description_html} onChange={e => handleFieldChange('description_html', e.target.value)} rows={12} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-mono text-xs dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
             </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-500"/> FAQs Configuration</h3>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 overflow-hidden">
              <FaqEditor key={(editApp?.id || 'new') + '_' + (formFields.faqs?.length || 0)} initialFaqs={formFields.faqs || []} />
            </div>
          </div>

          <div className="pt-6 border-t border-black/10 dark:border-white/10 flex justify-end">
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all min-w-[200px] justify-center">
              {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Application</>}
            </button>
          </div>
        </form>
      </div>
    )
  }
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <LayoutDashboard className="w-5 h-5 text-blue-500" /> System Applications
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage app catalog, visibility, and configuration.</p>
        </div>
        <button onClick={() => setEditingAppId("")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm">
          <Plus className="w-4 h-4"/> Add New App
        </button>
      </div>

      {appsList.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-sm">
          <LayoutDashboard className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No applications found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Get started by creating your first app.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {appsList.map((app: any) => (
            <div key={app.id} className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex gap-4 items-start">
                <img src={app.icon_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop'} className="w-16 h-16 object-cover rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base truncate pr-2" title={app.name}>{app.name}</h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{app.category}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {app.is_new ? (
                      <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">NEW</span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-500/10 dark:ring-slate-400/20">ACTIVE</span>
                    )}
                    {app.safety_status === 'Verified' ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/10 dark:ring-emerald-400/20">Verified</span>
                    ) : app.safety_status === 'Caution' ? (
                      <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/10 dark:ring-amber-400/20">Caution</span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-rose-50 dark:bg-rose-900/30 px-2 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 ring-1 ring-inset ring-rose-600/10 dark:ring-rose-400/20">Unsafe</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <button onClick={() => setEditingAppId(app.id)} className="flex-1 flex justify-center items-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium text-sm transition-all"><Edit2 className="w-4 h-4" /> Edit</button>
                <button onClick={() => handleDeleteApp(app.id)} className="flex-none flex justify-center items-center p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-lg transition-all" title="Delete App"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
*/

const CategoriesTab = React.memo(({ categoriesList, newCatInput, setNewCatInput, handleAddCategory, handleRemoveCategory, handleSaveCategories, saving }: any) => (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
      <div>
        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-500" /> Manage Global Categories
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add or remove categories for your applications.</p>
      </div>
    </div>
    
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <form onSubmit={handleSaveCategories} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Available Categories</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {categoriesList.map((cat: string, index: number) => (
              <div key={index} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
                <span>{cat}</span>
                <button type="button" onClick={() => handleRemoveCategory(cat)} className="text-slate-400 hover:text-rose-500 transition-colors focus:outline-none">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {categoriesList.length === 0 && <span className="text-sm text-slate-500 italic">No categories added yet.</span>}
          </div>
          
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Add New Category</label>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="e.g., Finance, Gaming, Utilities"
            />
            <button 
              type="button" 
              onClick={handleAddCategory}
              className="px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              Add
            </button>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="submit" disabled={saving} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
            {saving ? 'Saving...' : <><Save className="w-4 h-4"/> Save Categories</>}
          </button>
        </div>
      </form>
    </div>
  </div>
));

const BannersTab = React.memo(({ banners, handleAddBanner, handleRemoveBanner, handleUpdateBanner, handleSaveBanners, saving }: any) => (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
      <div>
        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-500" /> Home Page Banners
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage promotional banners on the homepage.</p>
      </div>
      <button onClick={handleAddBanner} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm">
        <Plus className="w-4 h-4"/> Add Banner
      </button>
    </div>
    
    <div className="grid gap-6">
      {banners.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <p className="text-slate-500 dark:text-slate-400">No banners added yet.</p>
        </div>
      ) : (
        banners.map((banner: any, index: number) => (
          <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Banner #{index + 1}</h4>
            <button onClick={() => handleRemoveBanner(index)} className="text-rose-500 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input type="text" value={banner.image_url} onChange={(e) => handleUpdateBanner(index, 'image_url', e.target.value)} placeholder="Image URL" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
            <input type="text" value={banner.link} onChange={(e) => handleUpdateBanner(index, 'link', e.target.value)} placeholder="Link URL" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>
        ))
      )}
    </div>
    
    {banners.length > 0 && (
      <div className="flex justify-end mt-6">
        <button onClick={handleSaveBanners} disabled={saving} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
          {saving ? 'Saving...' : <><Save className="w-4 h-4"/> Save Banners</>}
        </button>
      </div>
    )}
  </div>
));

const GithubTab = React.memo(({ pushAllToGitHub, gitConfig, saveGitConfig, generatePreview, appsList }: any) => {
  const [logs, setLogs] = React.useState<string[]>([]);
  const [syncing, setSyncing] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState<string>("");
  const [localConfig, setLocalConfig] = React.useState(gitConfig || { owner: '', repo: '', branch: 'main', token: '' });

  React.useEffect(() => {
    if (gitConfig) {
      setLocalConfig(gitConfig);
    }
  }, [gitConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveGitConfig(localConfig);
      alert('GitHub Configuration Saved successfully.');
    } catch (err: any) {
      alert(`Error saving GitHub config: ${err.message}`);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setLogs(["Starting Manual GitHub Sync..."]);
    try {
      await pushAllToGitHub(undefined, (msg: string) => {
        setLogs(prev => [...prev, msg]);
      }, appsList);
      setLogs(prev => [...prev, "Sync completed successfully!"]);
    } catch (err: any) {
      setLogs(prev => [...prev, `ERROR: ${err.message || 'Push failed'}`]);
    } finally {
      setSyncing(false);
    }
  };

  const handleTogglePreview = () => {
    if (!showPreview) {
      try {
        const payload = generatePreview();
        setPreviewContent(payload);
      } catch (err) {
        setPreviewContent(`Error generating preview: ${err}`);
      }
    }
    setShowPreview(!showPreview);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <Github className="w-5 h-5 text-blue-500" /> Source Control & External Sync
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage static site generation and GitHub synchronization.</p>
        </div>
      </div>
      
      <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-2xl p-6 relative overflow-hidden">
        <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
           <ShieldAlert className="w-5 h-5" /> Security Notice
        </h3>
        <p className="text-sm text-rose-700/80 dark:text-rose-400/80 mb-2">
          The more_information_url (your private clearance redirect gateways) are encrypted before being pushed to GitHub to keep them secure.
        </p>
        <p className="text-sm text-rose-700/80 dark:text-rose-400/80">
          ⚠️ WARNING: You must configure the <code className="bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/50">AES_SECRET</code> environment variable in your Vercel/production deployment exactly as it is set here, or secure links will fail to decrypt.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2 mb-6">Repository Configuration</h3>
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Repository Owner</label>
              <input type="text" value={localConfig.owner || ''} onChange={e => setLocalConfig({...localConfig, owner: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Repository Name</label>
              <input type="text" value={localConfig.repo || ''} onChange={e => setLocalConfig({...localConfig, repo: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Branch</label>
              <input type="text" value={localConfig.branch || ''} onChange={e => setLocalConfig({...localConfig, branch: e.target.value})} placeholder="main" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">GitHub Fine-grained PAT</label>
              <input type="password" value={localConfig.token || ''} onChange={e => setLocalConfig({...localConfig, token: e.target.value})} placeholder="github_pat_..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono" required />
            </div>
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Live Synchronization Logs</h3>
        
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-[250px] overflow-y-auto font-mono text-xs text-emerald-400 space-y-1 shadow-inner">
          {logs.length === 0 ? (
            <p className="text-slate-500">System ready to synchronize target repository...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                <span>{log}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleManualSync} 
            disabled={syncing || !gitConfig?.token} 
            className="flex-1 min-h-[48px] bg-blue-600 disabled:bg-blue-600/50 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {syncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {syncing ? 'Synchronizing Repository...' : 'Trigger Full Static Build Sync'}
          </button>
          <button 
            onClick={handleTogglePreview} 
            className="flex-none px-6 min-h-[48px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            {showPreview ? 'Hide Payload' : 'Preview Payload'}
          </button>
        </div>

        {showPreview && (
          <div className="mt-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2 mb-4">Generated Payload (staticData.ts)</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-[400px] overflow-y-auto font-mono text-xs text-slate-300 shadow-inner whitespace-pre-wrap">
              {previewContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const SettingsTab = React.memo(({ mockSettings, handleSaveSettings, saving }: any) => (
  <div className="animate-fade-in space-y-8">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
      <div>
        <h2 className="text-xl font-bold dark:text-white">Global Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage global identity, content, and legal text.</p>
      </div>
    </div>
    <form onSubmit={handleSaveSettings} className="space-y-8">
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Branding & Identity</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Site Title</label>
            <input type="text" name="site_title" defaultValue={mockSettings.site_title} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Global SEO Description</label>
            <input type="text" name="meta_description" defaultValue={mockSettings.meta_description} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Global SEO Keywords (Comma Separated)</label>
            <input type="text" name="seo_keywords" defaultValue={mockSettings.seo_keywords} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Google Analytics ID</label>
            <input type="text" name="ga_tracking_id" defaultValue={mockSettings.ga_tracking_id || mockSettings.google_analytics_id} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="G-XXXXXXXXXX" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Main Logo URL</label>
            <input type="text" name="logo_url" defaultValue={mockSettings.logo_url} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Favicon URL</label>
            <input type="text" name="favicon_url" defaultValue={mockSettings.favicon_url} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Main Index Heading</label>
            <input type="text" name="secure_index_title" defaultValue={mockSettings.secure_index_title || 'Secure Index'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Main Index Subtitle</label>
            <input type="text" name="secure_index_subtitle" defaultValue={mockSettings.secure_index_subtitle || 'Verified & Transparent App Marketplace'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Trending Searches (Comma Separated)</label>
            <input type="text" name="trending_searches" defaultValue={mockSettings.trending_searches ? (Array.isArray(mockSettings.trending_searches) ? mockSettings.trending_searches.join(', ') : mockSettings.trending_searches) : ''} placeholder="e.g. Yono, Rummy Game, Bingo 101" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Legal Content</h3>
        <div className="grid gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">About Us Page Content (HTML)</label>
            <textarea name="about_content" rows={12} defaultValue={mockSettings.about_content} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs font-mono dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Privacy Policy Body (HTML)</label>
            <textarea name="privacy_content" rows={12} defaultValue={mockSettings.privacy_content} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs font-mono dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Terms & Conditions Body (HTML)</label>
            <textarea name="terms_content" rows={12} defaultValue={mockSettings.terms_content} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs font-mono dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Platform Responsibility Clause (HTML)</label>
            <textarea name="responsibility_content" rows={12} defaultValue={mockSettings.responsibility_content} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs font-mono dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="<p>Our commitment to user safety...</p>"></textarea>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">App Store & Disclaimers</h3>
        <div className="grid gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Portal Main Heading</label>
            <input type="text" name="portal_heading" defaultValue={mockSettings.portal_heading} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Disclaimer Heading</label>
              <input type="text" name="disclaimer_heading" defaultValue={mockSettings.disclaimer_heading} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ethics Heading</label>
              <input type="text" name="ethics_heading" defaultValue={mockSettings.ethics_heading} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Disclaimer Text (HTML supported)</label>
            <textarea name="disclaimer_text" rows={3} defaultValue={mockSettings.disclaimer_text} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ethics Text (HTML supported)</label>
            <textarea name="ethics_discrimination_text" rows={3} defaultValue={mockSettings.ethics_discrimination_text} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Important Notice Heading (More Info URL Page)</label>
            <input type="text" name="important_notice_heading" defaultValue={mockSettings.important_notice_heading} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Important Notice Content</label>
            <textarea name="important_notice" rows={2} defaultValue={mockSettings.important_notice} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Custom Website Title Banner</h3>
        <div className="grid gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Enable Title Banner</label>
              <select name="hero_title_visible" defaultValue={mockSettings.hero_title_visible !== false ? 'true' : 'false'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="true">Show Hero Banner</option>
                <option value="false">Hide Hero Banner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Banner Writing Style (Font Concept)</label>
              <select name="hero_title_style" defaultValue={mockSettings.hero_title_style || 'modern'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="modern">Modern Display (Space Grotesk - Extra Black)</option>
                <option value="serif">Elegant Editorial (Playfair - High Contrast)</option>
                <option value="mono">Cyber Industrial (JetBrains Mono - Tech Accent)</option>
                <option value="elegant">Neo-Minimal (Inter - Balanced Sans-Serif)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Gradient Color Palette</label>
              <select name="hero_title_color" defaultValue={mockSettings.hero_title_color || 'classic-dark'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="classic-dark">Classic High-Contrast</option>
                <option value="emerald-indigo">Emerald To Indigo</option>
                <option value="neon-sky">Neon Sky</option>
                <option value="sunset-fire">Sunset Fire</option>
                <option value="cosmic-purple">Nebula Pink</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Animation Design</label>
              <select name="hero_title_animation" defaultValue={mockSettings.hero_title_animation || 'fade-in'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="fade-in">Fade In (Smooth Dissolve)</option>
                <option value="slide-up" className="dark:bg-zinc-900">Slide Up (Sleek Bottom-Up Gliding)</option>
                <option value="bounce-in" className="dark:bg-zinc-900">Bounce Zoom (Snapping Elastic Expansion)</option>
                <option value="zoom-out" className="dark:bg-zinc-900">Cinematic Zoom Out (Slow Depth Entrance)</option>
                <option value="glow-pulse" className="dark:bg-zinc-900">Pulse Glow (Ethereal Periodic Illumination)</option>
                <option value="none" className="dark:bg-zinc-900">No Animation (Static Plain Render)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Hero Banner Writing Text (Title)</label>
            <input type="text" name="hero_title_text" defaultValue={mockSettings.hero_title_text || 'RUMMY STORE GAMING DIRECTORY'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Hero Tagline / Subtitle</label>
            <input type="text" name="hero_title_subtitle" defaultValue={mockSettings.hero_title_subtitle || 'COMPREHENSIVE SOCIAL CASUAL E-SPORTS METRICS & UNBIASED INTEGRITY REVIEWS'} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Support & Ticker</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Announcement Ticker Text</label>
            <input type="text" name="ticker_text" defaultValue={mockSettings.ticker_text} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Support Email</label>
            <input type="email" name="support_email" defaultValue={mockSettings.support_email} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Telegram Link</label>
            <input type="text" name="helpline_telegram" defaultValue={mockSettings.helpline_telegram} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">WhatsApp Link</label>
            <input type="text" name="helpline_whatsapp" defaultValue={mockSettings.helpline_whatsapp} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Social Media Links</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Facebook URL</label>
            <input type="text" name="social_facebook" defaultValue={mockSettings.social_links?.facebook} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Instagram URL</label>
            <input type="text" name="social_instagram" defaultValue={mockSettings.social_links?.instagram} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Twitter / X URL</label>
            <input type="text" name="social_twitter" defaultValue={mockSettings.social_links?.twitter} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">LinkedIn URL</label>
            <input type="text" name="social_linkedin" defaultValue={mockSettings.social_links?.linkedin} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">YouTube URL</label>
            <input type="text" name="social_youtube" defaultValue={mockSettings.social_links?.youtube} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
          {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Settings</>}
        </button>
      </div>
    </form>
  </div>
));

const NewsTab = React.memo(({ newsList, handleAddNews, handleDeleteNews, handleNewsChange, saveMockNews, saving, setSaving, appsList }: any) => {
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  return (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white"><Newspaper className="w-5 h-5 text-blue-500" /> News System</h2>
      <button onClick={() => {
        const newId = handleAddNews();
        setEditingNewsId(newId);
      }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"><Plus className="w-4 h-4" /> Add News Item</button>
    </div>
    <div className="space-y-4">
      {newsList.map((item: any) => (
        <div key={item.id} className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          {editingNewsId === item.id ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-black/10 dark:border-white/10 pb-4 mb-4 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Edit News</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">ID: {item.id}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button onClick={() => handleDeleteNews(item.id)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-600 px-4 py-2 rounded-lg font-semibold text-sm transition-all"><Trash2 className="w-4 h-4" /> Delete</button>
                  <button onClick={() => setEditingNewsId(null)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all">Close</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">General Information</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Title</label>
                    <input type="text" value={item.title} onChange={e => handleNewsChange(item.id, 'title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="News Title" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Slug (URL)</label>
                      <input type="text" value={item.slug} onChange={e => handleNewsChange(item.id, 'slug', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                      <input type="text" value={item.category || ''} onChange={e => handleNewsChange(item.id, 'category', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Logo URL</label>
                      <input type="text" value={item.logo_url} onChange={e => handleNewsChange(item.id, 'logo_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Short Description</label>
                    <textarea value={item.description} onChange={e => handleNewsChange(item.id, 'description', e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"></textarea>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2 mt-6">Leadership / CEO Config</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">CEO Name</label>
                      <input type="text" value={item.ceo_name} onChange={e => handleNewsChange(item.id, 'ceo_name', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">CEO Role/Title</label>
                      <input type="text" value={item.ceo_description} onChange={e => handleNewsChange(item.id, 'ceo_description', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">SEO & Social Meta</h4>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Title</label>
                      <input type="text" value={item.seo_title} onChange={e => handleNewsChange(item.id, 'seo_title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Description</label>
                      <textarea value={item.seo_description} onChange={e => handleNewsChange(item.id, 'seo_description', e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"></textarea>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Social OG Image</label>
                        <input type="text" value={item.og_image_url} onChange={e => handleNewsChange(item.id, 'og_image_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Canonical URL</label>
                        <input type="text" value={item.canonical_url} onChange={e => handleNewsChange(item.id, 'canonical_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Region</label>
                        <input type="text" value={item.target_region} onChange={e => handleNewsChange(item.id, 'target_region', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="Global" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Keywords</label>
                        <input type="text" value={item.seo_keywords} onChange={e => handleNewsChange(item.id, 'seo_keywords', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="Comma separated" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Source Link</label>
                        <input type="text" value={item.link} onChange={e => handleNewsChange(item.id, 'link', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                      </div>
                    </div>
                    <div className="pt-4">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Related Application ID (Optional)</label>
                      <select 
                        value={item.related_app_id || ''} 
                        onChange={e => handleNewsChange(item.id, 'related_app_id', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="">No App Linked</option>
                        {appsList && appsList.map((app: any) => (
                          <option key={app.id} value={app.id}>{app.name} ({app.id})</option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Full HTML / Markdown Content</h4>
                <textarea value={item.content} onChange={e => handleNewsChange(item.id, 'content', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-slate-200 font-mono text-sm shadow-inner min-h-[400px] focus:ring-2 focus:ring-blue-500 transition-all" placeholder="HTML content here..."></textarea>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  {item.logo_url ? (
                    <img src={item.logo_url} className="w-16 h-16 object-cover rounded-xl border border-black/10 shadow-sm" alt={item.title} />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <Newspaper className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg dark:text-white">{item.title || 'Untitled News'}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{item.category || "Uncategorized"} • {new Date(item.date).toLocaleDateString()}</p>
                    {item.slug && <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1">{item.slug}</p>}
                  </div>
                </div>
                <button onClick={() => setEditingNewsId(item.id)} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm transition-all"><Edit2 className="w-4 h-4" /> Edit</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
    <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex justify-end">
      <button 
        onClick={async () => {
          setSaving(true);
          try {
            await saveMockNews(newsList);
            alert('News successfully saved and synchronized.');
          } catch(e) {
            console.error(e);
            alert('Failed to save news.');
          }
          setSaving(false);
        }} 
        disabled={saving} 
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        {saving ? 'Synchronizing News...' : <><Save className="w-5 h-5"/> Sync All News</>}
      </button>
    </div>
  </div>
  );
});

const BlogsTab = React.memo(({ blogs, handleAddBlog, handleDeleteBlog, handleBlogChange, handleSaveBlogs, saving }: any) => {
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

  return (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white"><FileText className="w-5 h-5 text-blue-500" /> App Updates</h2>
      <button onClick={() => {
        handleAddBlog();
      }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"><Plus className="w-4 h-4" /> Add Update</button>
    </div>
    <div className="space-y-4">
      {blogs.map((blog: any) => (
        <div key={blog.id} className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          {editingBlogId === blog.id ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-black/10 dark:border-white/10 pb-4 mb-4 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Edit Update</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">ID: {blog.id}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button onClick={() => handleDeleteBlog(blog.id)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-600 px-4 py-2 rounded-lg font-semibold text-sm transition-all"><Trash2 className="w-4 h-4" /> Delete</button>
                  <button onClick={() => setEditingBlogId(null)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all">Close</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">General Information</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Update Title</label>
                    <input type="text" value={blog.title} onChange={(e) => handleBlogChange(blog.id, 'title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="Update Title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">URL Slug</label>
                      <input type="text" value={blog.slug} onChange={(e) => handleBlogChange(blog.id, 'slug', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Author Name</label>
                      <input type="text" value={blog.author} onChange={(e) => handleBlogChange(blog.id, 'author', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Related App Slug</label>
                      <input type="text" value={blog.related_app_slug || ''} onChange={(e) => handleBlogChange(blog.id, 'related_app_slug', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="app-slug" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Related App Name</label>
                      <input type="text" value={blog.related_app_name || ''} onChange={(e) => handleBlogChange(blog.id, 'related_app_name', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="App Name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Cover Image URL</label>
                    <input type="text" value={blog.cover_url} onChange={(e) => handleBlogChange(blog.id, 'cover_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  </div>

                  <div className="pt-4 mt-2 border-t border-black/5 dark:border-white/5 space-y-4">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">SEO Configuration</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Title</label>
                      <input type="text" value={blog.seo_title || ''} onChange={(e) => handleBlogChange(blog.id, 'seo_title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Keywords</label>
                      <input type="text" value={blog.seo_keywords || ''} onChange={(e) => handleBlogChange(blog.id, 'seo_keywords', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="keyword1, keyword2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Canonical URL</label>
                        <input type="text" value={blog.canonical_url || ''} onChange={(e) => handleBlogChange(blog.id, 'canonical_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Region</label>
                        <input type="text" value={blog.target_region || ''} onChange={(e) => handleBlogChange(blog.id, 'target_region', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Global" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Description</label>
                      <textarea value={blog.seo_description || ''} onChange={(e) => handleBlogChange(blog.id, 'seo_description', e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"></textarea>
                    </div>
                  </div>
                  
                  {blog.cover_url && (
                    <div className="pt-2">
                      <img src={blog.cover_url} className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" alt="Preview" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Full HTML / Markdown Content</h4>
                  <textarea value={blog.content} onChange={(e) => handleBlogChange(blog.id, 'content', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-slate-200 font-mono text-sm shadow-inner min-h-[600px] focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter HTML or Markdown content..."></textarea>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {blog.cover_url && (
                  <img src={blog.cover_url} className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700" alt={blog.title} />
                )}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{blog.title || 'Untitled Update'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{blog.author} • {new Date(blog.published_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => setEditingBlogId(blog.id)} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm transition-all"><Edit2 className="w-4 h-4" /> Edit</button>
            </div>
          )}
        </div>
      ))}
    </div>
    <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex justify-end">
      <button onClick={handleSaveBlogs} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all">
        {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Updates</>}
      </button>
    </div>
  </div>
  );
});

const VideosTab = React.memo(({ videosList, handleAddVideo, handleDeleteVideo, handleVideosChange, handleSaveVideos, saving }: any) => {
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  return (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white"><VideoIcon className="w-5 h-5 text-blue-500" /> Video Matrix</h2>
      <button onClick={() => {
        handleAddVideo();
      }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"><Plus className="w-4 h-4" /> Add Video</button>
    </div>
    <div className="space-y-4">
      {videosList.map((item: any) => (
        <div key={item.id} className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          {editingVideoId === item.id ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-black/10 dark:border-white/10 pb-4 mb-4 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Edit Video</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">ID: {item.id}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button onClick={() => handleDeleteVideo(item.id)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-600 px-4 py-2 rounded-lg font-semibold text-sm transition-all"><Trash2 className="w-4 h-4" /> Delete</button>
                  <button onClick={() => setEditingVideoId(null)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all">Close</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Stream Config</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Video Title</label>
                    <input type="text" value={item.title} onChange={e => handleVideosChange(item.id, 'title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="Title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Slug (URL)</label>
                      <input type="text" value={item.slug} onChange={e => handleVideosChange(item.id, 'slug', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">YouTube URL</label>
                      <input type="text" value={item.youtube_url} onChange={e => handleVideosChange(item.id, 'youtube_url', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Video Description</label>
                    <textarea value={item.description} onChange={e => handleVideosChange(item.id, 'description', e.target.value)} rows={4} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"></textarea>
                  </div>
                  
                  {item.youtube_url && (() => {
                    const videoIdMatch = item.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                    const videoId = videoIdMatch ? videoIdMatch[1] : null;
                    if (videoId) {
                      return (
                        <div className="pt-2">
                          <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" alt="Preview" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="space-y-5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Video SEO Armor</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Optimized Header</label>
                      <input type="text" value={item.seo_title} onChange={e => handleVideosChange(item.id, 'seo_title', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">SEO Meta String</label>
                      <textarea value={item.seo_description} onChange={e => handleVideosChange(item.id, 'seo_description', e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Search Keywords</label>
                      <input type="text" value={item.seo_keywords || ''} onChange={e => handleVideosChange(item.id, 'seo_keywords', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {(() => {
                  const videoIdMatch = item.youtube_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                  const videoId = videoIdMatch ? videoIdMatch[1] : null;
                  return videoId ? (
                    <img src={`https://img.youtube.com/vi/${videoId}/default.jpg`} className="w-16 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700" alt={item.title} />
                  ) : (
                    <div className="w-16 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <VideoIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.title || 'Untitled Video'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.slug}</p>
                </div>
              </div>
              <button onClick={() => setEditingVideoId(item.id)} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm transition-all"><Edit2 className="w-4 h-4" /> Edit</button>
            </div>
          )}
        </div>
      ))}
    </div>
    <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex justify-end">
      <button onClick={handleSaveVideos} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all">
        {saving ? 'Processing Stream...' : <><Save className="w-5 h-5"/> Publish Video Matrix</>}
      </button>
    </div>
  </div>
  );
});

interface AdminReview {
  id: string;
  app_id: string;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
  is_approved: boolean;
  source?: string;
  type: 'review' | 'ticket' | 'feedback';
  email?: string;
  status?: string;
}

const ReviewsModerationTab = ({ db }: { db: any }) => {
  const [items, setItems] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'tickets' | 'reviews' | 'feedbacks'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchModerationItems = async () => {
    setLoading(true);
    try {
      const list: AdminReview[] = [];
      
      // 1. Fetch user reviews and missing link reports
      try {
        const snap = await getDocs(collection(db, 'reviews'));
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            type: data.source === 'missing_link_report' ? 'ticket' : 'review',
            app_id: data.app_id || '',
            username: data.username || '',
            rating: Number(data.rating || 0),
            comment: data.comment || '',
            created_at: data.created_at || '',
            helpful_count: Number(data.helpful_count || 0),
            is_approved: !!data.is_approved,
            source: data.source || 'reviews_db',
          });
        });
      } catch (err) {
        console.warn("Failed to load reviews:", err);
      }

      // 2. Fetch formal customer support tickets
      try {
        const snap = await getDocs(collection(db, 'support_tickets'));
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            type: 'ticket',
            app_id: 'Support Center Form',
            username: data.username || 'Anonymous User',
            email: data.email || '',
            rating: 0,
            comment: data.comment || '',
            created_at: data.created_at || '',
            helpful_count: 0,
            is_approved: data.status === 'resolved',
            status: data.status || 'pending',
            source: data.source || 'contact_page',
          });
        });
      } catch (err) {
        console.warn("Failed to load support_tickets:", err);
      }

      // 3. Fetch instant platform feedback loops
      try {
        const snap = await getDocs(collection(db, 'website_feedback'));
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            type: 'feedback',
            app_id: 'Website Feedback Hub',
            username: data.username || 'Anonymous User',
            rating: Number(data.rating || 0),
            comment: data.comment || '',
            created_at: data.created_at || '',
            helpful_count: 0,
            is_approved: true,
            source: data.source || 'website_feedback_db',
          });
        });
      } catch (err) {
        console.warn("Failed to load website_feedback:", err);
      }

      // Sort globally by created_at descending
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(list);
    } catch (err: any) {
      console.warn("Error loading support dispatch items:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationItems();
  }, [db]);

  const handleApprove = async (id: string, type: 'review' | 'ticket' | 'feedback', isMissingLink: boolean) => {
    setActioning(id);
    try {
      if (type === 'ticket') {
        if (isMissingLink) {
          await updateDoc(doc(db, 'reviews', id), { is_approved: true });
        } else {
          await updateDoc(doc(db, 'support_tickets', id), { status: 'resolved' });
        }
      } else {
        await updateDoc(doc(db, 'reviews', id), { is_approved: true });
      }
      setItems(items.map(item => item.id === id ? { ...item, is_approved: true, status: 'resolved' } : item));
    } catch (err) {
      console.error("Failed to approve/resolve support item:", err);
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async (id: string, type: 'review' | 'ticket' | 'feedback', isMissingLink: boolean) => {
    const isReport = type === 'ticket';
    const confirmationMsg = isReport 
      ? "Resolve and permanently close this support ticket? This confirms the application access gateway has been verified and updated."
      : "Permanently delete this customer case/review?";
    
    if (!confirm(confirmationMsg)) return;
    setActioning(id);
    try {
      if (type === 'ticket') {
        if (isMissingLink) {
          await deleteDoc(doc(db, 'reviews', id));
        } else {
          await deleteDoc(doc(db, 'support_tickets', id));
        }
      } else if (type === 'feedback') {
        await deleteDoc(doc(db, 'website_feedback', id));
      } else {
        await deleteDoc(doc(db, 'reviews', id));
      }
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete support item:", err);
    } finally {
      setActioning(null);
    }
  };

  const reports = items.filter(item => item.type === 'ticket');
  const reviews = items.filter(item => item.type === 'review');
  const feedbacks = items.filter(item => item.type === 'feedback');

  const pendingReviewsCount = reviews.filter(r => !r.is_approved).length;
  const pendingTicketsCount = reports.filter(t => t.status === 'pending' || !t.is_approved).length;

  const filteredItems = items.filter(item => {
    if (activeSubTab === 'tickets' && item.type !== 'ticket') return false;
    if (activeSubTab === 'reviews' && item.type !== 'review') return false;
    if (activeSubTab === 'feedbacks' && item.type !== 'feedback') return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchApp = (item.app_id || '').toLowerCase().includes(query);
      const matchComment = (item.comment || '').toLowerCase().includes(query);
      const matchUser = (item.username || '').toLowerCase().includes(query);
      const matchEmail = (item.email || '').toLowerCase().includes(query);
      return matchApp || matchComment || matchUser || matchEmail;
    }

    return true;
  });

  return (
    <div className="animate-fade-in space-y-8">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-black/5 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 dark:text-zinc-500 font-mono">Unified Customer Service Desk</span>
          </div>
          <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter">
            Customer Support Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium font-sans">
            Triage active inbound support cases, resolve Google sign-in tickets, and reply to web platform ratings.
          </p>
        </div>
        <button 
          onClick={fetchModerationItems}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-zinc-800 border-2 border-black/10 dark:border-white/10 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <RefreshCw className="w-12 h-12 text-pink-500 animate-spin" />
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest font-mono">Fetching Unified Dispatch...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Support Telemetry Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-black/5 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Support Tickets</span>
                <div className="text-2xl font-black dark:text-white">{reports.length}</div>
                <p className="text-[9px] font-semibold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full w-fit">
                  {pendingTicketsCount} unresolved tickets
                </p>
              </div>
              <ShieldAlert className="w-10 h-10 text-rose-500 opacity-20" />
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900 border-2 border-black/5 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">App Reviews Queue</span>
                <div className="text-2xl font-black dark:text-white">{reviews.length}</div>
                <p className="text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full w-fit">
                  {pendingReviewsCount} to moderate
                </p>
              </div>
              <MessageSquare className="w-10 h-10 text-amber-500 opacity-20" />
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 border-2 border-black/5 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Platform Feedback Items</span>
                <div className="text-2xl font-black text-indigo-500 dark:text-indigo-400">{feedbacks.length}</div>
                <p className="text-[9px] font-semibold text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-full w-fit">
                  Instant portal analytics
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-indigo-500 opacity-20" />
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50 dark:bg-zinc-900/60 border-2 border-black/5 dark:border-white/5 p-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-zinc-800 rounded-xl border border-black/5 dark:border-white/5">
              <button
                onClick={() => setActiveSubTab('all')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'all' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'text-slate-500 dark:text-zinc-400'}`}
              >
                All Cases ({items.length})
              </button>
              <button
                onClick={() => setActiveSubTab('tickets')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'tickets' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:text-rose-500'}`}
              >
                Support Tickets ({reports.length})
              </button>
              <button
                onClick={() => setActiveSubTab('reviews')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'reviews' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:text-pink-500'}`}
              >
                App Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveSubTab('feedbacks')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeSubTab === 'feedbacks' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:text-indigo-500'}`}
              >
                Website Feedback ({feedbacks.length})
              </button>
            </div>

            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-200" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or comment..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border-2 border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-350 focus:outline-none focus:border-pink-500 transition-all dark:placeholder-zinc-500"
              />
            </div>
          </div>

          {/* List workspace */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-3xl py-16 px-6 text-center">
                <AlertTriangle className="w-10 h-10 text-slate-400 dark:text-zinc-500 mx-auto mb-3 opacity-60" />
                <h4 className="text-sm font-black dark:text-white uppercase tracking-wider mb-1">No Active Tickets Found</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  {searchQuery 
                    ? `No support tickets or customer reviews match your query: "${searchQuery}".`
                    : "Excellent, support dispatch queue is beautifully fully caught up!"
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {filteredItems.map((item) => {
                  const isMissingLinkReport = item.source === 'missing_link_report';
                  
                  if (item.type === 'ticket') {
                    if (isMissingLinkReport) {
                      return (
                        <div 
                          key={item.id} 
                          className="bg-white dark:bg-zinc-900 border-2 border-rose-500/20 dark:border-rose-500/10 rounded-2.5xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all hover:border-rose-500/40 relative overflow-hidden shadow-sm"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500"></div>

                          <div className="space-y-2 flex-1 pl-2">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500 text-white px-2.5 py-1 rounded-lg">
                                Link Clearance Ticket
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono">
                                App ID: <span className="font-bold underline text-slate-750 dark:text-zinc-300">{item.app_id}</span>
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 font-mono">
                                {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/10 p-3.5 rounded-xl">
                              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                {item.comment}
                              </p>
                            </div>

                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                              <span className="font-black text-rose-500">SLA Info:</span> Configure the active clearance/access gateway URL inside the App Catalog and mark this ticket as resolved.
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 border-t border-black/5 md:border-none pt-4 md:pt-0 pl-2">
                            <button
                              disabled={actioning === item.id}
                              onClick={() => handleDelete(item.id, 'ticket', true)}
                              className="w-full md:w-auto px-5 py-2.5 bg-rose-500 text-white hover:bg-rose-600 disabled:bg-rose-800 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-0"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              {actioning === item.id ? 'Loading...' : 'Mark Resolved'}
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      // Modern Contact Form Support Ticket
                      const isResolved = item.status === 'resolved' || item.is_approved;
                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white dark:bg-zinc-900 border-2 ${isResolved ? 'border-zinc-205/50 dark:border-white/5' : 'border-emerald-500/20 dark:border-emerald-500/10'} rounded-2.5xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden`}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isResolved ? 'bg-zinc-300 dark:bg-zinc-800' : 'bg-emerald-500'}`}></div>

                          <div className="flex justify-between items-start flex-wrap gap-4 pl-2">
                            <div>
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
                                  Contact Ticket Inquiry
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{item.username}</span>
                                {item.email && (
                                  <a 
                                    href={`mailto:${item.email}`}
                                    className="text-[10px] font-semibold text-blue-500 hover:underline hover:text-blue-600"
                                    title="Click to respond via mail client"
                                  >
                                    [{item.email}]
                                  </a>
                                )}
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${isResolved ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse'}`}>
                                  {isResolved ? 'Resolved' : 'Pending Action'}
                                </span>
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono mt-1.5">
                                Submitted: {new Date(item.created_at).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isResolved && (
                                <button
                                  disabled={actioning === item.id}
                                  onClick={() => handleApprove(item.id, 'ticket', false)}
                                  className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-emerald-800 font-black text-[9px] uppercase tracking-wider rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer border-0"
                                >
                                  Mark Resolved
                                </button>
                              )}
                              <button
                                disabled={actioning === item.id}
                                onClick={() => handleDelete(item.id, 'ticket', false)}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 disabled:bg-slate-200 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer border-0"
                              >
                                Delete Ticket
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-black/5 dark:border-white/5 pl-4 ml-2">
                            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                              {item.comment}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  } else if (item.type === 'feedback') {
                    // Website layout/feature rating feedback (from header widgets or quick links)
                    return (
                      <div 
                        key={item.id} 
                        className="bg-white dark:bg-zinc-900 border-2 border-indigo-500/20 dark:border-indigo-500/10 rounded-2.5xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>

                        <div className="flex justify-between items-start flex-wrap gap-4 pl-2">
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500 text-white px-2.5 py-1 rounded-lg">
                                Website Platform Feedback
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{item.username}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                                Portal Feedback
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-sm font-bold text-amber-500">
                                {'★'.repeat(item.rating)}
                                <span className="opacity-25">{'★'.repeat(Math.max(0, 5 - item.rating))}</span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono">
                                Logged: {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              disabled={actioning === item.id}
                              onClick={() => handleDelete(item.id, 'feedback', false)}
                              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 disabled:bg-slate-200 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer border-0"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-black/5 dark:border-white/5 pl-4 ml-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {item.comment}
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    // Standard App Review
                    return (
                      <div 
                        key={item.id} 
                        className="bg-white dark:bg-zinc-900 border-2 border-black/10 dark:border-white/10 rounded-2.5xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-500"></div>

                        <div className="flex justify-between items-start flex-wrap gap-4 pl-2">
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{item.username}</span>
                              <span className="text-[9px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-500 px-2.5 py-0.5 rounded-md">
                                App ID Ref: {item.app_id}
                              </span>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${item.is_approved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                {item.is_approved ? 'Published' : 'Under Review'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-sm font-bold text-amber-500">
                                {'★'.repeat(item.rating)}
                                <span className="opacity-25">{'★'.repeat(Math.max(0, 5 - item.rating))}</span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono">
                                Created: {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!item.is_approved && (
                              <button
                                disabled={actioning === item.id}
                                onClick={() => handleApprove(item.id, 'review', false)}
                                className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-emerald-800 font-black text-[9px] uppercase tracking-wider rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer border-0"
                              >
                                Approve Publication
                              </button>
                            )}
                            <button
                              disabled={actioning === item.id}
                              onClick={() => handleDelete(item.id, 'review', false)}
                              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 disabled:bg-slate-200 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer border-0"
                            >
                              Delete Review
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-black/5 dark:border-white/5 pl-4 ml-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {item.comment}
                          </p>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const { 
    apps: mockApps, 
    settings: mockSettings, 
    news: mockNews, 
    blogs: mockBlogs, 
    videos: mockVideos, 
    saveApps: saveMockApps, 
    saveSettings: saveMockSettings, 
    saveNews: saveMockNews, 
    saveBlogs: saveMockBlogs, 
    saveVideos: saveMockVideos,
    loading,
    refreshAll,
    gitConfig,
    gitConfigLoading,
    saveGitConfig,
    pushAllToGitHub
  } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [saving, setSaving] = useState(false);
  const [appsList, setAppsList] = useState(mockApps);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [newsList, setNewsList] = useState(mockNews);
  const [banners, setBanners] = useState(mockSettings.banners || []);
  const [blogs, setBlogs] = useState(mockBlogs);
  const [videosList, setVideosList] = useState(mockVideos);
  const [categoriesList, setCategoriesList] = useState<string[]>(mockSettings.categories || []);
  const [quickLinksList, setQuickLinksList] = useState(mockSettings.quick_links || []);
  const [websiteFaqsList, setWebsiteFaqsList] = useState(mockSettings.website_faqs || []);
  const [developersList, setDevelopersList] = useState(mockSettings.developers || []);
  const [newCatInput, setNewCatInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  
  // Security Stopwatch (Auto-logout after 15 mins)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(15 * 60);

  const syncSecureVault = async () => {
    if (!isInitializedRef.current) {
      console.warn("Sync blocked: vault not initialized");
      return;
    }
    if (fetchFailedRef.current) {
      console.warn("Sync blocked: previous vault fetch failed due to quota or network block. We cannot overwrite the vault without knowing its entire previous state.");
      return;
    }
    try {
      const items = Array.from(cachedSecureMapRef.current.entries()).map(([k, v]) => ({ id: k, url: v }));
      const idToken = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/v1/admin/encrypt-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const { encrypted } = await res.json();
        const payload = { encryptedData: encrypted, lastUpdated: new Date().toISOString() };
        await setDoc(doc(db, 'store_data', 'sec_vault'), payload);
        await setDoc(doc(db, 'store_data', 'secure_links'), payload);
        await setDoc(doc(db, 'store_data', 'sec_public_links'), payload);
      }
    } catch (e: any) {
      console.warn("Failed to sync secure vault (fallback tracking active):", e.message || e);
    }
  };

  useEffect(() => {
    let timerId: any;
    if (user && isAdminUser) {
      timerId = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [user, isAdminUser]);

  useEffect(() => {
    const resetTimer = () => setSessionTimeLeft(prev => {
      if (prev < 15 * 60) return 15 * 60;
      return prev;
    });
    window.addEventListener('mousemove', resetTimer, { passive: true });
    window.addEventListener('keydown', resetTimer, { passive: true });
    window.addEventListener('click', resetTimer, { passive: true });
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, []);

  const [confirmConfig, setConfirmConfig] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel',
    onConfirm: () => {}
  });

  // Use a ref to initialize state exactly once on first load
  // This shields active typed text fields from being silently discarded by background snapshots
  const cachedSecureMapRef = React.useRef(new Map());
  const isInitializedRef = React.useRef(false);
  const settingsInitializedRef = React.useRef(false);
  const fetchFailedRef = React.useRef(false);

  React.useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        let adminVerified = false;
        try {
          const idToken = await currentUser.getIdToken();
          const verifyRes = await fetch('/api/v1/admin/verify', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.authorized) {
              adminVerified = true;
            }
          }
        } catch (e) {
          console.warn("Backend verification failed or not found (static site mode). Proceeding to fallback check.");
        }

        // Static Site Offline/Client-side Fallback (checks Firestore database if backend API didn't verify)
        if (!adminVerified) {
           const fallbackAdmin = (import.meta.env.VITE_ADMIN_EMAIL || 'defentechscholar@gmail.com').toLowerCase();
           if (currentUser.emailVerified && currentUser.email?.toLowerCase() === fallbackAdmin) {
               adminVerified = true;
           } else {
               try {
                   const { doc, getDoc } = await import('firebase/firestore');
                   const uidDoc = await getDoc(doc(db, 'admins', currentUser.uid));
                   if (uidDoc.exists()) {
                       adminVerified = true;
                   } else if (currentUser.email) {
                       const emailDoc = await getDoc(doc(db, 'admins', currentUser.email));
                       if (emailDoc.exists()) adminVerified = true;
                   }
               } catch (err: any) {
                   
               }
           }
        }
        
        setIsAdminUser(adminVerified);
        setCheckingAuth(false);
      } else {
        setIsAdminUser(null);
        setCheckingAuth(false);
      }
    });
    return unsubscribe;
  }, []);

  // Initialize local states once from loaded cloud data
  React.useEffect(() => {
    if (!loading && isAdminUser !== null) {
      if (isAdminUser) {
        if (!isInitializedRef.current) {
          getDoc(doc(db, 'store_data', 'sec_public_links')).then(async (snap) => {
            let secureMap = new Map();
            let snapData = snap.exists() ? snap.data() : null;
            const hadPublicLinks = snap.exists() && snap.data()?.encryptedData;
            
            if (!snapData || (!snapData.encryptedData && !snapData.items)) {
                const slSnap = await getDoc(doc(db, 'store_data', 'secure_links'));
                if (slSnap.exists()) {
                  snapData = slSnap.data();
                } else {
                  const vaultSnap = await getDoc(doc(db, 'store_data', 'sec_vault'));
                  if (vaultSnap.exists()) snapData = vaultSnap.data();
                }
            }

            if (snapData) {
              if (snapData.encryptedData) {
                try {
                  const idToken = await auth?.currentUser?.getIdToken();
                  const res = await fetch('/api/v1/admin/decrypt-links', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ encryptedData: snapData.encryptedData })
                  });
                  if (res.ok) {
                    const decrypted = await res.json();
                    if (decrypted.items) {
                      decrypted.items.forEach((it: any) => secureMap.set(it.id, it.url));
                    }
                  } else {
                    console.warn("Server link decryption failed (using local fallback map):", await res.text());
                    fetchFailedRef.current = true;
                  }
                } catch (decErr: any) {
                  console.warn("Failed to decrypt secure references (quota or network issue):", decErr.message || decErr);
                  fetchFailedRef.current = true;
                }
              } else if (snapData.items) {
                snapData.items.forEach((it: any) => secureMap.set(it.id, it.url));
              }
            }
            
            // Always attempt to overlay with local filesystem backup (helpful on Firestore under quota 429)
            try {
              const idToken = await auth?.currentUser?.getIdToken();
              if (idToken) {
                const bkRes = await fetch('/api/v1/admin/backup-links-get', {
                  headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (bkRes.ok) {
                  const bkJSON = await bkRes.json();
                  if (bkJSON && bkJSON.items) {
                    bkJSON.items.forEach((it: any) => {
                      if (it.url) {
                        secureMap.set(it.id, it.url);
                      }
                    });
                    console.log("Overlayed secure references from container filesystem backup successfully.");
                  }
                }
              }
            } catch (bkErr) {
              console.warn("Failed to overlay with local backup:", bkErr);
            }

            cachedSecureMapRef.current = secureMap;
            const mergedApps = mockApps.map(a => ({...a, more_information_url: secureMap.get(a.id) || a.more_information_url }));
            setAppsList(mergedApps);

            if (!hadPublicLinks && secureMap.size > 0 && !fetchFailedRef.current) {
              console.log("Silently self-healing sec_public_links...");
              syncSecureVault();
            }
          }).catch(err => {
            console.warn("Failed to load secure references (Fallback memory used):", err.message || err);
            fetchFailedRef.current = true;
            setAppsList(mockApps);
          }).finally(() => {
            isInitializedRef.current = true;
          });
        } else {
          // If already initialized but mockApps changed (e.g. from background sync)
          const secureMap = cachedSecureMapRef.current || new Map();
          const mergedApps = mockApps.map(a => ({...a, more_information_url: secureMap.get(a.id) || a.more_information_url }));
          
          setAppsList(prev => {
             // If we are actively editing an app, we might want to preserve the editing state. 
             // However, the form relies on `editApp` which is derived from `appsList`.
             // To avoid overwriting with the EXACT identical state and causing re-renders,
             // only update if stringified contents differ.
             if (JSON.stringify(prev) !== JSON.stringify(mergedApps)) {
                 return mergedApps;
             }
             return prev; 
          });
        }
      } else {
        setAppsList(mockApps);
        isInitializedRef.current = true;
      }
      
      if (mockSettings && mockNews && mockBlogs && mockVideos) {
        setNewsList(prev => JSON.stringify(prev) !== JSON.stringify(mockNews) ? mockNews : prev);
        setBanners(prev => JSON.stringify(prev) !== JSON.stringify(mockSettings.banners || []) ? (mockSettings.banners || []) : prev);
        setBlogs(prev => JSON.stringify(prev) !== JSON.stringify(mockBlogs) ? mockBlogs : prev);
        setVideosList(prev => JSON.stringify(prev) !== JSON.stringify(mockVideos) ? mockVideos : prev);
        setCategoriesList(prev => JSON.stringify(prev) !== JSON.stringify(mockSettings.categories || []) ? (mockSettings.categories || []) : prev);
        setQuickLinksList(prev => JSON.stringify(prev) !== JSON.stringify(mockSettings.quick_links || []) ? (mockSettings.quick_links || []) : prev);
        setWebsiteFaqsList(prev => JSON.stringify(prev) !== JSON.stringify(mockSettings.website_faqs || []) ? (mockSettings.website_faqs || []) : prev);
        setDevelopersList(prev => JSON.stringify(prev) !== JSON.stringify(mockSettings.developers || []) ? (mockSettings.developers || []) : prev);
        settingsInitializedRef.current = true;
      }
    }
  }, [loading, mockApps, mockNews, mockSettings, mockBlogs, mockVideos, isAdminUser]);

  const handleReloadCloudData = async () => {
    setSaving(true);
    try {
      isInitializedRef.current = false;
      settingsInitializedRef.current = false;
      await refreshAll();
      alert('GLOBAL WORKSPACE SYNC SUCCESSFUL: All local editors and visual configurations updated from Live cloud.');
    } catch (err: any) {
      alert('Cloud Sync Failed: ' + (err.message || 'Check network connection.'));
    } finally {
      setSaving(false);
    }
  };

  // Auto-seed missing Firestore collections under admin auth!
  React.useEffect(() => {
    if (user && !saving) {
      const autoSeed = async () => {
        try {
          const newsDocRef = doc(db, 'store_data', 'news');
          const newsSnap = await getDoc(newsDocRef);
          if (!newsSnap.exists()) {
            
            const sanitizedNews = JSON.parse(JSON.stringify({ items: mockNews }));
            await setDoc(newsDocRef, sanitizedNews);
          }

          const videosDocRef = doc(db, 'store_data', 'videos');
          const videosSnap = await getDoc(videosDocRef);
          if (!videosSnap.exists()) {
            
            const sanitizedVideos = JSON.parse(JSON.stringify({ items: mockVideos }));
            await setDoc(videosDocRef, sanitizedVideos);
          }
        } catch (e: any) {
          console.warn("Admin Seeder failed to check/seed empty tables (fallback memory used):", e.message || e);
        }
      };
      const t = setTimeout(autoSeed, 1500);
      return () => clearTimeout(t);
    }
  }, [user]);

  const triggerHaptic = (intensity = 50) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(intensity);
    }
  };

  const handleTabChange = (tabId: string) => {
    triggerHaptic(10);
    setActiveTab(tabId);
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

  const handleSaveQuickLinks = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedSettings = {
        ...mockSettings,
        quick_links: quickLinksList,
      };
      await saveMockSettings(updatedSettings);
      triggerHaptic();
      alert('Quick Links saved successfully!');
    } catch (err: any) {
      alert('Error saving quick links: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuickLink = () => {
    setQuickLinksList([...quickLinksList, { title: 'New Link', subtitle: 'Description', icon: 'compass', color: 'blue', url: '/' }]);
  };

  const handleRemoveQuickLink = (index: number) => {
    const updated = [...quickLinksList];
    updated.splice(index, 1);
    setQuickLinksList(updated);
  };

  const handleQuickLinkChange = (index: number, field: string, value: string) => {
    const updated = [...quickLinksList];
    updated[index] = { ...updated[index], [field]: value };
    setQuickLinksList(updated);
  };

  const handleSaveWebsiteFaqs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedSettings = {
        ...mockSettings,
        website_faqs: websiteFaqsList,
      };
      await saveMockSettings(updatedSettings);
      triggerHaptic();
      alert('Website FAQs saved successfully!');
    } catch (err: any) {
      alert('Error saving website FAQs: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddWebsiteFaq = () => {
    setWebsiteFaqsList([...websiteFaqsList, { question: 'New Question', answer: 'New Answer' }]);
  };

  const handleRemoveWebsiteFaq = (index: number) => {
    const updated = [...websiteFaqsList];
    updated.splice(index, 1);
    setWebsiteFaqsList(updated);
  };

  const handleWebsiteFaqChange = (index: number, field: string, value: string) => {
    const updated = [...websiteFaqsList];
    updated[index] = { ...updated[index], [field]: value };
    setWebsiteFaqsList(updated);
  };

  const handleSaveDevelopers = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedSettings = {
        ...mockSettings,
        developers: developersList,
      };
      await saveMockSettings(updatedSettings);
      triggerHaptic();
      alert('Developers saved successfully!');
    } catch (err: any) {
      alert('Error saving developers: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDeveloper = () => {
    setDevelopersList([...developersList, { name: 'New Developer', role: 'Role', image_url: '', github: '', twitter: '', bio: '' }]);
  };

  const handleRemoveDeveloper = (index: number) => {
    const updated = [...developersList];
    updated.splice(index, 1);
    setDevelopersList(updated);
  };

  const handleDeveloperChange = (index: number, field: string, value: string) => {
    const updated = [...developersList];
    updated[index] = { ...updated[index], [field]: value };
    setDevelopersList(updated);
  };

  const addCategory = async () => {
    const trimmed = newCatInput.trim();
    if (trimmed && !categoriesList.includes(trimmed)) {
      const updatedList = [...categoriesList, trimmed];
      setCategoriesList(updatedList);
      setNewCatInput('');
      setSaving(true);
      try {
        await saveMockSettings({
          ...mockSettings,
          categories: updatedList
        });
        triggerHaptic();
      } catch (err: any) {
        alert('Cloud Sync Failed: ' + (err.message || err));
      } finally {
        setSaving(false);
      }
    }
  };

  const removeCategory = (catToRemove: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Category',
      message: `Are you sure you want to remove the category "${catToRemove}"? Apps using this category won't be deleted, but this tab will be removed.`,
      confirmText: 'Remove Category',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const updatedList = categoriesList.filter(c => c !== catToRemove);
        setCategoriesList(updatedList);
        setSaving(true);
        try {
          await saveMockSettings({
            ...mockSettings,
            categories: updatedList
          });
          triggerHaptic();
        } catch (err: any) {
          alert('Cloud Sync Failed: ' + (err.message || err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updatedSettings = {
        ...mockSettings,
        site_title: formData.get('site_title') as string || mockSettings.site_title,
        meta_description: formData.get('meta_description') as string || mockSettings.meta_description,
        seo_keywords: formData.get('seo_keywords') as string || mockSettings.seo_keywords,
        ga_tracking_id: formData.get('ga_tracking_id') as string || mockSettings.ga_tracking_id,
        logo_url: formData.get('logo_url') as string || mockSettings.logo_url,
        favicon_url: formData.get('favicon_url') as string || mockSettings.favicon_url,
        secure_index_title: formData.get('secure_index_title') as string || mockSettings.secure_index_title || 'Secure Index',
        secure_index_subtitle: formData.get('secure_index_subtitle') as string || mockSettings.secure_index_subtitle || 'Verified & Transparent App Marketplace',
        trending_searches: (formData.get('trending_searches') as string || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        
        about_content: formData.get('about_content') as string || mockSettings.about_content,
        privacy_content: formData.get('privacy_content') as string || mockSettings.privacy_content,
        terms_content: formData.get('terms_content') as string || mockSettings.terms_content,
        responsibility_content: formData.get('responsibility_content') as string || mockSettings.responsibility_content,
        
        portal_heading: formData.get('portal_heading') as string || mockSettings.portal_heading,
        disclaimer_heading: formData.get('disclaimer_heading') as string || mockSettings.disclaimer_heading,
        ethics_heading: formData.get('ethics_heading') as string || mockSettings.ethics_heading,
        disclaimer_text: formData.get('disclaimer_text') as string || mockSettings.disclaimer_text,
        ethics_discrimination_text: formData.get('ethics_discrimination_text') as string || mockSettings.ethics_discrimination_text,
        important_notice_heading: formData.get('important_notice_heading') as string || mockSettings.important_notice_heading,
        important_notice: formData.get('important_notice') as string || mockSettings.important_notice,
        
        ticker_text: formData.get('ticker_text') as string || mockSettings.ticker_text,
        support_email: formData.get('support_email') as string || mockSettings.support_email,
        helpline_telegram: formData.get('helpline_telegram') as string || mockSettings.helpline_telegram,
        helpline_whatsapp: formData.get('helpline_whatsapp') as string || mockSettings.helpline_whatsapp,
        
        hero_title_visible: formData.get('hero_title_visible') === 'true',
        hero_title_style: formData.get('hero_title_style') as string,
        hero_title_color: formData.get('hero_title_color') as string,
        hero_title_animation: formData.get('hero_title_animation') as string,
        hero_title_text: formData.get('hero_title_text') as string,
        hero_title_subtitle: formData.get('hero_title_subtitle') as string,
        
        social_links: {
          facebook: formData.get('social_facebook') as string || '',
          instagram: formData.get('social_instagram') as string || '',
          twitter: formData.get('social_twitter') as string || '',
          linkedin: formData.get('social_linkedin') as string || '',
          youtube: formData.get('social_youtube') as string || '',
        },
        
        categories: categoriesList,
        banners: banners,
        website_faqs: websiteFaqsList
      };
      
      await saveMockSettings(updatedSettings);
      setBanners(updatedSettings.banners || []);
      setCategoriesList(updatedSettings.categories || []);
      triggerHaptic();
      alert('GLOBAL SYSTEM SYNC COMPLETE: All Identity & Legal configurations published to Live.');
    } catch (err: any) {
      console.error(err);
      alert('Sync Failed: ' + (err.message || 'Unknown error. Check internet connection.'));
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
      const customSlugInput = formData.get('slug') as string;
      const slug = customSlugInput?.trim() 
        ? customSlugInput.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-') 
        : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
      const editApp = editingAppId ? appsList.find(a => a.id === editingAppId) : null;
      let encryptedUrlVal = editApp?.more_information_url || '';
      const inputUrl = formData.get('more_information_url') as string;
      if (inputUrl && !inputUrl.startsWith('U2FsdGVkX1')) {
         try {
            const idToken = await auth?.currentUser?.getIdToken();
            const res = await fetch('/api/v1/admin/encrypt', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`
               },
               body: JSON.stringify({ url: inputUrl })
            });
            if (res.ok) {
               encryptedUrlVal = (await res.json()).encrypted;
            } else {
               alert(`Failed to secure URL: ${await res.text()}`);
               return; // Abort save if encryption fails
            }
         } catch (err: any) {
            console.error("Failed to secure URL", err);
            alert(`Failed to secure URL: ${err.message}`);
            return;
         }
      } else if (inputUrl) {
         encryptedUrlVal = inputUrl;
      }
      
      const actualAppId = editingAppId || Math.random().toString(36).substr(2, 9);
      
      const appData = {
        id: actualAppId,
        name,
        slug,
        seo_title: formData.get('seo_title') as string || '',
        seo_description: formData.get('seo_description') as string || '',
        seo_keywords: formData.get('seo_keywords') as string || '',
        og_image_url: formData.get('og_image_url') as string || '',
        canonical_url: formData.get('canonical_url') as string || '',
        target_region: formData.get('target_region') as string || '',
        icon_url: formData.get('icon_url') as string || '',
        category: (() => {
          const checkedCats = formData.getAll('category_list') as string[];
          const customCatsStr = formData.get('custom_category') as string || '';
          const customCats = customCatsStr.split(',').map(c => c.trim()).filter(Boolean);
          const combinedCats = Array.from(new Set([...checkedCats, ...customCats]));
          return combinedCats.length > 0 ? combinedCats.join(', ') : mockSettings.categories?.[0] || 'General';
        })(),
        version: (formData.get('version') as string) || '1.0',
        file_size: (formData.get('file_size') as string) || 'Unknown',
        developer: (formData.get('developer') as string) || 'Admin',
        screenshots: [],
        more_information_url: encryptedUrlVal,
        description_html: formData.get('description_html') as string || '<p>A new application.</p>',
        custom_admin_box_heading: formData.get('custom_admin_box_heading') as string,
        custom_admin_box_html: formData.get('custom_admin_box_html') as string,
        features_html: formData.get('features_html') as string,
        red_box_msg: formData.get('red_box_msg') as string,
        yellow_box_msg: formData.get('yellow_box_msg') as string,
        idea_box_msg: formData.get('idea_box_msg') as string,
        safety_status: (formData.get('safety_status') as 'Verified' | 'Caution' | 'Unsafe') || 'Verified',
        serial_number: parseInt(formData.get('serial_number') as string) || appsList.length + 1,
        is_featured: false,
        is_coming_soon: formData.get('is_coming_soon') === 'on',
        publish_date: formData.get('publish_date') ? new Date(formData.get('publish_date') as string).toISOString() : undefined,
        is_new: formData.get('is_new') === 'on',
        release_notes: formData.get('release_notes') as string,
        rating: parseFloat(formData.get('rating') as string) || 5.0,
        created_at: new Date().toISOString(),
        faqs: JSON.parse((formData.get('faqs_json') as string) || '[]')
      };
      
      if (encryptedUrlVal) {
          cachedSecureMapRef.current.set(actualAppId, encryptedUrlVal);
      } else {
          cachedSecureMapRef.current.delete(actualAppId);
      }
      
      let updatedApps;
      if (editingAppId) {
        updatedApps = appsList.map(a => a.id === editingAppId ? { ...a, ...appData, created_at: a.created_at, screenshots: a.screenshots } : a);
      } else {
        updatedApps = [...appsList, appData];
      }
      
      await saveMockApps(updatedApps);
      setAppsList(updatedApps);
      triggerHaptic();
      setEditingAppId(null);
      alert(editingAppId ? 'Success: Application Updated & Verified on Cloud!' : 'Success: New Application Published & Verified on Cloud!');
    } catch (err: any) {
      console.error(err);
      alert('Sync Failed: ' + (err.message || 'Unknown error. Check internet.'));
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteApp = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Application',
      message: 'Are you sure you want to delete this app? This will permanently wipe it from the cloud catalog.',
      confirmText: 'Delete App',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          cachedSecureMapRef.current.delete(id);
          const updatedApps = appsList.filter(a => a.id !== id);
          await saveMockApps(updatedApps);
          setAppsList(updatedApps);
        } catch (err: any) {
          alert('Error deleting app: ' + err.message);
        }
      }
    });
  };

  const handleSaveNews = async () => {
    setSaving(true);
    try {
      await saveMockNews(newsList);
      triggerHaptic();
      alert('News saved successfully. Go to News Section to see.');
    } catch (err: any) {
      alert('Error saving news: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNewsChange = (id: string, field: string, value: string) => {
    if (field === 'slug') {
      const cleanSlug = value.toLowerCase().replace(/https?:\/\//g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      setNewsList(newsList.map(n => n.id === id ? { ...n, [field]: cleanSlug } : n));
      return;
    }
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
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Banner',
      message: 'Are you sure you want to remove this advertising banner? You will need to click "Sync Banners" at the bottom to publish this deletion.',
      confirmText: 'Remove Banner',
      cancelText: 'Cancel',
      onConfirm: () => {
        setBanners(banners.filter(b => b.id !== id));
      }
    });
  };

  const handleAddNews = (initialData?: any): string => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newItem: NewsItem = {
      id: newId,
      slug: initialData?.slug || 'new-news',
      title: initialData?.title || 'New News',
      logo_url: initialData?.logo_url || '',
      description: initialData?.description || 'News description...',
      description_html: initialData?.description_html || '<p>News HTML...</p>',
      date: new Date().toISOString(),
      author: 'Admin',
      read_time: '2 min',
      tags: [],
      ceo_name: 'CEO Name',
      ceo_description: 'CEO Description',
      seo_title: initialData?.seo_title || 'News SEO Title',
      seo_description: initialData?.seo_description || 'News SEO Meta Description',
      seo_keywords: '',
      og_image_url: '',
      canonical_url: '',
      target_region: initialData?.target_region || 'Global',
      content: initialData?.content || 'Detailed markdown content here...',
      link: ''
    };
    setNewsList((prev: any) => [...prev, newItem]);
    return newId;
  };

  const handleDeleteNews = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove News Item',
      message: 'Are you sure you want to remove this news item? You will need to click "Save News System" below to publish this deletion.',
      confirmText: 'Remove News',
      cancelText: 'Cancel',
      onConfirm: () => {
        setNewsList(newsList.filter(n => n.id !== id));
      }
    });
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
    if (field === 'slug') {
      const cleanSlug = value.toLowerCase().replace(/https?:\/\//g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      setBlogs(blogs.map(b => b.id === id ? { ...b, [field]: cleanSlug } : b));
      return;
    }
    setBlogs(blogs.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleAddBlog = () => {
    const newBlog: BlogPost = {
      id: Math.random().toString(36).substr(2, 9),
      slug: 'new-blog-' + Math.random().toString(36).substr(2, 4),
      title: 'New Blog Post',
      description: 'Read our latest blog post.',
      description_html: '<p>Read our latest blog post.</p>',
      thumbnail_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
      publish_date: new Date().toISOString(),
      read_time: '5 min',
      tags: [],
      content: 'Write something amazing...',
      author: 'Admin Team',
      cover_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
      published_at: new Date().toISOString(),
      seo_title: 'New Blog Post',
      seo_description: 'Read our latest blog post.',
      seo_keywords: '',
      canonical_url: '',
      target_region: 'Global',
      created_at: new Date().toISOString()
    };
    setBlogs([...blogs, newBlog]);
  };

  const handleDeleteBlog = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Blog Post',
      message: 'Are you sure you want to remove this blog post? You will need to click "Save Blogs" below to publish this deletion.',
      confirmText: 'Remove Post',
      cancelText: 'Cancel',
      onConfirm: () => {
        setBlogs(blogs.filter(b => b.id !== id));
      }
    });
  };

  const handleVideosChange = (id: string, field: string, value: string) => {
    if (field === 'slug') {
      const cleanSlug = value.toLowerCase().replace(/https?:\/\//g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      setVideosList(videosList.map(v => v.id === id ? { ...v, [field]: cleanSlug } : v));
      return;
    }
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
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Video Listing',
      message: 'Are you sure you want to remove this video listing? You will need to click "Save Videos" below to publish this deletion.',
      confirmText: 'Remove Video',
      cancelText: 'Cancel',
      onConfirm: () => {
        setVideosList(videosList.filter(v => v.id !== id));
      }
    });
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
    const adminPath = getAdminPath();
    return <Navigate to={`/${adminPath}/login`} />;
  }

  if (isAdminUser === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-black/5">
        <h1 className="text-3xl font-black text-rose-600 mb-4 uppercase tracking-tighter italic">Access Restricted</h1>
        <p className="opacity-60 max-w-md mb-2 font-bold text-slate-600 dark:text-zinc-400">
          This account is not authorized to manage the system. Only authorized administrators registered in the secure admin database can access the control panel.
        </p>
        <p className="opacity-80 max-w-md mb-8 font-mono text-sm text-slate-800 dark:text-zinc-300">
          Logged in as: {user?.email || 'Unknown User'}
        </p>
        <button onClick={handleLogout} className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all active:scale-95">
          Sign Out Authority
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-600"></div>
          <div className="flex items-center gap-4">
            <div className="relative">
              {mockSettings.logo_url ? (
                <img src={mockSettings.logo_url} className="w-12 h-12 object-contain" alt="Logo" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center border border-blue-200/40 text-blue-600 dark:text-blue-400">
                  <Shield className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">System Control Console</h1>
                <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-blue-200/30">Secure Hub</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">AES-256 Connection Verified • V2.4.9</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center flex-wrap mt-4 md:mt-0">
            <div className="flex flex-col items-end mr-2 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Session Timer</span>
              <span className={`font-mono font-bold text-sm tracking-tight ${sessionTimeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                {Math.floor(sessionTimeLeft / 60).toString().padStart(2, '0')}:{(sessionTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <button 
              onClick={handleReloadCloudData} 
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              title="Reload and pull latest configurations directly from the Cloud database"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} /> Reload Cloud
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all text-xs font-semibold shadow-sm shadow-rose-600/10 cursor-pointer">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-[260px_1fr] gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col gap-1.5 h-fit shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-3">Navigation</h3>
            <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={handleTabChange} />
            <SidebarItem id="apps" label="Applications" icon={FileText} active={activeTab === 'apps'} onClick={handleTabChange} />
            <SidebarItem id="news" label="News System" icon={Newspaper} active={activeTab === 'news'} onClick={handleTabChange} />
            <SidebarItem id="blogs" label="App Updates" icon={FileText} active={activeTab === 'blogs'} onClick={handleTabChange} />
            <SidebarItem id="videos" label="Video Matrix" icon={VideoIcon} active={activeTab === 'videos'} onClick={handleTabChange} />
            
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-3 mx-2"></div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-3">Frontend</h3>
            
            <SidebarItem id="quicklinks" label="Quick Links" icon={Compass} active={activeTab === 'quicklinks'} onClick={handleTabChange} />
            <SidebarItem id="websitefaqs" label="Website FAQs" icon={HelpCircle} active={activeTab === 'websitefaqs'} onClick={handleTabChange} />
            <SidebarItem id="developers" label="Developers" icon={Users} active={activeTab === 'developers'} onClick={handleTabChange} />
            <SidebarItem id="categories" label="Categories" icon={Layers} active={activeTab === 'categories'} onClick={handleTabChange} />
            <SidebarItem id="banners" label="Ad Banners" icon={LayoutDashboard} active={activeTab === 'banners'} onClick={handleTabChange} />
            
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-3 mx-2"></div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-3">Authority</h3>
            
            <SidebarItem id="reviews" label="Support Desk" icon={ShieldAlert} active={activeTab === 'reviews'} onClick={handleTabChange} />
            <SidebarItem id="github" label="GitHub Sync" icon={Github} active={activeTab === 'github'} onClick={handleTabChange} />
            <SidebarItem id="settings" label="Global Config" icon={Settings} active={activeTab === 'settings'} onClick={handleTabChange} />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 min-h-[750px] shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              {activeTab === 'dashboard' && <DashboardTab apps={mockApps} news={newsList} />}
              {activeTab === 'apps' && (
                <AppsTab 
                  appsList={appsList} 
                  editingAppId={editingAppId} 
                  setEditingAppId={setEditingAppId} 
                  handleDeleteApp={handleDeleteApp} 
                  handleSaveApp={handleSaveApp} 
                  categories={mockSettings.categories} 
                  saving={saving} 
                />
              )}
              {activeTab === 'news' && (
                <NewsTab 
                  newsList={newsList} 
                  handleAddNews={handleAddNews} 
                  handleDeleteNews={handleDeleteNews} 
                  handleNewsChange={handleNewsChange} 
                  saveMockNews={saveMockNews} 
                  saving={saving} 
                  setSaving={setSaving}
                  appsList={appsList}
                />
              )}
              {activeTab === 'blogs' && (
                <BlogsTab 
                  blogs={blogs} 
                  handleAddBlog={handleAddBlog} 
                  handleDeleteBlog={handleDeleteBlog} 
                  handleBlogChange={handleBlogChange} 
                  handleSaveBlogs={handleSaveBlogs} 
                  saving={saving} 
                />
              )}
              {activeTab === 'videos' && (
                <VideosTab 
                  videosList={videosList} 
                  handleAddVideo={handleAddVideo} 
                  handleDeleteVideo={handleDeleteVideo} 
                  handleVideosChange={handleVideosChange} 
                  handleSaveVideos={handleSaveVideos} 
                  saving={saving} 
                />
              )}
              {activeTab === 'quicklinks' && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Navigation Hub Links</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure quick navigation links shown in the user dashboard.</p>
                    </div>
                    <button 
                      onClick={handleAddQuickLink} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-xs transition-all cursor-pointer border-0 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Link
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveQuickLinks} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {quickLinksList.map((link: any, index: number) => (
                        <div key={index} className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 shadow-sm relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickLink(index)}
                            className="absolute top-4 right-4 text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:border-rose-900/30 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="space-y-4 pt-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
                              <input required type="text" value={link.title} onChange={(e) => handleQuickLinkChange(index, 'title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Subtitle</label>
                              <input required type="text" value={link.subtitle} onChange={(e) => handleQuickLinkChange(index, 'subtitle', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">URL Path</label>
                                <input required type="text" value={link.url} onChange={(e) => handleQuickLinkChange(index, 'url', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Color Variant</label>
                                <select value={link.color} onChange={(e) => handleQuickLinkChange(index, 'color', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500">
                                  <option value="blue">Blue</option>
                                  <option value="emerald">Emerald</option>
                                  <option value="amber">Amber</option>
                                  <option value="rose">Rose</option>
                                  <option value="purple">Purple</option>
                                </select>
                              </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Icon Name</label>
                                <select value={link.icon} onChange={(e) => handleQuickLinkChange(index, 'icon', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500">
                                  <option value="compass">Compass (Explore)</option>
                                  <option value="newspaper">Newspaper (News)</option>
                                  <option value="video">Video (Media)</option>
                                  <option value="book-open">Book Open (Guides)</option>
                                </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      {quickLinksList.length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl font-medium italic text-sm">
                          No quick links added yet.
                        </div>
                      )}
                    </div>
                    
                    <button type="submit" disabled={saving} className="min-h-[46px] px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm tracking-wide rounded-xl shadow-sm transition-all cursor-pointer border-0 ml-auto block">
                      Sync Links to Live
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'websitefaqs' && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Website FAQs Management</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add, update, or remove Frequently Asked Questions on the homepage.</p>
                    </div>
                    <button 
                      onClick={handleAddWebsiteFaq} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-xs transition-all cursor-pointer border-0 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add FAQ
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveWebsiteFaqs} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      {websiteFaqsList.map((faq: any, index: number) => (
                        <div key={index} className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 shadow-sm relative animate-fade-in">
                          <button
                            type="button"
                            onClick={() => handleRemoveWebsiteFaq(index)}
                            className="absolute top-4 right-4 text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:border-rose-900/30 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="space-y-4 pt-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Question</label>
                              <input required type="text" value={faq.question} onChange={(e) => handleWebsiteFaqChange(index, 'question', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Answer</label>
                              <textarea required rows={3} value={faq.answer} onChange={(e) => handleWebsiteFaqChange(index, 'answer', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-none"></textarea>
                            </div>
                          </div>
                        </div>
                      ))}
                      {websiteFaqsList.length === 0 && (
                        <div className="col-span-1 text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl font-medium italic text-sm">
                          No website FAQs added yet.
                        </div>
                      )}
                    </div>
                    
                    <button type="submit" disabled={saving} className="min-h-[46px] px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm tracking-wide rounded-xl shadow-sm transition-all cursor-pointer border-0 ml-auto block">
                      Sync FAQs to Live
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'developers' && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Developers Management</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure profile details of developers on the team page.</p>
                    </div>
                    <button 
                      onClick={handleAddDeveloper} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-xs transition-all cursor-pointer border-0 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Developer
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveDevelopers} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {developersList.map((dev: any, index: number) => (
                        <div key={index} className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 shadow-sm relative animate-fade-in">
                          <button
                            type="button"
                            onClick={() => handleRemoveDeveloper(index)}
                            className="absolute top-4 right-4 text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:border-rose-900/30 cursor-pointer z-10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="space-y-4 pt-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Name</label>
                              <input required type="text" value={dev.name} onChange={(e) => handleDeveloperChange(index, 'name', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
                              <input required type="text" value={dev.role} onChange={(e) => handleDeveloperChange(index, 'role', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Image URL (Avatar)</label>
                              <input type="text" value={dev.image_url} onChange={(e) => handleDeveloperChange(index, 'image_url', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">GitHub URL (Optional)</label>
                              <input type="text" value={dev.github} onChange={(e) => handleDeveloperChange(index, 'github', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Twitter URL (Optional)</label>
                              <input type="text" value={dev.twitter} onChange={(e) => handleDeveloperChange(index, 'twitter', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Bio (Optional)</label>
                              <textarea rows={2} value={dev.bio} onChange={(e) => handleDeveloperChange(index, 'bio', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-none"></textarea>
                            </div>
                          </div>
                        </div>
                      ))}
                      {developersList.length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl font-medium italic text-sm">
                          No developers added yet.
                        </div>
                      )}
                    </div>
                    
                    <button type="submit" disabled={saving} className="min-h-[46px] px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm tracking-wide rounded-xl shadow-sm transition-all cursor-pointer border-0 ml-auto block">
                      Sync Developers to Live
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'categories' && (
                <div className="animate-fade-in space-y-6">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Global Categories</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage global classification categories for all catalogued apps.</p>
                  </div>
                  
                  <form onSubmit={handleSaveCategories} className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Active Categories</label>
                      <div className="flex flex-wrap gap-2.5 mb-6">
                        {categoriesList.map((cat, index) => (
                          <div key={cat} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 px-3.5 py-2 rounded-xl shadow-sm group">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">{index + 1}. {cat}</span>
                            <button type="button" onClick={() => removeCategory(cat)} className="text-rose-500 hover:text-rose-600 hover:scale-110 transition-all border-0 bg-transparent p-0 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3 max-w-md">
                        <input type="text" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" placeholder="New Category Name..." />
                        <button type="button" onClick={addCategory} className="px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs tracking-wider rounded-xl transition-all border-0 cursor-pointer">Add Category</button>
                      </div>
                    </div>
                    
                    <button type="submit" disabled={saving} className="min-h-[46px] px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm tracking-wide rounded-xl shadow-sm transition-all cursor-pointer border-0 block">
                      Sync Categories
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'banners' && (
                <div className="animate-fade-in space-y-6">
                   <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                     <div>
                       <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ad Banners (Marketing)</h2>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure advertising banners displayed dynamically on the homepage.</p>
                     </div>
                     <button 
                       onClick={handleAddBanner} 
                       className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-xs transition-all cursor-pointer border-0 shadow-sm"
                     >
                       <Plus className="w-4 h-4" /> Deploy Banner
                     </button>
                   </div>
                   
                   <div className="grid gap-6">
                     {banners.map((banner) => (
                       <div key={banner.id} className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 flex flex-col md:flex-row gap-6 hover:border-blue-500/30 transition-all shadow-sm">
                        <div className="flex flex-col items-center gap-1.5 self-center md:self-stretch justify-center">
                          <img 
                            src={banner.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"} 
                            className="w-48 h-28 object-cover rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-100" 
                            alt="Banner Preview" 
                            onError={(e) => {
                              // Fallback for broken image URLs
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80";
                            }}
                          />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Image Preview</span>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Banner Heading</label>
                              <input type="text" value={banner.title} onChange={(e) => handleBannerChange(banner.id, 'title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" placeholder="Heading Text" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Banner Subtitle</label>
                              <input type="text" value={banner.subtitle} onChange={(e) => handleBannerChange(banner.id, 'subtitle', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" placeholder="Subtitle Caption" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Image Asset Path Or URL</label>
                              <input type="text" value={banner.image} onChange={(e) => handleBannerChange(banner.id, 'image', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500" placeholder="Image URL Source" />
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Target Redirect Link</label>
                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Quick Link Tool</span>
                              </div>
                              <input type="text" value={banner.link} onChange={(e) => handleBannerChange(banner.id, 'link', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500" placeholder="Link URL (/slug or http://...)" />
                              
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                <select 
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleBannerChange(banner.id, 'link', e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 outline-none max-w-[140px] focus:border-blue-500"
                                >
                                  <option value="">Link to App...</option>
                                  {appsList.map((a: any) => (
                                    <option key={a.id} value={`/${a.slug}`}>{a.name}</option>
                                  ))}
                                </select>

                                <select 
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleBannerChange(banner.id, 'link', e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 outline-none max-w-[140px] focus:border-blue-500"
                                >
                                  <option value="">Link to Blog...</option>
                                  {blogs.map((b: any) => (
                                    <option key={b.id} value={`/blog/${b.slug}`}>{b.title}</option>
                                  ))}
                                </select>

                                <select 
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleBannerChange(banner.id, 'link', e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 outline-none max-w-[140px] focus:border-blue-500"
                                >
                                  <option value="">Link to News...</option>
                                  {newsList.map((n: any) => (
                                    <option key={n.id} value={`/news/${n.slug}`}>{n.title}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button 
                              onClick={() => handleDeleteBanner(banner.id)} 
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all border border-rose-100 dark:border-rose-900/30 text-xs font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove Banner
                            </button>
                          </div>
                        </div>
                       </div>
                     ))}
                   </div>
                   <div className="mt-8 flex justify-end">
                     <button onClick={async () => {
                       setSaving(true);
                       await saveMockSettings({ ...mockSettings, banners });
                       triggerHaptic();
                       setSaving(false);
                       alert('Banners Synced to Frontend System.');
                     }} className="min-h-[46px] px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm tracking-wide rounded-xl shadow-sm transition-all cursor-pointer border-0 block">Sync Banners</button>
                   </div>
                </div>
              )}
              {activeTab === 'reviews' && (
                <ReviewsModerationTab db={db} />
              )}
              {activeTab === 'github' && (
                <GithubTab pushAllToGitHub={pushAllToGitHub} gitConfig={gitConfig} saveGitConfig={saveGitConfig} appsList={appsList} generatePreview={() => generateStaticDataFileCode(appsList, mockSettings, newsList, blogs, videosList)} />
              )}
              {activeTab === 'settings' && (
                <SettingsTab key={mockSettings.site_title || 'settings'} mockSettings={mockSettings} handleSaveSettings={handleSaveSettings} saving={saving} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Confirm Dialog Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in animate-duration-150">
          <div className="bg-white dark:bg-slate-900 border-4 border-pink-500 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_0_50px_rgba(236,72,153,0.3)] text-center transform scale-100 transition-all">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-pink-500/10 dark:bg-pink-500/20 rounded-full flex items-center justify-center border-2 border-pink-500/20 text-pink-500">
                <Trash2 className="w-8 h-8 animate-bounce" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter">
              {confirmConfig.title || 'Are you sure?'}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 font-bold text-sm mb-8 leading-relaxed">
              {confirmConfig.message}
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 min-h-[50px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-black uppercase text-[11px] tracking-widest italic rounded-2xl border-2 border-black/10 dark:border-white/10 transition-all active:scale-95"
              >
                {confirmConfig.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await confirmConfig.onConfirm();
                  } catch (e: any) {
                    console.error("Confirmation execution failed:", e);
                  } finally {
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className="flex-1 min-h-[50px] bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-[11px] tracking-widest italic rounded-2xl shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all active:scale-95"
              >
                {confirmConfig.confirmText || 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
