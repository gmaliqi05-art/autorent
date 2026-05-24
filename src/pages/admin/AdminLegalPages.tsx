import { useState, useEffect } from 'react';
import { Scale, Save, Loader2, CheckCircle, FileText, Eye, CreditCard as Edit3 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface LegalPage {
  id: string;
  key: string;
  title: string;
  content: string;
  updated_at: string;
}

const defaultPages = [
  { key: 'privacy_policy', title: 'Politika e Privatesise', route: '/politika-privatesise' },
  { key: 'terms_of_use', title: 'Kushtet e Perdorimit', route: '/kushtet-perdorimit' },
  { key: 'cookie_policy', title: 'Politika e Cookies', route: '/politika-cookie' },
  { key: 'legal_notice', title: 'Njoftim Ligjor', route: '/njoftim-ligjor' },
  { key: 'gdpr_rights', title: 'Te Drejtat GDPR', route: '/te-drejtat-gdpr' },
  { key: 'refund_policy', title: 'Politika e Rimbursimit', route: null },
];

export default function AdminLegalPages() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<string>('privacy_policy');
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => { loadPages(); }, []);
  useEffect(() => {
    const page = pages.find(p => p.key === selected);
    if (page) { setEditContent(page.content); setEditTitle(page.title); }
  }, [selected, pages]);

  async function loadPages() {
    const { data } = await supabase.from('legal_pages').select('*');
    if (data && data.length > 0) {
      setPages(data);
    } else {
      setPages(defaultPages.map((p, i) => ({
        id: i.toString(), key: p.key, title: p.title,
        content: `# ${p.title}\n\nKjo faqe eshte nen ndertim. Ju lutem shtoni permbajtjen e plote.`,
        updated_at: new Date().toISOString(),
      })));
    }
    setLoading(false);
  }

  async function savePage() {
    setSaving(true);
    const { data: existing } = await supabase.from('legal_pages').select('id').eq('key', selected).maybeSingle();
    if (existing) {
      await supabase.from('legal_pages').update({ title: editTitle, content: editContent, updated_at: new Date().toISOString() }).eq('key', selected);
    } else {
      await supabase.from('legal_pages').insert({ key: selected, title: editTitle, content: editContent });
    }
    setPages(p => p.map(page => page.key === selected ? { ...page, title: editTitle, content: editContent, updated_at: new Date().toISOString() } : page));
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  const selectedPage = pages.find(p => p.key === selected);
  const selectedMeta = defaultPages.find(p => p.key === selected);

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Faqet Ligjore & Statike">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faqet Ligjore & Statike</h1>
            <p className="text-gray-500 text-sm mt-1">Menaxhoni permbajtjen e faqeve ligjore te platformes</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPreview(!preview)}
              className={`flex items-center gap-2 border px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${preview ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Eye className="w-4 h-4" />Preview
            </button>
            <button onClick={savePage} disabled={saving}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Duke ruajtur...' : saved ? 'U ruajt!' : 'Ruaj'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            <div className="col-span-1 bg-white rounded-xl border border-gray-100 p-4 h-fit">
              {defaultPages.map(({ key, title, route }) => {
                const page = pages.find(p => p.key === key);
                return (
                  <button key={key} onClick={() => setSelected(key)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors mb-1 text-left ${selected === key ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{title}</span>
                  </button>
                );
              })}
            </div>

            <div className="col-span-3 space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Titulli i faqes</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="w-full border-0 text-lg font-bold text-gray-900 focus:outline-none" />
                </div>
                {selectedMeta?.route && (
                  <a href={selectedMeta.route} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg px-3 py-1.5">
                    <Eye className="w-3 h-3" />Shiko live
                  </a>
                )}
              </div>

              {preview ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 prose max-w-none min-h-96">
                  <div dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      editContent
                        .replace(/\n/g, '<br>')
                        .replace(/#{1,6} (.+)/g, '<strong>$1</strong>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                      { ALLOWED_TAGS: ['br', 'strong', 'em', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'], ALLOWED_ATTR: ['href', 'target', 'rel'] },
                    ),
                  }} />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    <Edit3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Editor</span>
                    <span className="text-xs text-gray-400 ml-auto">{editContent.length} karaktere</span>
                  </div>
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                    rows={24} className="w-full text-sm text-gray-700 font-mono resize-none focus:outline-none leading-relaxed"
                    placeholder="Shkruani permbajtjen e faqes ketu..." />
                </div>
              )}

              {selectedPage && (
                <div className="text-xs text-gray-400 text-right">
                  Perditsuar: {new Date(selectedPage.updated_at).toLocaleString('sq-AL')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
