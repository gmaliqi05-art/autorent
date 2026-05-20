import { useState, useEffect, useMemo } from 'react';
import { Car, Plus, Pencil, Loader2, Eye, EyeOff, Trash2, Upload, X, ChevronLeft, ChevronRight, AlertTriangle, ArrowUpRight, Copy, Search, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle, Company, SubscriptionPlan } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';

const ITEMS_PER_PAGE = 8;

const AVAILABLE_FEATURES = [
  'ac', 'bluetooth', 'gps', 'usb', 'cruise_control', 'parking_sensors',
  'rearview_camera', 'sunroof', 'leather_seats', 'heated_seats', '4wd',
  'apple_carplay', 'android_auto',
] as const;

type FormState = {
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  doors: number;
  color: string;
  plate_number: string;
  mileage: number;
  price_per_day: number;
  deposit_amount: number;
  main_image_url: string;
  images: string[];
  features: string[];
  is_available: boolean;
  is_published: boolean;
};

const emptyVehicle: FormState = {
  brand: '', model: '', year: 2024, category: 'ekonomike', transmission: 'manuale', fuel_type: 'benzine',
  seats: 5, doors: 4, color: '', plate_number: '', mileage: 0, price_per_day: 0, deposit_amount: 0,
  main_image_url: '', images: [], features: [], is_available: true, is_published: false,
};

const CATEGORY_VALUES = ['ekonomike', 'kompakte', 'sedan', 'suv', 'luksoz', 'minivan', 'furgon'];
const TRANSMISSION_VALUES = ['manuale', 'automatike'];
const FUEL_VALUES = ['benzine', 'nafte', 'elektrike', 'hibride'];

const MAX_GALLERY = 8;

