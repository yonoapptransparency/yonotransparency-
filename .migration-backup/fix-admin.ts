import fs from 'fs';

let adminContent = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// Insert FaqEditor component right before AdminDashboard
adminContent = adminContent.replace(
  "export default function AdminDashboard() {",
  `function FaqEditor({ initialFaqs }: { initialFaqs: {question: string, answer: string}[] }) {
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

export default function AdminDashboard() {`
);

adminContent = adminContent.replace(
  "rating: 5.0,\n      created_at: new Date().toISOString()",
  "rating: 5.0,\n      created_at: new Date().toISOString(),\n      faqs: JSON.parse((formData.get('faqs_json') as string) || '[]')"
);

adminContent = adminContent.replace(
  /<textarea name="description_html"([^>]+)><\/textarea>\n\s+<\/div>/g,
  '<textarea name="description_html"$1></textarea>\n                        </div>\n\n                        <FaqEditor initialFaqs={editApp?.faqs || []} />'
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', adminContent);
console.log('Done mapping admin dashboard.')
