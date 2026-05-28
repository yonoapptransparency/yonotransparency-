import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, ShieldAlert, Shield, LogOut, Save, Upload, Type, Link as LinkIcon, ToggleLeft, Layers, Newspaper, Plus, Trash2, Video as VideoIcon, Github, GitBranch, RefreshCw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { auth, db } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
      className={`flex items-center gap-4 w-full text-left px-5 py-4 rounded-2xl transition-all min-h-[56px] font-black uppercase tracking-widest text-[10px] italic group ${
        active 
          ? 'bg-pink-500 text-white shadow-xl shadow-pink-500/30' 
          : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-pink-500'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform group-active:scale-90 ${active ? 'animate-pulse' : ''}`} /> 
      {label}
    </button>
  );
});

// Extraction of Tab Content Components for better performance
const DashboardTab = React.memo(({ apps, news }: { apps: any[], news: any[] }) => (
  <div className="animate-fade-in">
    <h2 className="text-xl font-bold mb-6 border-b border-black/10 pb-4">Platform Overview</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-black/5 p-4 rounded-xl border border-black/10">
        <div className="opacity-60 text-sm mb-1">Total Apps</div>
        <div className="text-2xl font-bold">{apps.length}</div>
      </div>
      <div className="bg-black/5 p-4 rounded-xl border border-black/10">
        <div className="opacity-60 text-sm mb-1">Total News</div>
        <div className="text-2xl font-bold">{news.length}</div>
      </div>
      <div className="bg-black/5 p-4 rounded-xl border border-black/10">
        <div className="opacity-60 text-sm mb-1">Pending Reviews</div>
        <div className="text-2xl font-bold text-amber-500">12</div>
      </div>
      <div className="bg-black/5 p-4 rounded-xl border border-black/10">
        <div className="opacity-60 text-sm mb-1">Safe Links Encrypted</div>
        <div className="text-2xl font-bold text-pink-500">100%</div>
      </div>
    </div>
  </div>
));