function extractStoragePath(url: string): string | null {
  const marker = '/vehicle-images/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export default function CompanyVehicles() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [company, setCompany] = useState<Company | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyVehicle });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [previousImageUrl, setPreviousImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(v =>
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.plate_number || '').toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE));
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredVehicles.length, totalPages, currentPage]);

  async function loadData() {
    setError(null);
    try {
      const { data: comp, error: compError } = await supabase.from('companies').select('*').eq('owner_id', user!.id).maybeSingle();
      if (compError) throw compError;
      if (comp) {
        setCompany(comp as Company);
        const [vehRes, planRes] = await Promise.all([
          supabase.from('vehicles').select('*').eq('company_id', comp.id).is('deleted_at', null).order('created_at', { ascending: false }),
          comp.subscription_plan_id
            ? supabase.from('subscription_plans').select('*').eq('id', comp.subscription_plan_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (vehRes.error) throw vehRes.error;
        setVehicles((vehRes.data || []) as Vehicle[]);
        setPlan((planRes.data || null) as SubscriptionPlan | null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.loadError');
      setError(message);
    }
    setLoading(false);
  }

  function resetForm() {
    setForm({ ...emptyVehicle });
    setEditId(null);
    setImageFile(null);
    setImagePreview('');
    setPreviousImageUrl('');
    setError(null);
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(v: Vehicle) {
    setForm({
      brand: v.brand, model: v.model, year: v.year, category: v.category, transmission: v.transmission,
      fuel_type: v.fuel_type, seats: v.seats, doors: v.doors, color: v.color, plate_number: v.plate_number || '',
      mileage: v.mileage || 0, price_per_day: Number(v.price_per_day),
      deposit_amount: Number(v.deposit_amount), main_image_url: v.main_image_url,
      images: v.images || [], features: v.features || [],
      is_available: v.is_available, is_published: v.is_published,
    });
    setEditId(v.id);
    setImageFile(null);
    setImagePreview(v.main_image_url || '');
    setPreviousImageUrl(v.main_image_url || '');
    setError(null);
    setShowForm(true);
  }

  function cloneVehicle(v: Vehicle) {
    setForm({
      brand: v.brand, model: v.model, year: v.year, category: v.category, transmission: v.transmission,
      fuel_type: v.fuel_type, seats: v.seats, doors: v.doors, color: v.color,
      plate_number: '',
      mileage: 0, price_per_day: Number(v.price_per_day),
      deposit_amount: Number(v.deposit_amount),
      main_image_url: v.main_image_url,
      images: v.images || [],
      features: v.features || [],
      is_available: true,
      is_published: false,
    });
    setEditId(null);
    setImageFile(null);
    setImagePreview(v.main_image_url || '');
    setPreviousImageUrl('');
    setError(null);
    setShowForm(true);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(t('companyDash.vehicles.imageInvalid'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(t('companyDash.vehicles.imageTooLarge'));
        return;
      }
      setError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview('');
    setForm({ ...form, main_image_url: '' });
  }

  async function uploadMainImage(): Promise<string | null> {
    if (!imageFile || !company) return null;
    setUploadingImage(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${company.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });
    setUploadingImage(false);
    if (uploadError) {
      setError(`${t('companyDash.vehicles.imageUploadError')}: ${uploadError.message}`);
      return null;
    }
    const { data } = supabase.storage.from('vehicle-images').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleGalleryUpload(files: FileList) {
    if (!company) return;
    const remaining = MAX_GALLERY - form.images.length;
    if (remaining <= 0) {
      setError(t('companyDash.vehicles.galleryMax', { max: MAX_GALLERY }));
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingGallery(true);
    setError(null);
    const uploaded: string[] = [];
    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) continue;
      const ext = file.name.split('.').pop();
      const name = `${company.id}/gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('vehicle-images').upload(name, file, { upsert: false });
      if (!upErr) {
        const { data } = supabase.storage.from('vehicle-images').getPublicUrl(name);
        uploaded.push(data.publicUrl);
      }
    }
    setUploadingGallery(false);
    if (uploaded.length > 0) {
      setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded] }));
    }
  }

  async function removeGalleryImage(url: string) {
    setForm(prev => ({ ...prev, images: prev.images.filter(x => x !== url) }));
    const path = extractStoragePath(url);
    if (path) {
      await supabase.storage.from('vehicle-images').remove([path]);
    }
  }

  function toggleFeature(f: string) {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f) ? prev.features.filter(x => x !== f) : [...prev.features, f],
    }));
  }

  function validateForPublish(): string | null {
    if (form.is_published) {
      if (!form.main_image_url && !imageFile) return t('companyDash.vehicles.validationImage');
      if (!form.brand.trim()) return t('companyDash.vehicles.validationBrand');
      if (!form.model.trim()) return t('companyDash.vehicles.validationModel');
      if (!form.plate_number.trim()) return t('companyDash.vehicles.validationPlate');
      if (!(Number(form.price_per_day) > 0)) return t('companyDash.vehicles.validationPrice');
    }
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    const validationError = validateForPublish();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);

    try {
      let imageUrl = form.main_image_url;
      if (imageFile) {
        const uploadedUrl = await uploadMainImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setSaving(false);
          return;
        }
      }

      const payload = {
        brand: form.brand,
        model: form.model,
        year: form.year,
        category: form.category,
        transmission: form.transmission,
        fuel_type: form.fuel_type,
        seats: form.seats,
        doors: form.doors,
        color: form.color,
        plate_number: form.plate_number,
        mileage: form.mileage,
        price_per_day: form.price_per_day,
        deposit_amount: form.deposit_amount,
        main_image_url: imageUrl,
        images: form.images,
        features: form.features,
        is_available: form.is_available,
        is_published: form.is_published,
        status: form.is_published ? 'active' : 'draft',
      };

      if (editId) {
        const { error: updateError } = await supabase.from('vehicles').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('vehicles').insert({ ...payload, company_id: company.id });
        if (insertError) throw insertError;
      }

      if (previousImageUrl && previousImageUrl !== imageUrl) {
        const oldPath = extractStoragePath(previousImageUrl);
        if (oldPath) {
          await supabase.storage.from('vehicle-images').remove([oldPath]);
        }
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.saveError');
      setError(message);
    }
    setSaving(false);
  }

  async function togglePublish(v: Vehicle) {
    setError(null);
    const newPublished = !v.is_published;
    if (newPublished) {
      if (!v.main_image_url || !v.brand || !v.model || !v.plate_number || !(Number(v.price_per_day) > 0)) {
        setError(t('companyDash.vehicles.validationPublish'));
        return;
      }
    }
    try {
      const { error: toggleError } = await supabase
        .from('vehicles')
        .update({
          is_published: newPublished,
          status: newPublished ? 'active' : 'draft',
        })
        .eq('id', v.id);
      if (toggleError) throw toggleError;
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.saveError');
      setError(message);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setError(null);
    try {
      const { data: active, error: abErr } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', deleteId)
        .in('status', ['pending', 'confirmed', 'active'])
        .limit(1);
      if (abErr) throw abErr;
      if (active && active.length > 0) {
        setError(t('companyDash.vehicles.deleteBlockedActive'));
        setDeleting(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from('vehicles')
        .update({ deleted_at: new Date().toISOString(), is_published: false, status: 'inactive' })
        .eq('id', deleteId);
      if (updateErr) throw updateErr;

      setDeleteId(null);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('companyDash.common.saveError');
      setError(message);
    }
    setDeleting(false);
  }

  if (loading) {
    return (
      <DashboardLayout title={t('companyDash.vehicles.title')} navItems={companyNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const categoryOptions: [string, string][] = CATEGORY_VALUES.map(v => [v, t(`companyDash.vehicles.category_${v}`)]);
  const transmissionOptions: [string, string][] = TRANSMISSION_VALUES.map(v => [v, t(`companyDash.vehicles.transmission_${v}`)]);
  const fuelOptions: [string, string][] = FUEL_VALUES.map(v => [v, t(`companyDash.vehicles.fuel_${v}`)]);

  return (
    <DashboardLayout title={t('companyDash.vehicles.title')} navItems={companyNavItems}>
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-dark-950 mb-2">{t('companyDash.vehicles.deleteTitle')}</h3>
            <p className="text-sm text-dark-600 mb-6">{t('companyDash.vehicles.deleteConfirm')}</p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setDeleteId(null); setError(null); }}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors"
              >
                {t('companyDash.common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? t('companyDash.common.deleting') : t('companyDash.common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const maxV = plan?.max_vehicles ?? 3;
        const limit = maxV === -1 ? null : maxV;
        const atLimit = limit !== null && vehicles.length >= limit;
        const nearLimit = limit !== null && vehicles.length >= limit * 0.8 && !atLimit;
        if (!atLimit && !nearLimit) return null;
        return (
          <div className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${atLimit ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${atLimit ? 'text-red-500' : 'text-amber-500'}`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${atLimit ? 'text-red-800' : 'text-amber-800'}`}>
                {atLimit
                  ? t('companyDash.vehicles.atLimitTitle', { count: limit, limit })
                  : t('companyDash.vehicles.nearLimitTitle', { count: vehicles.length, limit })
                }
              </p>
            </div>
            <Link to="/kompania/abonimi" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {t('companyDash.overview.upgrade')}
            </Link>
          </div>
        );
      })()}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('companyDash.vehicles.myFleet')}</h1>
          <p className="text-dark-500 text-[15px]">
            {plan && plan.max_vehicles !== -1
              ? t('companyDash.vehicles.fleetCountWithLimit', { count: vehicles.length, limit: plan.max_vehicles, plan: plan.name })
              : t('companyDash.vehicles.fleetCount', { count: vehicles.length })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder={t('companyDash.vehicles.searchPlaceholder')}
              className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-w-[220px]"
            />
          </div>
          {(() => {
            const maxV = plan?.max_vehicles ?? 3;
            const atLimit = maxV !== -1 && vehicles.length >= maxV;
            return (
              <button
                onClick={atLimit ? undefined : openAdd}
                disabled={atLimit}
                title={atLimit ? t('companyDash.vehicles.atLimitTooltip') : undefined}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${atLimit ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
              >
                <Plus className="w-4 h-4" />
                {t('companyDash.vehicles.addVehicle')}
              </button>
            );
          })()}
        </div>
      </div>

      {error && !deleteId && !showForm && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-dark-950 mb-5">{editId ? t('companyDash.vehicles.editVehicle') : t('companyDash.vehicles.addNew')}</h3>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label={t('companyDash.vehicles.brand')} value={form.brand} onChange={v => setForm({ ...form, brand: v })} required />
            <Input label={t('companyDash.vehicles.model')} value={form.model} onChange={v => setForm({ ...form, model: v })} required />
            <Input label={t('companyDash.vehicles.year')} type="number" value={String(form.year)} onChange={v => setForm({ ...form, year: Number(v) })} />
            <Input label={t('companyDash.vehicles.plateNumber')} value={form.plate_number} onChange={v => setForm({ ...form, plate_number: v })} />
            <Input label={t('companyDash.vehicles.mileage')} type="number" value={String(form.mileage)} onChange={v => setForm({ ...form, mileage: Number(v) })} />
            <Select label={t('companyDash.vehicles.category')} value={form.category} onChange={v => setForm({ ...form, category: v })} options={categoryOptions} />
            <Select label={t('companyDash.vehicles.transmission')} value={form.transmission} onChange={v => setForm({ ...form, transmission: v })} options={transmissionOptions} />
            <Select label={t('companyDash.vehicles.fuelType')} value={form.fuel_type} onChange={v => setForm({ ...form, fuel_type: v })} options={fuelOptions} />
            <Input label={t('companyDash.vehicles.seats')} type="number" value={String(form.seats)} onChange={v => setForm({ ...form, seats: Number(v) })} />
            <Input label={t('companyDash.vehicles.doors')} type="number" value={String(form.doors)} onChange={v => setForm({ ...form, doors: Number(v) })} />
            <Input label={t('companyDash.vehicles.color')} value={form.color} onChange={v => setForm({ ...form, color: v })} />
            <Input label={t('companyDash.vehicles.pricePerDay')} type="number" value={String(form.price_per_day)} onChange={v => setForm({ ...form, price_per_day: Number(v) })} required />
            <Input label={t('companyDash.vehicles.depositAmount')} type="number" value={String(form.deposit_amount)} onChange={v => setForm({ ...form, deposit_amount: Number(v) })} />

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('companyDash.vehicles.vehicleImage')}</label>

              {imagePreview || form.main_image_url ? (
                <div className="relative w-full max-w-md">
                  <img src={imagePreview || form.main_image_url} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-dark-600 mb-1">{t('companyDash.vehicles.uploadPrompt')}</p>
                  <p className="text-xs text-dark-400 mb-3">{t('companyDash.vehicles.uploadHint')}</p>
                  <label className="inline-block px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                    {t('companyDash.vehicles.chooseImage')}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-dark-600 mb-1.5">
                {t('companyDash.vehicles.gallery')} ({form.images.length}/{MAX_GALLERY})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {form.images.map(url => (
                  <div key={url} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="gallery" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(url)}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {form.images.length < MAX_GALLERY && (
                  <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    {uploadingGallery ? (
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-dark-500">{t('companyDash.vehicles.addImages')}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        if (e.target.files) handleGalleryUpload(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-dark-600 mb-1.5">{t('companyDash.vehicles.features')}</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_FEATURES.map(f => {
                  const active = form.features.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFeature(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-dark-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t(`companyDash.vehicles.feature_${f}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-dark-700">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                {t('companyDash.vehicles.publishImmediately')}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-dark-700">
                <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                {t('companyDash.vehicles.available')}
              </label>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving || uploadingImage} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? t('companyDash.common.saving') : editId ? t('companyDash.vehicles.submitUpdate') : t('companyDash.vehicles.submitAdd')}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-5 py-2.5 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors">
                {t('companyDash.common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">
            {search ? t('companyDash.vehicles.noResults') : t('companyDash.vehicles.noFleet')}
          </p>
          <p className="text-sm text-dark-400 mt-1">
            {search ? t('companyDash.vehicles.noResultsDesc') : t('companyDash.vehicles.noFleetDesc')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedVehicles.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                <div className="aspect-[16/10] bg-gray-100 relative">
                  {v.main_image_url ? (
                    <img src={v.main_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-gray-300" /></div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button onClick={() => togglePublish(v)} title={v.is_published ? t('companyDash.vehicles.unpublish') : t('companyDash.vehicles.publish')} className={`p-1.5 rounded-lg shadow-sm transition-colors ${v.is_published ? 'bg-green-500 text-white' : 'bg-white text-dark-500'}`}>
                      {v.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => openEdit(v)} title={t('companyDash.common.edit')} className="p-1.5 bg-white text-dark-500 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => cloneVehicle(v)} title={t('companyDash.vehicles.clone')} className="p-1.5 bg-white text-blue-500 rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(v.id)} title={t('companyDash.common.delete')} className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-dark-900 text-sm">{v.brand} {v.model}</p>
                  <p className="text-[11px] text-dark-400 mt-0.5">{v.year} | {t(`companyDash.vehicles.category_${v.category}`, v.category)} | {t(`companyDash.vehicles.transmission_${v.transmission}`, v.transmission)}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-sm font-bold text-primary-600">{v.price_per_day} {t('companyDash.common.perDay')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${v.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {v.is_published ? t('companyDash.vehicles.publishedBadge') : t('companyDash.vehicles.draftBadge')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 text-dark-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-gray-50 border border-gray-200'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-dark-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-dark-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-dark-600 mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
