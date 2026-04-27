import { useState, useEffect } from 'react';
import { Car, Plus, Pencil, Loader2, Eye, EyeOff, Trash2, Upload, X, ChevronLeft, ChevronRight, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle, Company, SubscriptionPlan } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';

const ITEMS_PER_PAGE = 8;

const emptyVehicle = {
  brand: '', model: '', year: 2024, category: 'ekonomike', transmission: 'manuale', fuel_type: 'benzine',
  seats: 5, doors: 4, color: '', plate_number: '', mileage: 0, price_per_day: 0, deposit_amount: 0,
  main_image_url: '', is_available: true, is_published: false,
};

export default function CompanyVehicles() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyVehicle });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(vehicles.length / ITEMS_PER_PAGE));
  const paginatedVehicles = vehicles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [vehicles.length, totalPages, currentPage]);

  async function loadData() {
    setError(null);
    try {
      const { data: comp, error: compError } = await supabase.from('companies').select('*').eq('owner_id', user!.id).maybeSingle();
      if (compError) throw compError;
      if (comp) {
        setCompany(comp as Company);
        const [vehRes, planRes] = await Promise.all([
          supabase.from('vehicles').select('*').eq('company_id', comp.id).order('created_at', { ascending: false }),
          comp.subscription_plan_id
            ? supabase.from('subscription_plans').select('*').eq('id', comp.subscription_plan_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (vehRes.error) throw vehRes.error;
        setVehicles((vehRes.data || []) as Vehicle[]);
        setPlan((planRes.data || null) as SubscriptionPlan | null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ndodhi nje gabim gjate ngarkimit te te dhenave.';
      setError(message);
    }
    setLoading(false);
  }

  function openAdd() {
    setForm({ ...emptyVehicle });
    setEditId(null);
    setImageFile(null);
    setImagePreview('');
    setError(null);
    setShowForm(true);
  }

  function openEdit(v: Vehicle) {
    setForm({
      brand: v.brand, model: v.model, year: v.year, category: v.category, transmission: v.transmission,
      fuel_type: v.fuel_type, seats: v.seats, doors: v.doors, color: v.color, plate_number: v.plate_number || '',
      mileage: v.mileage || 0, price_per_day: Number(v.price_per_day),
      deposit_amount: Number(v.deposit_amount), main_image_url: v.main_image_url, is_available: v.is_available, is_published: v.is_published,
    });
    setEditId(v.id);
    setImageFile(null);
    setImagePreview(v.main_image_url || '');
    setError(null);
    setShowForm(true);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Ju lutem zgjidhni nje imazh valid.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Imazhi duhet te jete me i vogel se 5MB.');
        return;
      }
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

  async function uploadImage(): Promise<string | null> {
    if (!imageFile || !company) return null;

    setUploadingImage(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${company.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    setUploadingImage(false);

    if (uploadError) {
      setError('Gabim gjate ngarkimit te imazhit: ' + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setError(null);

    try {
      let imageUrl = form.main_image_url;

      if (imageFile) {
        const uploadedUrl = await uploadImage();
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
      setShowForm(false);
      setError(null);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ndodhi nje gabim gjate ruajtjes.';
      setError(message);
    }
    setSaving(false);
  }

  async function togglePublish(v: Vehicle) {
    setError(null);
    const newPublished = !v.is_published;
    try {
      const { error: toggleError } = await supabase
        .from('vehicles')
        .update({
          is_published: newPublished,
          status: newPublished ? 'active' : 'draft',
          is_available: newPublished ? true : v.is_available,
        })
        .eq('id', v.id);
      if (toggleError) throw toggleError;
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ndodhi nje gabim gjate ndryshimit.';
      setError(message);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from('vehicles').delete().eq('id', deleteId);
      if (deleteError) throw deleteError;
      setDeleteId(null);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ndodhi nje gabim gjate fshirjes.';
      setError(message);
    }
    setDeleting(false);
  }

  if (loading) {
    return (
      <DashboardLayout title="Automjetet" navItems={companyNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Automjetet" navItems={companyNavItems}>
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-dark-950 mb-2">Fshij automjetin</h3>
            <p className="text-sm text-dark-600 mb-6">Jeni te sigurt qe doni te fshini kete automjet?</p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setDeleteId(null); setError(null); }}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors"
              >
                Anulo
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? 'Duke fshire...' : 'Fshij'}
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
                  ? `Keni arritur limitin e automjeteve (${limit}/${limit}). Kaloni ne nje plan me te larte per teshtuar me shume.`
                  : `Po i afroheni limitit — ${vehicles.length} nga ${limit} automjete.`
                }
              </p>
            </div>
            <Link to="/kompania/cilesimet" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Upgrade
            </Link>
          </div>
        );
      })()}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">Automjetet e mia</h1>
          <p className="text-dark-500 text-[15px]">
            {vehicles.length} automjete
            {plan && plan.max_vehicles !== -1 && ` / ${plan.max_vehicles} max (${plan.name})`}
          </p>
        </div>
        {(() => {
          const maxV = plan?.max_vehicles ?? 3;
          const atLimit = maxV !== -1 && vehicles.length >= maxV;
          return (
            <button
              onClick={atLimit ? undefined : openAdd}
              disabled={atLimit}
              title={atLimit ? 'Keni arritur limitin e planit tuaj' : undefined}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${atLimit ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
            >
              <Plus className="w-4 h-4" />
              Shto automjet
            </button>
          );
        })()}
      </div>

      {error && !deleteId && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 animate-slide-down">
          <h3 className="font-semibold text-dark-950 mb-5">{editId ? 'Ndrysho automjetin' : 'Shto automjet te ri'}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Marka" value={form.brand} onChange={v => setForm({ ...form, brand: v })} required />
            <Input label="Modeli" value={form.model} onChange={v => setForm({ ...form, model: v })} required />
            <Input label="Viti" type="number" value={String(form.year)} onChange={v => setForm({ ...form, year: Number(v) })} />
            <Input label="Targa" value={form.plate_number} onChange={v => setForm({ ...form, plate_number: v })} />
            <Input label="Kilometrazhi" type="number" value={String(form.mileage)} onChange={v => setForm({ ...form, mileage: Number(v) })} />
            <Select label="Kategoria" value={form.category} onChange={v => setForm({ ...form, category: v })} options={[['ekonomike','Ekonomike'],['kompakte','Kompakte'],['sedan','Sedan'],['suv','SUV'],['luksoz','Luksoze'],['minivan','Minivan'],['furgon','Furgon']]} />
            <Select label="Transmisioni" value={form.transmission} onChange={v => setForm({ ...form, transmission: v })} options={[['manuale','Manuale'],['automatike','Automatike']]} />
            <Select label="Karburanti" value={form.fuel_type} onChange={v => setForm({ ...form, fuel_type: v })} options={[['benzine','Benzine'],['nafte','Nafte'],['elektrike','Elektrike'],['hibride','Hibride']]} />
            <Input label="Vendet" type="number" value={String(form.seats)} onChange={v => setForm({ ...form, seats: Number(v) })} />
            <Input label="Dyert" type="number" value={String(form.doors)} onChange={v => setForm({ ...form, doors: Number(v) })} />
            <Input label="Ngjyra" value={form.color} onChange={v => setForm({ ...form, color: v })} />
            <Input label="Cmimi/dite (EUR)" type="number" value={String(form.price_per_day)} onChange={v => setForm({ ...form, price_per_day: Number(v) })} required />
            <Input label="Depozita (EUR)" type="number" value={String(form.deposit_amount)} onChange={v => setForm({ ...form, deposit_amount: Number(v) })} />

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-dark-600 mb-1.5">Imazhi i automjetit</label>

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
                  <p className="text-sm text-dark-600 mb-1">Ngarko imazh ose vendos URL</p>
                  <p className="text-xs text-dark-400 mb-3">PNG, JPG, WEBP deri ne 5MB</p>
                  <label className="inline-block px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                    Zgjidhni imazh
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Input
                      label="Ose vendos URL e imazhit"
                      value={form.main_image_url}
                      onChange={v => {
                        setForm({ ...form, main_image_url: v });
                        if (v) setImagePreview(v);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving || uploadingImage} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Duke ruajtur...' : editId ? 'Perditeso' : 'Shto'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors">
                Anulo
              </button>
            </div>
          </form>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-dark-600 font-medium">Nuk keni automjete te regjistruara</p>
          <p className="text-sm text-dark-400 mt-1">Shtoni automjetin e pare per te filluar.</p>
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
                    <button onClick={() => togglePublish(v)} className={`p-1.5 rounded-lg shadow-sm transition-colors ${v.is_published ? 'bg-green-500 text-white' : 'bg-white text-dark-500'}`}>
                      {v.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => openEdit(v)} className="p-1.5 bg-white text-dark-500 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(v.id)} className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-dark-900 text-sm">{v.brand} {v.model}</p>
                  <p className="text-[11px] text-dark-400 mt-0.5">{v.year} | {v.category} | {v.transmission}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-sm font-bold text-primary-600">{v.price_per_day}EUR/dite</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${v.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {v.is_published ? 'Publikuar' : 'Draft'}
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

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-dark-600 mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