// Memoized Tab Components
const AppsTab = React.memo(({ appsList, editingAppId, setEditingAppId, handleDeleteApp, handleSaveApp, categories, saving, faqsJson }: any) => {
  if (editingAppId !== null) {
    const editApp = editingAppId ? appsList.find((a: any) => a.id === editingAppId) : null;
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b border-black/10 dark:border-white/10 pb-4">
          <h2 className="text-xl font-bold dark:text-white">{editingAppId ? 'Edit Application' : 'Add New Application'}</h2>
          <button onClick={() => setEditingAppId(null)} className="text-sm font-medium opacity-60 hover:opacity-100 px-4 py-2 dark:text-white">Cancel</button>
        </div>
        <form onSubmit={handleSaveApp} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">App Name</label>
              <input type="text" name="name" defaultValue={editApp?.name} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">Custom App Slug (URL Part)</label>
              <input type="text" name="slug" defaultValue={editApp?.slug} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" placeholder="Leave blank to auto-generate from name" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">App Icon / Logo URL</label>
              <input type="text" name="icon_url" defaultValue={editApp?.icon_url} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" placeholder="Link to the app logo image" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-[10px] opacity-60 mb-2 dark:text-white">Categories</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {categories?.map((cat: string) => (
                  <label key={cat} className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <input 
                      type="checkbox" 
                      name="category_list" 
                      value={cat} 
                      defaultChecked={editApp?.category ? editApp.category.toLowerCase().split(',').map((c: string) => c.trim()).includes(cat.toLowerCase()) : false}
                      className="rounded border-black/20 bg-black/5 text-pink-500 focus:ring-pink-500 w-4 h-4"
                    />
                    <span className="text-sm opacity-80 dark:text-white">{cat}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-xs font-bold text-pink-500/70 mb-1 uppercase tracking-wider">Or Add Extra Customized Categories (separated by commas)</label>
                <input 
                  type="text" 
                  name="custom_category" 
                  placeholder="e.g. Action, Featured, Live" 
                  defaultValue={editApp?.category ? editApp.category.split(',').map((c: string) => c.trim()).filter((c: string) => !categories?.map((cg: string) => cg.toLowerCase()).includes(c.toLowerCase())).join(', ') : ''}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 text-sm dark:text-white font-bold"
                />
              </div>
            </div>
            
            {/* RESTORED SEO FIELDS */}
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">SEO Title</label>
              <input type="text" name="seo_title" defaultValue={editApp?.seo_title} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" placeholder="Custom SEO Title" />
            </div>
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">SEO Description</label>
              <textarea name="seo_description" defaultValue={editApp?.seo_description} rows={2} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" placeholder="Custom SEO Description (auto-generated from HTML if left blank)"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">SEO Keywords (Comma Separated)</label>
              <input type="text" name="seo_keywords" defaultValue={editApp?.seo_keywords} placeholder="e.g., vpn, privacy, security app" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">SEO OG Image URL (Social Sharing)</label>
              <input type="text" name="og_image_url" defaultValue={editApp?.og_image_url} placeholder="Image URL for social media shares" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">Canonical URL</label>
                <input type="url" name="canonical_url" defaultValue={editApp?.canonical_url} placeholder="Original URL to prevent SEO penalty" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">Target Region (GEO Optimization)</label>
                <input type="text" name="target_region" defaultValue={editApp?.target_region} placeholder="e.g., Global, India, USA" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">Traffic Light Status</label>
              <select name="safety_status" defaultValue={editApp?.safety_status || 'Verified'} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white dark:bg-slate-900">
                <option value="Verified">🟢 Verified (Green)</option>
                <option value="Caution">🟡 Caution (Yellow)</option>
                <option value="Unsafe">🔴 Unsafe (Red)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">Serial Number (Sort Order)</label>
              <input type="number" name="serial_number" defaultValue={editApp?.serial_number || ''} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">App Version</label>
              <input type="text" name="version" defaultValue={editApp?.version || '1.0'} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">File Size</label>
              <input type="text" name="file_size" defaultValue={editApp?.file_size || 'Unknown'} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">Developer</label>
              <input type="text" name="developer" defaultValue={editApp?.developer || 'Admin'} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">App Rating (0.0 to 10.0)</label>
              <input type="number" step="0.1" min="0.0" max="10.0" name="rating" defaultValue={editApp?.rating !== undefined ? editApp.rating : 5.0} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" required />
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-pink-500/30">
            <div className="flex-1">
              <div className="font-semibold text-pink-500">New App Tag</div>
              <div className="text-sm opacity-60 dark:text-white/60">Display "New" or "Major Update" badge.</div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_new" defaultChecked={editApp ? editApp.is_new : true} className="w-5 h-5 accent-pink-500" />
              <span className="text-sm font-bold dark:text-white">Show Tag</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-pink-500 mb-1 uppercase italic font-black">Release Notes (What's New)</label>
            <textarea name="release_notes" defaultValue={editApp?.release_notes || ''} rows={3} placeholder="* Fixed bugs&#10;* Added new features" className="w-full bg-black/5 dark:bg-white/5 border border-pink-500/30 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 dark:text-white"></textarea>
          </div>

          <div className="border border-black/10 dark:border-white/10 rounded-xl p-4 bg-black/5 dark:bg-white/5 space-y-4">
             <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><LinkIcon className="w-4 h-4 text-pink-500"/> Private Access Clearance Config</h3>
             <label className="block text-sm font-medium opacity-60 dark:text-white">Secure Payload Access Link</label>
             <input type="url" name="download_url" defaultValue={editApp?.encrypted_download_url} className="w-full bg-white dark:bg-slate-900 border border-pink-500/30 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" />
          </div>

          {/* RESTORED UI ADMIN BOXES */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg dark:text-white border-b border-black/10 dark:border-white/10 pb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-pink-500"/> Custom Interaction UI</h3>
            <div>
              <label className="block text-sm font-medium text-rose-500 mb-1">Red Box Warning Message</label>
              <input type="text" name="red_box_msg" defaultValue={editApp?.red_box_msg || ''} className="w-full bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 focus:ring-2 focus:ring-rose-500 min-h-[48px] dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-500 mb-1">Yellow Box Notice Message</label>
              <input type="text" name="yellow_box_msg" defaultValue={editApp?.yellow_box_msg || ''} className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 min-h-[48px] dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-pink-500 mb-1">Idea / Tip Message</label>
              <input type="text" name="idea_box_msg" defaultValue={editApp?.idea_box_msg || ''} className="w-full bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px] dark:text-white" />
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-500 mb-1">Extended Info Box Heading</label>
              <input type="text" name="custom_admin_box_heading" defaultValue={editApp?.custom_admin_box_heading || ''} className="w-full bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-500 mb-1">Extended Info Content (HTML)</label>
              <textarea name="custom_admin_box_html" defaultValue={editApp?.custom_admin_box_html || ''} rows={4} className="w-full bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 dark:text-white font-mono text-xs"></textarea>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium opacity-60 mb-1 dark:text-white">Full Application Description (HTML)</label>
            <textarea name="description_html" defaultValue={editApp?.description_html} rows={10} placeholder="<h1>Title</h1><p>Description here...</p>" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 dark:text-white font-mono text-xs"></textarea>
          </div>

          <div className="border border-black/10 dark:border-white/10 rounded-xl p-4 bg-black/5 dark:bg-white/5">
            <FaqEditor key={editApp?.id || 'new'} initialFaqs={editApp?.faqs || []} />
          </div>
          <button type="submit" disabled={saving} className="min-h-[48px] w-full sm:w-auto px-8 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-pink-500/20">
            {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Application</>}
          </button>
        </form>
      </div>
    )
  }
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold border-b border-black/10 dark:border-white/10 pb-4 flex-1 dark:text-white uppercase italic tracking-tighter">System Applications</h2>
        <button onClick={() => setEditingAppId("")} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ml-4 shadow-lg shadow-pink-500/20">
          <Plus className="w-4 h-4"/> Add New
        </button>
      </div>
      <div className="space-y-4">
        {appsList.map((app: any) => (
          <div key={app.id} className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 flex gap-4 items-center hover:border-pink-500/30 transition-all group">
            <img src={app.icon_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop'} className="w-16 h-16 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform" alt="" />
            <div className="flex-1">
              <h4 className="font-bold dark:text-white group-hover:text-pink-500 transition-colors">{app.name}</h4>
              <div className="text-xs opacity-60 dark:text-white/60 font-medium uppercase tracking-widest">{app.category} • {app.is_new ? <span className="text-pink-500">NEW</span> : 'ACTIVE'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingAppId(app.id)} className="px-4 py-2 bg-black/10 dark:bg-white/10 hover:bg-pink-500 hover:text-white rounded-lg text-sm font-bold transition-all dark:text-white">Edit</button>
              <button onClick={() => handleDeleteApp(app.id)} className="px-3 py-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const CategoriesTab = React.memo(({ categoriesList, newCatInput, setNewCatInput, handleAddCategory, handleRemoveCategory, handleSaveCategories, saving }: any) => (
  <div className="animate-fade-in">
    <h2 className="text-xl font-bold mb-6 border-b border-black/10 pb-4">Manage Global Categories</h2>
    <form onSubmit={handleSaveCategories} className="space-y-6">
      <div>
        <label className="block text-sm font-medium opacity-60 mb-1">Available Categories</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {categoriesList.map((cat: string, index: number) => (
            <div key={index} className="flex items-center gap-2 bg-black/5 border border-black/10 px-3 py-2 rounded-lg">
              <span className="text-sm font-bold">{cat}</span>
              <button type="button" onClick={() => handleRemoveCategory(cat)} className="text-rose-500 hover:text-rose-600 p-1">
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
            className="flex-1 bg-black/5 border border-black/10 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 min-h-[48px]"
            placeholder="New Category Name (e.g., Tools)"
          />
          <button 
            type="button" 
            onClick={handleAddCategory}
            className="px-6 bg-black/10 hover:bg-black/20 font-bold rounded-lg transition-colors border border-black/10"
          >
            Add
          </button>
        </div>
      </div>
      <button type="submit" disabled={saving} className="min-h-[48px] px-8 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg transition-all flex items-center gap-2">
        {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Categories</>}
      </button>
    </form>
  </div>
));

const BannersTab = React.memo(({ banners, handleAddBanner, handleRemoveBanner, handleUpdateBanner, handleSaveBanners, saving }: any) => (
  <div className="animate-fade-in">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold border-b border-black/10 pb-4 flex-1">Home Page Banners</h2>
      <button onClick={handleAddBanner} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ml-4">
        <Plus className="w-4 h-4"/> Add Banner
      </button>
    </div>
    <div className="grid gap-6">
      {banners.map((banner: any, index: number) => (
        <div key={index} className="bg-black/5 border border-black/10 rounded-xl p-6 border-l-4 border-l-pink-500 space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="font-bold uppercase text-xs opacity-50">Banner #{index + 1}</h4>
            <button onClick={() => handleRemoveBanner(index)} className="text-rose-500 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input type="text" value={banner.image_url} onChange={(e) => handleUpdateBanner(index, 'image_url', e.target.value)} placeholder="Image URL" className="w-full bg-white border border-black/10 rounded-lg p-3 text-sm" />
            <input type="text" value={banner.link} onChange={(e) => handleUpdateBanner(index, 'link', e.target.value)} placeholder="Link URL" className="w-full bg-white border border-black/10 rounded-lg p-3 text-sm" />
          </div>
        </div>
      ))}
    </div>
    <button onClick={handleSaveBanners} disabled={saving} className="mt-8 min-h-[48px] px-8 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg transition-all flex items-center gap-2">
      {saving ? 'Saving...' : <><Save className="w-5 h-5"/> Save Banners</>}
    </button>
  </div>
));

const SettingsTab = React.memo(({ mockSettings, handleSaveSettings, saving }: any) => (
  <div className="animate-fade-in">
    <h2 className="text-2xl font-black mb-8 border-b-4 border-pink-500/20 pb-4 dark:text-white uppercase italic tracking-tighter">Global Identity Settings (God-Mode)</h2>
    <form onSubmit={handleSaveSettings} className="space-y-12">
      
      <div className="space-y-6">
        <h3 className="font-black text-pink-500 border-b border-pink-500/10 pb-2 uppercase tracking-widest text-xs italic">Branding & Identity</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Site Title</label>
            <input type="text" name="site_title" defaultValue={mockSettings.site_title} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" required />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Global SEO Description</label>
            <input type="text" name="meta_description" defaultValue={mockSettings.meta_description} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Global SEO Keywords (Comma Separated)</label>
            <input type="text" name="seo_keywords" defaultValue={mockSettings.seo_keywords} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Main Logo URL</label>
            <input type="text" name="logo_url" defaultValue={mockSettings.logo_url} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Favicon URL</label>
            <input type="text" name="favicon_url" defaultValue={mockSettings.favicon_url} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Secure Index Heading</label>
            <input type="text" name="secure_index_title" defaultValue={mockSettings.secure_index_title || 'Secure Index'} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Secure Index Subtitle Caption</label>
            <input type="text" name="secure_index_subtitle" defaultValue={mockSettings.secure_index_subtitle || 'Verified & Transparent App Marketplace'} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-black text-pink-500 border-b border-pink-500/10 pb-2 uppercase tracking-widest text-xs italic">Legal Content (GOD-STRENGTH)</h3>
        <div className="grid gap-6">
          <div>
            <label className="block text-[11px] font-black text-pink-500 mb-1 uppercase tracking-widest">About Us Page Content (HTML)</label>
            <textarea name="about_content" rows={6} defaultValue={mockSettings.about_content} className="w-full bg-slate-900 border-2 border-pink-500/20 rounded-2xl p-5 text-pink-400 font-mono text-xs focus:border-pink-500 outline-none transition-all shadow-inner"></textarea>
          </div>
          <div>
            <label className="block text-[11px] font-black text-pink-500 mb-1 uppercase tracking-widest">Privacy Policy Body (HTML)</label>
            <textarea name="privacy_content" rows={8} defaultValue={mockSettings.privacy_content} className="w-full bg-slate-900 border-2 border-pink-500/20 rounded-2xl p-5 text-pink-400 font-mono text-xs focus:border-pink-500 outline-none transition-all shadow-inner"></textarea>
          </div>
          <div>
            <label className="block text-[11px] font-black text-pink-500 mb-1 uppercase tracking-widest">Terms & Conditions Body (HTML)</label>
            <textarea name="terms_content" rows={8} defaultValue={mockSettings.terms_content} className="w-full bg-slate-900 border-2 border-pink-500/20 rounded-2xl p-5 text-pink-400 font-mono text-xs focus:border-pink-500 outline-none transition-all shadow-inner"></textarea>
          </div>
          <div>
            <label className="block text-[11px] font-black text-rose-500 mb-1 uppercase tracking-widest underline italic">Platform Responsibility Clause (HTML)</label>
            <textarea name="responsibility_content" rows={6} defaultValue={mockSettings.responsibility_content} className="w-full bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-5 text-rose-400 font-mono text-xs focus:border-rose-500 outline-none transition-all shadow-inner" placeholder="<p>Our commitment to user safety...</p>"></textarea>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-black text-pink-500 border-b border-pink-500/10 pb-2 uppercase tracking-widest text-xs italic">RUMMY STORE & Disclaimers</h3>
        <div className="grid gap-6">
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Portal Main Heading</label>
            <input type="text" name="portal_heading" defaultValue={mockSettings.portal_heading} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Disclaimer Heading</label>
              <input type="text" name="disclaimer_heading" defaultValue={mockSettings.disclaimer_heading} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Ethics Heading</label>
              <input type="text" name="ethics_heading" defaultValue={mockSettings.ethics_heading} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Disclaimer Text (HTML supported)</label>
            <textarea name="disclaimer_text" rows={3} defaultValue={mockSettings.disclaimer_text} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-medium"></textarea>
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Ethics Text (HTML supported)</label>
            <textarea name="ethics_discrimination_text" rows={3} defaultValue={mockSettings.ethics_discrimination_text} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-medium"></textarea>
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Important Notice Heading (Handshake Gateway Page)</label>
            <input type="text" name="important_notice_heading" defaultValue={mockSettings.important_notice_heading} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Important Notice Content (Handshake Gateway Page Body)</label>
            <textarea name="important_notice" rows={2} defaultValue={mockSettings.important_notice} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-medium"></textarea>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-black text-pink-500 border-b border-pink-500/10 pb-2 uppercase tracking-widest text-xs italic">Support & Ticker</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Announcement Ticker Text</label>
            <input type="text" name="ticker_text" defaultValue={mockSettings.ticker_text} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Support Email</label>
            <input type="email" name="support_email" defaultValue={mockSettings.support_email} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Telegram Link</label>
            <input type="text" name="helpline_telegram" defaultValue={mockSettings.helpline_telegram} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">WhatsApp Link</label>
            <input type="text" name="helpline_whatsapp" defaultValue={mockSettings.helpline_whatsapp} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="min-h-[64px] px-12 bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-widest italic rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-pink-500/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50">
        {saving ? 'Synchronizing Cloud...' : <><Shield className="w-6 h-6"/> Sync Global Identity Settings</>}
      </button>
    </form>
  </div>
));

const GithubSyncTab = React.memo(({ gitConfig, saveGitConfig, pushAllToGitHub, gitConfigLoading }: any) => {
  const [owner, setOwner] = useState(gitConfig?.owner || '');
  const [repo, setRepo] = useState(gitConfig?.repo || '');
  const [branch, setBranch] = useState(gitConfig?.branch || 'main');
  const [token, setToken] = useState(gitConfig?.token || '');
  const [autoSync, setAutoSync] = useState(gitConfig?.autoSync || false);

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Sync state if gitConfig loads/updates asynchronously after login
  React.useEffect(() => {
    if (gitConfig) {
      setOwner(gitConfig.owner || '');
      setRepo(gitConfig.repo || '');
      setBranch(gitConfig.branch || 'main');
      setToken(gitConfig.token || '');
      setAutoSync(gitConfig.autoSync || false);
    }
  }, [gitConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveGitConfig({
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim(),
        token: token.trim(),
        autoSync
      });
      alert('GitHub synchronization settings updated successfully!');
    } catch (err: any) {
      alert('Failed to save configuration: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleForceSync = async () => {
    if (!token || !owner || !repo) {
      alert("Please fill in and save Owner, Repo and Token fields first.");
      return;
    }
    setSyncing(true);
    setSyncStatus({ message: 'Compiling offline fallback indexes and pushing commits to GitHub...' });
    try {
      await pushAllToGitHub({
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim(),
        token: token.trim(),
        autoSync
      });
      setSyncStatus({ success: true, message: 'Success! Committed to GitHub successfully. A deployment has been automatically triggered.' });
    } catch (err: any) {
      console.error(err);
      setSyncStatus({ success: false, message: 'GitHub Sync Failed: ' + (err.message || 'Unknown network error. Check repository permissions.') });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center border-b-4 border-pink-500/20 pb-4">
        <h2 className="text-2xl font-black dark:text-white uppercase italic tracking-tighter">GitHub Auto-Sync (Cold Start Engine)</h2>
        <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${gitConfig?.token ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
          {gitConfig?.token ? '● Connected' : '○ Not Configured'}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-[2rem] p-8 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="font-black text-pink-500 border-b border-pink-500/10 pb-2 uppercase tracking-widest text-xs italic">Repository Configuration</h3>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">GitHub Owner / Org</label>
                <input 
                  type="text" 
                  value={owner} 
                  onChange={(e) => setOwner(e.target.value)} 
                  className="w-full bg-black/5 dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" 
                  placeholder="e.g. defentechscholar" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">GitHub Repository Name</label>
                <input 
                  type="text" 
                  value={repo} 
                  onChange={(e) => setRepo(e.target.value)} 
                  className="w-full bg-black/5 dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" 
                  placeholder="e.g. rummystore" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black opacity-60 mb-1 uppercase tracking-widest italic dark:text-white">Git Branch</label>
                <input 
                  type="text" 
                  value={branch} 
                  onChange={(e) => setBranch(e.target.value)} 
                  className="w-full bg-black/5 dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold" 
                  placeholder="e.g. main" 
                  required 
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-black opacity-60 uppercase tracking-widest italic dark:text-white">Personal Access Token (PAT)</label>
                  <button type="button" onClick={() => setShowToken(!showToken)} className="text-[10px] text-pink-500 font-bold uppercase hover:underline">
                    {showToken ? "Hide" : "Show"}
                  </button>
                </div>
                <input 
                  type={showToken ? "text" : "password"} 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  className="w-full bg-black/5 dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all dark:text-white font-bold font-mono" 
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                  required 
                />
              </div>
            </div>

            <div className="flex items-center gap-4 bg-pink-500/10 border-2 border-pink-500/20 p-4 rounded-2xl">
              <input 
                type="checkbox" 
                id="autoSync" 
                checked={autoSync} 
                onChange={(e) => setAutoSync(e.target.checked)} 
                className="w-5 h-5 rounded text-pink-500 border-pink-500 focus:ring-pink-500 accent-pink-500" 
              />
              <div>
                <label htmlFor="autoSync" className="block text-xs font-black uppercase tracking-wider text-pink-500 cursor-pointer">Auto-Sync on Publish/Save</label>
                <span className="text-[10px] opacity-70 block dark:text-white">When active, saving any application, news, blog, video, or banner instantly pushes updates to GitHub automatically!</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={saving || gitConfigLoading} 
                className="flex-1 bg-pink-500 text-white p-4 rounded-2xl font-black uppercase tracking-wider text-xs italic hover:bg-pink-600 active:scale-95 transition-all text-center"
              >
                {saving ? 'Saving Settings...' : 'Save Configuration'}
              </button>
              
              <button 
                type="button" 
                onClick={handleForceSync} 
                disabled={syncing || gitConfigLoading} 
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl font-black uppercase tracking-wider text-xs italic hover:brightness-110 active:scale-95 transition-all text-center"
              >
                {syncing ? 'Pushing Commit...' : 'Push All Data Now'}
              </button>
            </div>
          </form>

          {syncStatus && (
            <div className={`p-4 rounded-2xl border-2 font-mono text-xs ${syncStatus.success === true ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : syncStatus.success === false ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'}`}>
              {syncStatus.message}
            </div>
          )}
        </div>

        <div className="bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-[2rem] p-8 space-y-6 h-fit">
          <h3 className="font-black text-pink-500 border-b border-pink-500/10 pb-2 uppercase tracking-widest text-xs italic">Why use GitHub Sync?</h3>
          
          <div className="space-y-4 text-xs leading-relaxed dark:text-gray-300">
            <p>
              When clients visit your website directly (like deep-linked /app/filxfox), their browser has to connect to Firebase Firestore.
            </p>
            <p>
              Due to serverless constraints, free web-servers can experience <strong>cold starts</strong>, resulting in blank pages or infinite loading loops for new visitors.
            </p>
            <p className="border-l-4 border-pink-500 pl-3 italic text-pink-500 text-[10px]">
              This engine solves that! By syncing updates back to GitHub, your hosting provider compiles all database rows (apps, settings, news, blogs, and videos) statically into the code.
            </p>
            <p>
              The static compiled code loads instantly (under 100ms) with zero database waiting period!
            </p>
          </div>

          <h3 className="font-black text-pink-500 border-b border-pink-500/10 pb-2 uppercase tracking-widest text-xs italic mt-6">How to get a Token</h3>
          
          <div className="space-y-4 text-xs dark:text-gray-300">
            <div>
              <p className="font-black uppercase tracking-wider text-[10px] text-pink-400 mb-1">Option A: Fine-Grained Token (Recommended)</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Go to <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer" className="text-pink-500 underline font-bold">New Fine-Grained Token</a></li>
                <li>Under <strong>Repository access</strong>, select your repository (<code>rummystore</code>)</li>
                <li>Under <strong>Permissions</strong>, click <strong>Repository permissions</strong></li>
                <li>Scroll to <strong>Contents</strong>, and set it to <strong>Read and write</strong></li>
                <li>Generate and copy the token!</li>
              </ol>
            </div>

            <div className="border-t border-white/5 pt-3">
              <p className="font-black uppercase tracking-wider text-[10px] text-pink-400 mb-1">Option B: Classic Token</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-pink-500 underline font-bold">Classic Token Settings</a></li>
                <li>Click <strong>Generate new token (classic)</strong></li>
                <li>Check the <strong>repo</strong> checkbox scope (Full control of repositories)</li>
                <li>Generate and copy the token!</li>
              </ol>
            </div>
            
            <p className="border-l-2 border-indigo-500 pl-2 italic text-[10px] text-indigo-400">
              Note: If GitHub Sync fails with "Not Found", it almost always means the token is missing "Contents: Read/Write" or "repo" permission!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

const NewsTab = React.memo(({ newsList, handleAddNews, handleDeleteNews, handleNewsChange, saveMockNews, saving, setSaving }: any) => (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-black/10 dark:border-white/10 shadow-xl shadow-pink-500/5">
      <h2 className="text-2xl font-black flex items-center gap-2 dark:text-white uppercase italic tracking-tighter"><Newspaper className="w-6 h-6 text-pink-500 underline" /> Manage News System</h2>
      <button onClick={handleAddNews} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest italic transition-all shadow-lg shadow-pink-500/30 active:scale-95"><Plus className="w-5 h-5" /> Add New Item</button>
    </div>
    <div className="grid gap-8">
      {newsList.map((item: any) => (
        <div key={item.id} className="bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-[2rem] p-8 relative shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 bg-rose-500/10 rounded-bl-3xl border-l border-b border-rose-500/20 group-hover:bg-rose-500 transition-all cursor-pointer z-10" onClick={() => handleDeleteNews(item.id)}>
            <Trash2 className="w-5 h-5 text-rose-500 group-hover:text-white" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-pink-500 italic pb-2 border-b border-pink-500/10">General Information</h3>
              <div>
                <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Title</label>
                <input type="text" value={item.title} onChange={e => handleNewsChange(item.id, 'title', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-bold" placeholder="News Title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Slug (URL)</label>
                  <input type="text" value={item.slug} onChange={e => handleNewsChange(item.id, 'slug', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Logo/Thumb URL</label>
                  <input type="text" value={item.logo_url} onChange={e => handleNewsChange(item.id, 'logo_url', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Short Description</label>
                <textarea value={item.description} onChange={e => handleNewsChange(item.id, 'description', e.target.value)} rows={3} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 focus:ring-4 focus:ring-pink-500/20 dark:text-white font-medium"></textarea>
              </div>

              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-pink-500 italic pb-2 border-b border-pink-500/10 mt-8">Leadership / CEO Config</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">CEO Name</label>
                  <input type="text" value={item.ceo_name} onChange={e => handleNewsChange(item.id, 'ceo_name', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">CEO Role/Title</label>
                  <input type="text" value={item.ceo_description} onChange={e => handleNewsChange(item.id, 'ceo_description', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-pink-500 italic pb-2 border-b border-pink-500/10">SEO & Social Meta</h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">SEO Optimized Title</label>
                  <input type="text" value={item.seo_title} onChange={e => handleNewsChange(item.id, 'seo_title', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">SEO Meta Description</label>
                  <textarea value={item.seo_description} onChange={e => handleNewsChange(item.id, 'seo_description', e.target.value)} rows={2} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-medium"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Social OG Image</label>
                    <input type="text" value={item.og_image_url} onChange={e => handleNewsChange(item.id, 'og_image_url', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-mono text-[10px]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Canonical URL</label>
                    <input type="text" value={item.canonical_url} onChange={e => handleNewsChange(item.id, 'canonical_url', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-mono text-[10px]" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Target Region</label>
                    <input type="text" value={item.target_region} onChange={e => handleNewsChange(item.id, 'target_region', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-bold text-[10px]" placeholder="Global" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">SEO Keywords</label>
                    <input type="text" value={item.seo_keywords} onChange={e => handleNewsChange(item.id, 'seo_keywords', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-bold text-[10px]" placeholder="keyword1, keyword2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Source Link</label>
                    <input type="text" value={item.link} onChange={e => handleNewsChange(item.id, 'link', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-mono text-[10px]" />
                  </div>
                </div>
              </div>

              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-pink-500 italic pb-2 border-b border-pink-500/10 mt-8">Full Content Editor</h3>
              <div>
                <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">News Body (Markdown/HTML)</label>
                <textarea value={item.content} onChange={e => handleNewsChange(item.id, 'content', e.target.value)} rows={12} className="w-full bg-slate-900 border-2 border-pink-500/20 rounded-2xl py-3 px-5 text-pink-500 font-mono text-xs focus:border-pink-500 outline-none shadow-inner"></textarea>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-12 flex justify-center">
      <button onClick={async () => { try { setSaving(true); await saveMockNews(newsList); alert('System Synced: News Published & Verified.'); } catch(e:any){ alert(e.message); } finally { setSaving(false); } }} className="bg-pink-500 hover:bg-pink-600 text-white px-20 py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] italic flex items-center gap-3 shadow-2xl shadow-pink-500/40 transform hover:scale-[1.05] transition-all active:scale-95">
        {saving ? 'Transmitting Data...' : <><Save className="w-6 h-6"/> Save News System</>}
      </button>
    </div>
  </div>
));

const BlogsTab = React.memo(({ blogs, handleAddBlog, handleDeleteBlog, handleBlogChange, handleSaveBlogs, saving }: any) => (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-black/10 dark:border-white/10 shadow-xl">
      <h2 className="text-2xl font-black flex items-center gap-2 dark:text-white uppercase italic tracking-tighter"><FileText className="w-6 h-6 text-pink-500" /> System Blogs</h2>
      <button onClick={handleAddBlog} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest italic flex items-center gap-2 transition-all"><Plus className="w-5 h-5" /> Add Post</button>
    </div>
    <div className="space-y-8">
      {blogs.map((blog: any) => (
        <div key={blog.id} className="bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl relative">
          <button onClick={() => handleDeleteBlog(blog.id)} className="absolute top-6 right-6 p-3 text-rose-500 hover:bg-rose-500/10 rounded-full transition-all border border-rose-500/20"><Trash2 className="w-5 h-5" /></button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Blog Title</label>
                <input type="text" value={blog.title} onChange={(e) => handleBlogChange(blog.id, 'title', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl p-4 text-sm font-black dark:text-white" placeholder="Blog Title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">URL Slug</label>
                  <input type="text" value={blog.slug} onChange={(e) => handleBlogChange(blog.id, 'slug', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-xs dark:text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Author Name</label>
                  <input type="text" value={blog.author} onChange={(e) => handleBlogChange(blog.id, 'author', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-xs dark:text-white font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Cover Image URL</label>
                <input type="text" value={blog.cover_url} onChange={(e) => handleBlogChange(blog.id, 'cover_url', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-xs dark:text-white font-mono" />
              </div>

              <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-pink-500 italic tracking-widest">Blog SEO Matrix</h4>
                <div>
                  <label className="block text-[9px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">SEO Title</label>
                  <input type="text" value={blog.seo_title || ''} onChange={(e) => handleBlogChange(blog.id, 'seo_title', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 text-[10px] dark:text-white" />
                </div>
                <div>
                  <label className="block text-[9px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">SEO Keywords</label>
                  <input type="text" value={blog.seo_keywords || ''} onChange={(e) => handleBlogChange(blog.id, 'seo_keywords', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 text-[10px] dark:text-white" placeholder="keyword1, keyword2" />
                </div>
                <div>
                  <label className="block text-[9px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Canonical URL</label>
                  <input type="text" value={blog.canonical_url || ''} onChange={(e) => handleBlogChange(blog.id, 'canonical_url', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 text-[10px] dark:text-white" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-[9px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Target Region</label>
                  <input type="text" value={blog.target_region || ''} onChange={(e) => handleBlogChange(blog.id, 'target_region', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 text-[10px] dark:text-white" placeholder="Global" />
                </div>
                <div>
                  <label className="block text-[9px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">SEO Description</label>
                  <textarea value={blog.seo_description || ''} onChange={(e) => handleBlogChange(blog.id, 'seo_description', e.target.value)} rows={2} className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 text-[10px] dark:text-white"></textarea>
                </div>
              </div>
              
              <div>
                <img src={blog.cover_url} className="w-full h-40 object-cover rounded-2xl border-2 border-black/10 shadow-lg mt-4" alt="Preview" />
              </div>
            </div>
            <div className="space-y-6">
              <label className="block text-[10px] font-black text-pink-500 mb-1 uppercase tracking-[0.3em] italic">Full HTML Content (Tiptap / Raw HTML)</label>
              <textarea value={blog.content} onChange={(e) => handleBlogChange(blog.id, 'content', e.target.value)} className="w-full bg-slate-900 border-2 border-pink-500/20 rounded-2xl p-5 text-pink-500 font-mono text-xs shadow-inner h-[400px]" placeholder="Full HTML Content"></textarea>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-12 flex justify-end">
      <button onClick={handleSaveBlogs} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.25em] italic flex items-center justify-center gap-3 shadow-2xl shadow-pink-500/40">
        {saving ? 'Synchronizing Blogs...' : <><Save className="w-6 h-6"/> Sync All Blogs</>}
      </button>
    </div>
  </div>
));

const VideosTab = React.memo(({ videosList, handleAddVideo, handleDeleteVideo, handleVideosChange, handleSaveVideos, saving }: any) => (
  <div className="animate-fade-in space-y-6">
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border-2 border-black/10 dark:border-white/10">
      <h2 className="text-2xl font-black flex items-center gap-2 dark:text-white uppercase italic tracking-tighter"><VideoIcon className="w-6 h-6 text-pink-500" /> Video Matrix</h2>
      <button onClick={handleAddVideo} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest italic transition-all shadow-lg shadow-pink-500/30 active:scale-95"><Plus className="w-5 h-5" /> Add To Matrix</button>
    </div>
    <div className="grid gap-10">
      {videosList.map((item: any) => (
        <div key={item.id} className="bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl relative group overflow-hidden">
          <button onClick={() => handleDeleteVideo(item.id)} className="absolute top-6 right-6 p-3 text-red-500 hover:bg-red-500 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 border border-red-500/30"><Trash2 className="w-5 h-5" /></button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-pink-500 italic pb-2 border-b border-pink-500/10">Stream Config</h3>
              <div>
                <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Video Title</label>
                <input type="text" value={item.title} onChange={e => handleVideosChange(item.id, 'title', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-bold" placeholder="Title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Slug (URL)</label>
                  <input type="text" value={item.slug} onChange={e => handleVideosChange(item.id, 'slug', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">YouTube URL</label>
                  <input type="text" value={item.youtube_url} onChange={e => handleVideosChange(item.id, 'youtube_url', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Video Description</label>
                <textarea value={item.description} onChange={e => handleVideosChange(item.id, 'description', e.target.value)} rows={4} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white"></textarea>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-pink-500 italic pb-2 border-b border-pink-500/10">Video SEO Armor</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">SEO Optimized Header</label>
                  <input type="text" value={item.seo_title} onChange={e => handleVideosChange(item.id, 'seo_title', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">SEO Meta String</label>
                  <textarea value={item.seo_description} onChange={e => handleVideosChange(item.id, 'seo_description', e.target.value)} rows={2} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-50 mb-1 uppercase tracking-widest italic dark:text-white">Search Keywords</label>
                  <input type="text" value={item.seo_keywords || ''} onChange={e => handleVideosChange(item.id, 'seo_keywords', e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-xl py-3 px-5 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-12 flex justify-center">
      <button onClick={handleSaveVideos} disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white px-20 py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] italic flex items-center gap-3 shadow-2xl shadow-pink-500/40">
        {saving ? 'Processing Stream...' : <><Save className="w-6 h-6"/> Publish Video Matrix</>}
      </button>
    </div>
  </div>
));

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
  const [newCatInput, setNewCatInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
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
  const isInitializedRef = React.useRef(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const emailLower = currentUser.email?.toLowerCase() || 'none';
        if (emailLower === 'defentechscholar@gmail.com') {
          setIsAdminUser(true);
          setCheckingAuth(false);
          return;
        }

        try {
          // Check by UID first
          const adminUidDoc = doc(db, 'admins', currentUser.uid);
          const snapUid = await getDoc(adminUidDoc);
          if (snapUid.exists() && snapUid.data()?.role === 'admin') {
            setIsAdminUser(true);
            setCheckingAuth(false);
            return;
          }

          // Check by email second
          const adminEmailDoc = doc(db, 'admins', emailLower);
          const snapEmail = await getDoc(adminEmailDoc);
          if (snapEmail.exists() && snapEmail.data()?.role === 'admin') {
            setIsAdminUser(true);
            setCheckingAuth(false);
            return;
          }

          setIsAdminUser(false);
        } catch (e) {
          console.warn("Database-driven administrator check failed or not permitted:", e);
          setIsAdminUser(false);
        } finally {
          setCheckingAuth(false);
        }
      } else {
        setIsAdminUser(null);
        setCheckingAuth(false);
      }
    });
    return unsubscribe;
  }, []);

  // Initialize local states once from loaded cloud data
  React.useEffect(() => {
    if (!loading && !isInitializedRef.current) {
      setAppsList(mockApps);
      setNewsList(mockNews);
      setBanners(mockSettings.banners || []);
      setBlogs(mockBlogs);
      setVideosList(mockVideos);
      setCategoriesList(mockSettings.categories || []);
      isInitializedRef.current = true;
    }
  }, [loading, mockApps, mockNews, mockSettings, mockBlogs, mockVideos]);

  const handleReloadCloudData = async () => {
    setSaving(true);
    try {
      isInitializedRef.current = false;
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
            console.log("Admin Seeder: Seeding news to Firestore...");
            await setDoc(newsDocRef, { items: mockNews });
          }

          const videosDocRef = doc(db, 'store_data', 'videos');
          const videosSnap = await getDoc(videosDocRef);
          if (!videosSnap.exists()) {
            console.log("Admin Seeder: Seeding videos to Firestore...");
            await setDoc(videosDocRef, { items: mockVideos });
          }
        } catch (e) {
          console.error("Admin Seeder failed to check/seed empty tables:", e);
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
        logo_url: formData.get('logo_url') as string || mockSettings.logo_url,
        favicon_url: formData.get('favicon_url') as string || mockSettings.favicon_url,
        secure_index_title: formData.get('secure_index_title') as string || mockSettings.secure_index_title || 'Secure Index',
        secure_index_subtitle: formData.get('secure_index_subtitle') as string || mockSettings.secure_index_subtitle || 'Verified & Transparent App Marketplace',
        
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
        
        categories: categoriesList,
        banners: banners
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
      const appData = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        slug,
        seo_title: formData.get('seo_title') as string || name,
        seo_description: formData.get('seo_description') as string || (formData.get('description_html') as string)?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '',
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
        rating: parseFloat(formData.get('rating') as string) || 5.0,
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
      canonical_url: '',
      target_region: 'Global',
      content: 'Detailed markdown content here...',
      link: ''
    };
    setNewsList([...newsList, newItem]);
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
    setBlogs(blogs.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleAddBlog = () => {
    const newBlog = {
      id: Math.random().toString(36).substr(2, 9),
      slug: 'new-blog-' + Math.random().toString(36).substr(2, 4),
      title: 'New Blog Post',
      content: 'Write something amazing...',
      author: 'Admin Team',
      cover_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
      published_at: new Date().toISOString(),
      seo_title: 'New Blog Post',
      seo_description: 'Read our latest blog post.',
      seo_keywords: '',
      canonical_url: '',
      target_region: 'Global'
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
    return <Navigate to="/admin/login" />;
  }

  if (isAdminUser === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-black/5">
        <h1 className="text-3xl font-black text-rose-600 mb-4 uppercase tracking-tighter italic">Access Restricted</h1>
        <p className="opacity-60 max-w-md mb-8 font-bold text-slate-600 dark:text-zinc-400">
          This account is not authorized to manage the system. Only authorized administrators registered in the Firebase console database under the 'admins' collection can control the Admin Central.
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
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-rose-500/30 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-6">
            <div className="relative">
              {mockSettings.logo_url ? (
                <img src={mockSettings.logo_url} className="w-16 h-16 object-contain drop-shadow-2xl grayscale" alt="Logo" />
              ) : (
                <Shield className="w-16 h-16 text-rose-500" />
              )}
              <div className="absolute -top-2 -right-2 bg-rose-500 text-[8px] font-black text-white px-2 py-1 rounded-full uppercase tracking-tighter shadow-[0_0_10px_rgba(244,63,94,0.5)]">Encrypted Hub</div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-rose-500 uppercase tracking-widest italic">Restricted Admin Access</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                <p className="opacity-80 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest font-mono text-emerald-600">AES-256 Connection Verified • V2.4.9</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center flex-wrap mt-4 md:mt-0">
            <button 
              onClick={handleReloadCloudData} 
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-500/30 rounded-2xl transition-all font-black uppercase tracking-widest italic shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Reload and pull latest configurations directly from the Cloud database"
            >
              <RefreshCw className={`w-5 h-5 ${saving ? 'animate-spin' : ''}`} /> Reload Cloud Data
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-all font-black uppercase tracking-widest italic shadow-xl shadow-rose-500/20 active:scale-95">
              <LogOut className="w-5 h-5" /> Sign Out Authority
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-10">
          <div className="bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-3 h-fit shadow-2xl">
            <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] italic mb-2 ml-4 dark:text-white">Navigation</h3>
            <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={handleTabChange} />
            <SidebarItem id="apps" label="Applications" icon={FileText} active={activeTab === 'apps'} onClick={handleTabChange} />
            <SidebarItem id="news" label="News System" icon={Newspaper} active={activeTab === 'news'} onClick={handleTabChange} />
            <SidebarItem id="blogs" label="Global Blogs" icon={FileText} active={activeTab === 'blogs'} onClick={handleTabChange} />
            <SidebarItem id="videos" label="Video Matrix" icon={VideoIcon} active={activeTab === 'videos'} onClick={handleTabChange} />
            
            <div className="h-px bg-black/10 dark:bg-white/10 my-4"></div>
            <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] italic mb-2 ml-4 dark:text-white">Frontend</h3>
            
            <SidebarItem id="categories" label="Categories" icon={Layers} active={activeTab === 'categories'} onClick={handleTabChange} />
            <SidebarItem id="banners" label="Ad Banners" icon={LayoutDashboard} active={activeTab === 'banners'} onClick={handleTabChange} />
            
            <div className="h-px bg-black/10 dark:bg-white/10 my-4"></div>
            <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] italic mb-2 ml-4 dark:text-white">Authority</h3>
            
            <SidebarItem id="reviews" label="Moderation" icon={ShieldAlert} active={activeTab === 'reviews'} onClick={handleTabChange} />
            <SidebarItem id="settings" label="Global Config" icon={Settings} active={activeTab === 'settings'} onClick={handleTabChange} />
            <SidebarItem id="github" label="GitHub Sync" icon={GitBranch} active={activeTab === 'github'} onClick={handleTabChange} />
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-[3rem] p-8 sm:p-12 min-h-[800px] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl"></div>
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
              {activeTab === 'categories' && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-black mb-8 border-b-4 border-pink-500/20 pb-4 dark:text-white uppercase italic tracking-tighter">Global Categories</h2>
                  <form onSubmit={handleSaveCategories} className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black opacity-60 mb-2 uppercase tracking-widest italic dark:text-white">Active Management</label>
                      <div className="flex flex-wrap gap-3 mb-6">
                        {categoriesList.map((cat, index) => (
                          <div key={cat} className="flex items-center gap-3 bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 px-4 py-3 rounded-2xl shadow-lg group">
                            <span className="text-xs font-black dark:text-white tracking-widest">{index + 1}. {cat}</span>
                            <button type="button" onClick={() => removeCategory(cat)} className="text-rose-500 hover:scale-125 transition-transform"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <input type="text" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} className="flex-1 bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 font-bold dark:text-white" placeholder="Category Name..." />
                        <button type="button" onClick={addCategory} className="px-10 bg-black/10 dark:bg-white/10 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all hover:bg-pink-500 hover:text-white dark:text-white">Add</button>
                      </div>
                    </div>
                    <button type="submit" disabled={saving} className="min-h-[64px] px-12 bg-pink-500 text-white font-black uppercase tracking-widest italic rounded-[2rem] shadow-xl shadow-pink-500/30">
                      Sync Categories
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'banners' && (
                <div className="animate-fade-in">
                   <div className="flex justify-between items-center mb-8 border-b-4 border-pink-500/20 pb-4 ">
                     <h2 className="text-2xl font-black dark:text-white uppercase italic tracking-tighter">Ad Banners (Marketing)</h2>
                     <button onClick={handleAddBanner} className="bg-pink-500/10 text-pink-500 px-6 py-3 rounded-xl border-2 border-pink-500/20 flex items-center gap-2 font-black uppercase tracking-widest italic text-[10px]"><Plus className="w-4 h-4" /> Deploy Banner</button>
                   </div>
                   <div className="grid gap-6">
                     {banners.map((banner) => (
                       <div key={banner.id} className="bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-[2.5rem] p-6 flex flex-col md:flex-row gap-6 hover:border-pink-500/30 transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col items-center gap-1.5 self-center md:self-stretch justify-center">
                          <img 
                            src={banner.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"} 
                            className="w-48 h-28 object-cover rounded-2xl shadow-xl border-2 border-black/10 dark:border-white/10 bg-zinc-100" 
                            alt="Banner Preview" 
                            onError={(e) => {
                              // Fallback for broken image URLs
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80";
                            }}
                          />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Image Preview</span>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Banner Heading</label>
                              <input type="text" value={banner.title} onChange={(e) => handleBannerChange(banner.id, 'title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-sm font-bold dark:text-white" placeholder="Heading Text" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Banner Subtitle</label>
                              <input type="text" value={banner.subtitle} onChange={(e) => handleBannerChange(banner.id, 'subtitle', e.target.value)} className="w-full bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-sm font-bold dark:text-white" placeholder="Subtitle Caption" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Image Asset Path Or URL</label>
                              <input type="text" value={banner.image} onChange={(e) => handleBannerChange(banner.id, 'image', e.target.value)} className="w-full bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-white/10 rounded-xl p-3 text-xs font-mono dark:text-white" placeholder="Image URL Source" />
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Target Redirect Link</label>
                                <span className="text-[9px] font-black text-pink-500 uppercase tracking-wider">Quick Link Tool</span>
                              </div>
                              <input type="text" value={banner.link} onChange={(e) => handleBannerChange(banner.id, 'link', e.target.value)} className="w-full bg-white dark:bg-slate-900 border-2 border-pink-500/20 dark:border-pink-500/20 rounded-xl p-3 text-xs font-mono dark:text-white" placeholder="Link URL (/app/slug or http://...)" />
                              
                              <div className="mt-2 flex flex-wrap gap-2">
                                <select 
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleBannerChange(banner.id, 'link', e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="bg-black/5 dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-lg py-1 px-2 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 outline-none max-w-[140px]"
                                >
                                  <option value="">Link to App...</option>
                                  {appsList.map((a: any) => (
                                    <option key={a.id} value={`/app/${a.slug}`}>{a.name}</option>
                                  ))}
                                </select>

                                <select 
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleBannerChange(banner.id, 'link', e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="bg-black/5 dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-lg py-1 px-2 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 outline-none max-w-[140px]"
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
                                  className="bg-black/5 dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-lg py-1 px-2 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 outline-none max-w-[140px]"
                                >
                                  <option value="">Link to News...</option>
                                  {newsList.map((n: any) => (
                                    <option key={n.id} value={`/news/${n.slug}`}>{n.title}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end pt-2 border-t border-black/5 dark:border-white/5">
                            <button 
                              onClick={() => handleDeleteBanner(banner.id)} 
                              className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 text-[10px] font-bold uppercase tracking-widest"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove Banner
                            </button>
                          </div>
                        </div>
                       </div>
                     ))}
                   </div>
                   <div className="mt-12 flex justify-center">
                     <button onClick={async () => {
                       setSaving(true);
                       await saveMockSettings({ ...mockSettings, banners });
                       triggerHaptic();
                       setSaving(false);
                       alert('Banners Synced to Frontend System.');
                     }} className="bg-pink-500 text-white px-20 py-5 rounded-[2.5rem] font-black uppercase tracking-widest italic shadow-2xl shadow-pink-500/40 animate-pulse">Sync Banners</button>
                   </div>
                </div>
              )}
              {activeTab === 'settings' && (
                <SettingsTab key={mockSettings.site_title || 'settings'} mockSettings={mockSettings} handleSaveSettings={handleSaveSettings} saving={saving} />
              )}
              {activeTab === 'github' && (
                <GithubSyncTab 
                  gitConfig={gitConfig} 
                  saveGitConfig={saveGitConfig} 
                  pushAllToGitHub={pushAllToGitHub} 
                  gitConfigLoading={gitConfigLoading} 
                />
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
