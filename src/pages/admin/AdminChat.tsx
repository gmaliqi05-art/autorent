import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CreditCard as Edit3, Trash2, Search, X, Check, Loader2, MessageSquare, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ChatResponse } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

const emptyResponse = {
  category: 'pergjithshme',
  keywords: [] as string[],
  question: '',
  answer: '',
  priority: 0,
  is_active: true,
};

export default function AdminChat() {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<ChatResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyResponse);
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);

  const perPage = 20;

  const categories = [
    { value: '', label: t('adminDash.chat.catAll') },
    { value: 'pergjithshme', label: t('adminDash.chat.catGeneral') },
    { value: 'rezervime', label: t('adminDash.chat.catBookings') },
    { value: 'automjete', label: t('adminDash.chat.catVehicles') },
    { value: 'cmime', label: t('adminDash.chat.catPrices') },
    { value: 'pagesa', label: t('adminDash.chat.catPayments') },
    { value: 'llogari', label: t('adminDash.chat.catAccounts') },
    { value: 'kompani', label: t('adminDash.chat.catCompanies') },
    { value: 'sigurime', label: t('adminDash.chat.catInsurance') },
    { value: 'dokumente', label: t('adminDash.chat.catDocuments') },
    { value: 'lokacione', label: t('adminDash.chat.catLocations') },
    { value: 'suport', label: t('adminDash.chat.catSupport') },
    { value: 'kushte', label: t('adminDash.chat.catTerms') },
    { value: 'teknike', label: t('adminDash.chat.catTechnical') },
    { value: 'ankesa', label: t('adminDash.chat.catComplaints') },
  ];

  useEffect(() => { loadResponses(); }, [catFilter, page]);

  async function loadResponses() {
    setLoading(true);
    let query = supabase.from('chat_responses').select('*', { count: 'exact' });
    if (catFilter) query = query.eq('category', catFilter);
    if (search) query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    const { data, count } = await query.order('priority', { ascending: false }).order('category').range(page * perPage, (page + 1) * perPage - 1);
    setResponses((data || []) as ChatResponse[]);
    setTotal(count || 0);
    setLoading(false);
  }

  function handleSearch() {
    setPage(0);
    loadResponses();
  }

  function startEdit(r: ChatResponse) {
    setEditing(r.id);
    setCreating(false);
    setForm({ category: r.category, keywords: r.keywords || [], question: r.question, answer: r.answer, priority: r.priority, is_active: r.is_active });
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyResponse });
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setForm(emptyResponse);
    setKeywordInput('');
  }

  function addKeyword() {
    if (keywordInput.trim()) {
      setForm(f => ({ ...f, keywords: [...f.keywords, keywordInput.trim().toLowerCase()] }));
      setKeywordInput('');
    }
  }

  function removeKeyword(idx: number) {
    setForm(f => ({ ...f, keywords: f.keywords.filter((_, i) => i !== idx) }));
  }

  async function saveResponse() {
    setSaving(true);
    const payload = {
      category: form.category,
      keywords: form.keywords,
      question: form.question,
      answer: form.answer,
      priority: Number(form.priority),
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('chat_responses').update(payload).eq('id', editing);
    } else {
      await supabase.from('chat_responses').insert(payload);
    }
    cancelEdit();
    setSaving(false);
    loadResponses();
  }

  async function deleteResponse(id: string) {
    if (!confirm(t('adminDash.chat.confirmDelete'))) return;
    await supabase.from('chat_responses').delete().eq('id', id);
    loadResponses();
  }

  const totalPages = Math.ceil(total / perPage);
  const inputClass = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';

  return (
    <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.chat.title')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">{t('adminDash.chat.subtitle', { count: total })}</p>
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          {t('adminDash.chat.addResponse')}
        </button>
      </div>

      {(creating || editing) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark-950 mb-5">{creating ? t('adminDash.chat.newResponse') : t('adminDash.chat.editResponse')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.chat.labelCategory')}</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                {categories.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.chat.labelPriority')}</label>
              <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.chat.labelQuestion')}</label>
              <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} className={inputClass} placeholder={t('adminDash.chat.placeholderQuestion')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.chat.labelAnswer')}</label>
              <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={3} className={`${inputClass} resize-none`} placeholder={t('adminDash.chat.placeholderAnswer')} />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('adminDash.chat.labelKeywords')}</label>
            <div className="flex gap-2 mb-2">
              <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())} className={`${inputClass} flex-1`} placeholder={t('adminDash.chat.placeholderKeyword')} />
              <button onClick={addKeyword} className="px-4 py-2 bg-gray-100 text-dark-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">{t('adminDash.chat.addKeyword')}</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.keywords.map((k, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-md">
                  {k}
                  <button onClick={() => removeKeyword(i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
            </label>
            <span className="text-sm text-dark-700">{t('adminDash.chat.active')}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={saveResponse} disabled={saving || !form.question || !form.answer} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('adminDash.chat.save')}
            </button>
            <button onClick={cancelEdit} className="px-5 py-2.5 bg-gray-100 text-dark-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">{t('adminDash.chat.cancel')}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder={t('adminDash.chat.searchPlaceholder')} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(0); }} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {responses.map(r => (
                <div key={r.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">{r.category}</span>
                        <span className="text-[10px] text-dark-300">{t('adminDash.chat.priorityLabel', { value: r.priority })}</span>
                        {!r.is_active && <span className="text-[10px] text-red-500 font-semibold">{t('adminDash.chat.inactiveBadge')}</span>}
                        <span className="text-[10px] text-dark-300 ml-auto">{t('adminDash.chat.usedTimes', { count: r.usage_count })}</span>
                      </div>
                      <div className="flex items-start gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-primary-500 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-dark-900">{r.question}</p>
                      </div>
                      <p className="text-xs text-dark-500 pl-5 line-clamp-2">{r.answer}</p>
                      {r.keywords && r.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pl-5">
                          {r.keywords.slice(0, 8).map((k, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">{k}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => startEdit(r)} className="p-2 bg-gray-50 text-dark-500 rounded-lg hover:bg-gray-100 hover:text-dark-700 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteResponse(r.id)} className="p-2 bg-gray-50 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-dark-400">{t('adminDash.chat.pageInfo', { page: page + 1, total: totalPages, count: total })}</p>
                <div className="flex gap-1.5">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-medium bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">{t('adminDash.chat.previous')}</button>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-medium bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">{t('adminDash.chat.next')}</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
