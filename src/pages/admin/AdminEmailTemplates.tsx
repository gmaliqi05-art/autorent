import { useState, useEffect } from 'react';
import { Mail, Plus, CreditCard as Edit2, Trash2, Eye, EyeOff, Search, Loader2, CheckCircle2, X, Save, AlertTriangle, ToggleLeft, ToggleRight, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

interface EmailTemplate {
  id: string;
  template_key: string;
  subject_template: string;
  html_template: string;
  text_template: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const templateKeyTranslationKeys: Record<string, string> = {
  booking_confirmation_client: 'tkBookingConfirmationClient',
  booking_confirmation_company: 'tkBookingConfirmationCompany',
  booking_approved: 'tkBookingApproved',
  booking_rejected: 'tkBookingRejected',
  booking_completed: 'tkBookingCompleted',
  booking_cancelled: 'tkBookingCancelled',
  pickup_reminder: 'tkPickupReminder',
  review_request: 'tkReviewRequest',
  company_approved: 'tkCompanyApproved',
  company_rejected: 'tkCompanyRejected',
  company_suspended: 'tkCompanySuspended',
  welcome_client: 'tkWelcomeClient',
  welcome_company: 'tkWelcomeCompany',
  booking_invoice: 'tkBookingInvoice',
  special_offer: 'tkSpecialOffer',
  inactive_client_reminder: 'tkInactiveClientReminder',
  payment_received: 'tkPaymentReceived',
  subscription_expiring: 'tkSubscriptionExpiring',
  subscription_expired: 'tkSubscriptionExpired',
};

const templateCategoryColors: Record<string, string> = {
  booking_confirmation_client: 'bg-blue-100 text-blue-700',
  booking_confirmation_company: 'bg-blue-100 text-blue-700',
  booking_approved: 'bg-green-100 text-green-700',
  booking_rejected: 'bg-red-100 text-red-700',
  booking_completed: 'bg-emerald-100 text-emerald-700',
  booking_cancelled: 'bg-orange-100 text-orange-700',
  pickup_reminder: 'bg-amber-100 text-amber-700',
  review_request: 'bg-yellow-100 text-yellow-700',
  company_approved: 'bg-green-100 text-green-700',
  company_rejected: 'bg-red-100 text-red-700',
  company_suspended: 'bg-rose-100 text-rose-700',
  welcome_client: 'bg-sky-100 text-sky-700',
  welcome_company: 'bg-sky-100 text-sky-700',
  booking_invoice: 'bg-violet-100 text-violet-700',
  special_offer: 'bg-pink-100 text-pink-700',
  inactive_client_reminder: 'bg-slate-100 text-slate-700',
  payment_received: 'bg-teal-100 text-teal-700',
  subscription_expiring: 'bg-amber-100 text-amber-700',
  subscription_expired: 'bg-gray-100 text-gray-700',
};

const emptyTemplate: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'> = {
  template_key: '',
  subject_template: '',
  html_template: '',
  text_template: '',
  description: '',
  is_active: true,
};

type ModalMode = 'edit' | 'preview' | 'create';

export default function AdminEmailTemplates() {
  const { t } = useTranslation();
  const templateKeyLabel = (key: string) => {
    const tk = templateKeyTranslationKeys[key];
    return tk ? t(`adminDash.emailTemplates.${tk}`) : key;
  };
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>('');
  const [modal, setModal] = useState<{ mode: ModalMode; template: Partial<EmailTemplate> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('template_key', { ascending: true });
    setTemplates((data || []) as EmailTemplate[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!modal) return;
    const tpl = modal.template;
    if (!tpl.template_key || !tpl.subject_template || !tpl.html_template) {
      setFeedback({ type: 'error', message: t('adminDash.emailTemplates.errorRequiredFields') });
      return;
    }

    setSaving(true);
    setFeedback(null);

    if (modal.mode === 'create') {
      const { error } = await supabase.from('email_templates').insert({
        template_key: tpl.template_key,
        subject_template: tpl.subject_template,
        html_template: tpl.html_template,
        text_template: tpl.text_template || '',
        description: tpl.description || '',
        is_active: tpl.is_active ?? true,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        setFeedback({ type: 'error', message: t('adminDash.emailTemplates.errorDuplicateKey') });
      } else {
        setFeedback({ type: 'success', message: t('adminDash.emailTemplates.successCreated') });
        setModal(null);
        loadTemplates();
      }
    } else {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject_template: tpl.subject_template,
          html_template: tpl.html_template,
          text_template: tpl.text_template || '',
          description: tpl.description || '',
          is_active: tpl.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tpl.id!);
      if (error) {
        setFeedback({ type: 'error', message: t('adminDash.emailTemplates.errorSaving') });
      } else {
        setFeedback({ type: 'success', message: t('adminDash.emailTemplates.successUpdated') });
        setModal(null);
        loadTemplates();
      }
    }
    setSaving(false);
  }

  async function handleToggle(template: EmailTemplate) {
    setToggling(template.id);
    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: !template.is_active, updated_at: new Date().toISOString() })
      .eq('id', template.id);
    if (!error) {
      setTemplates(prev =>
        prev.map(tpl => tpl.id === template.id ? { ...tpl, is_active: !template.is_active } : tpl)
      );
    }
    setToggling(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('email_templates').delete().eq('id', deleteId);
    if (!error) {
      setTemplates(prev => prev.filter(tpl => tpl.id !== deleteId));
    }
    setDeleting(false);
    setDeleteId(null);
  }

  function openCreate() {
    setModal({ mode: 'create', template: { ...emptyTemplate } });
    setFeedback(null);
  }

  function openEdit(template: EmailTemplate) {
    setModal({ mode: 'edit', template: { ...template } });
    setFeedback(null);
  }

  function openPreview(template: EmailTemplate) {
    setModal({ mode: 'preview', template: { ...template } });
    setPreviewMode('html');
  }

  function updateField(field: keyof EmailTemplate, value: string | boolean) {
    setModal(prev => prev ? { ...prev, template: { ...prev.template, [field]: value } } : prev);
  }

  const filtered = templates.filter(tpl => {
    const label = templateKeyLabel(tpl.template_key);
    const matchSearch = !search ||
      label.toLowerCase().includes(search.toLowerCase()) ||
      tpl.template_key.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase());
    const matchActive = !activeFilter ||
      (activeFilter === 'active' && tpl.is_active) ||
      (activeFilter === 'inactive' && !tpl.is_active);
    return matchSearch && matchActive;
  });

  const stats = {
    total: templates.length,
    active: templates.filter(tpl => tpl.is_active).length,
    inactive: templates.filter(tpl => !tpl.is_active).length,
  };

  const inputClass = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all';
  const textareaClass = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none font-mono text-xs';

  return (
    <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.emailTemplates.title')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">{t('adminDash.emailTemplates.subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('adminDash.emailTemplates.newTemplate')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-500 font-medium mb-1">{t('adminDash.emailTemplates.statTotal')}</p>
            <p className="text-2xl font-bold text-dark-900">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Mail className="w-5 h-5 text-dark-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-500 font-medium mb-1">{t('adminDash.emailTemplates.statActive')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-500 font-medium mb-1">{t('adminDash.emailTemplates.statInactive')}</p>
            <p className="text-2xl font-bold text-dark-400">{stats.inactive}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <EyeOff className="w-5 h-5 text-dark-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder={t('adminDash.emailTemplates.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value as '' | 'active' | 'inactive')}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        >
          <option value="">{t('adminDash.emailTemplates.filterAll')}</option>
          <option value="active">{t('adminDash.emailTemplates.filterActive')}</option>
          <option value="inactive">{t('adminDash.emailTemplates.filterInactive')}</option>
        </select>
      </div>

      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">{t('adminDash.emailTemplates.emptyState')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600">{t('adminDash.emailTemplates.colTemplate')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600 hidden md:table-cell">{t('adminDash.emailTemplates.colSubject')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-600 hidden lg:table-cell">{t('adminDash.emailTemplates.colDescription')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-dark-600">{t('adminDash.emailTemplates.colStatus')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-dark-600">{t('adminDash.emailTemplates.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(template => {
                const label = templateKeyLabel(template.template_key);
                const colorClass = templateCategoryColors[template.template_key] || 'bg-gray-100 text-gray-700';
                return (
                  <tr key={template.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold mb-1 ${colorClass}`}>
                          {label}
                        </span>
                        <p className="text-[11px] text-dark-400 font-mono">{template.template_key}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-dark-700 max-w-xs truncate">{template.subject_template}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-dark-500 max-w-xs truncate">{template.description}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(template)}
                        disabled={toggling === template.id}
                        className="inline-flex items-center justify-center"
                        title={template.is_active ? t('adminDash.emailTemplates.titleDeactivate') : t('adminDash.emailTemplates.titleActivate')}
                      >
                        {toggling === template.id ? (
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : template.is_active ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openPreview(template)}
                          className="p-1.5 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title={t('adminDash.emailTemplates.titlePreview')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(template)}
                          className="p-1.5 text-dark-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('adminDash.emailTemplates.titleEdit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(template.id)}
                          className="p-1.5 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('adminDash.emailTemplates.titleDelete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && modal.mode !== 'preview' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/50 backdrop-blur-sm" onClick={() => !saving && setModal(null)} />
          <div className="relative bg-white rounded-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-dark-950">
                  {modal.mode === 'create' ? t('adminDash.emailTemplates.modalCreate') : t('adminDash.emailTemplates.modalEdit')}
                </h2>
                {modal.mode === 'edit' && (
                  <p className="text-xs text-dark-400 font-mono mt-0.5">{modal.template.template_key}</p>
                )}
              </div>
              <button onClick={() => setModal(null)} disabled={saving} className="text-dark-400 hover:text-dark-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {feedback && (
                <div className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium ${
                  feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {feedback.message}
                </div>
              )}

              {modal.mode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">
                    {t('adminDash.emailTemplates.labelTemplateKey')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={modal.template.template_key || ''}
                    onChange={e => updateField('template_key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder={t('adminDash.emailTemplates.placeholderTemplateKey')}
                    className={inputClass}
                  />
                  <p className="text-[11px] text-dark-400 mt-1">{t('adminDash.emailTemplates.helpTemplateKey')}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">
                  {t('adminDash.emailTemplates.labelDescription')}
                </label>
                <input
                  value={modal.template.description || ''}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder={t('adminDash.emailTemplates.placeholderDescription')}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">
                  {t('adminDash.emailTemplates.labelSubject')} <span className="text-red-500">*</span>
                </label>
                <input
                  value={modal.template.subject_template || ''}
                  onChange={e => updateField('subject_template', e.target.value)}
                  placeholder="Rezervimi juaj per {{vehicleName}} u konfirmua!"
                  className={inputClass}
                />
                <p className="text-[11px] text-dark-400 mt-1">
                  {t('adminDash.emailTemplates.helpSubjectPre')}
                  <code className="bg-gray-100 px-1 rounded">{'{{variabla}}'}</code>
                  {t('adminDash.emailTemplates.helpSubjectPost')}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-dark-600 uppercase tracking-wide">
                    {t('adminDash.emailTemplates.labelHtml')} <span className="text-red-500">*</span>
                  </label>
                  <span className="flex items-center gap-1 text-[11px] text-dark-400">
                    <Code className="w-3 h-3" />
                    HTML
                  </span>
                </div>
                <textarea
                  value={modal.template.html_template || ''}
                  onChange={e => updateField('html_template', e.target.value)}
                  rows={12}
                  placeholder="<!DOCTYPE html><html>..."
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">
                  {t('adminDash.emailTemplates.labelText')}
                </label>
                <textarea
                  value={modal.template.text_template || ''}
                  onChange={e => updateField('text_template', e.target.value)}
                  rows={4}
                  placeholder={t('adminDash.emailTemplates.placeholderText')}
                  className={textareaClass}
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <button
                  onClick={() => updateField('is_active', !modal.template.is_active)}
                  className="flex items-center gap-2"
                >
                  {modal.template.is_active ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
                <div>
                  <p className="text-sm font-medium text-dark-900">
                    {modal.template.is_active ? t('adminDash.emailTemplates.toggleActive') : t('adminDash.emailTemplates.toggleInactive')}
                  </p>
                  <p className="text-xs text-dark-400">
                    {modal.template.is_active ? t('adminDash.emailTemplates.toggleActiveDesc') : t('adminDash.emailTemplates.toggleInactiveDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center shrink-0">
              <button
                onClick={() => setModal(null)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-dark-600 hover:bg-gray-50 transition-colors"
              >
                {t('adminDash.emailTemplates.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('adminDash.emailTemplates.saving') : t('adminDash.emailTemplates.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && modal.mode === 'preview' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-dark-950">{t('adminDash.emailTemplates.previewTitle')}</h2>
                <p className="text-xs text-dark-400 font-mono mt-0.5">{modal.template.template_key}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setPreviewMode('html')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      previewMode === 'html' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setPreviewMode('text')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      previewMode === 'text' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
                    }`}
                  >
                    Text
                  </button>
                </div>
                <button onClick={() => setModal(null)} className="text-dark-400 hover:text-dark-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
              <p className="text-xs text-dark-500">
                <span className="font-semibold text-dark-700">{t('adminDash.emailTemplates.previewSubject')}</span> {modal.template.subject_template}
              </p>
            </div>

            <div className="flex-1 overflow-hidden">
              {previewMode === 'html' ? (
                <iframe
                  srcDoc={modal.template.html_template || `<p>${t('adminDash.emailTemplates.previewNoHtml')}</p>`}
                  title="Email preview"
                  className="w-full h-full"
                  style={{ minHeight: '500px' }}
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="p-6 h-full overflow-y-auto">
                  <pre className="text-xs text-dark-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {modal.template.text_template || t('adminDash.emailTemplates.previewNoText')}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-between shrink-0">
              <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-dark-600 hover:bg-gray-50 transition-colors">
                {t('adminDash.emailTemplates.close')}
              </button>
              <button
                onClick={() => setModal({ mode: 'edit', template: modal.template })}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {t('adminDash.emailTemplates.editTemplate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteId(null)} />
          <div className="relative bg-white rounded-lg border border-gray-200 p-6 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-dark-950 text-center mb-2">{t('adminDash.emailTemplates.deleteTitle')}</h3>
            <p className="text-sm text-dark-500 text-center mb-6">
              {t('adminDash.emailTemplates.deleteDesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-dark-600 hover:bg-gray-50 transition-colors"
              >
                {t('adminDash.emailTemplates.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('adminDash.emailTemplates.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
