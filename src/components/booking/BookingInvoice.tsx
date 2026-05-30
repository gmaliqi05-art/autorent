import { Building2, MapPin, Phone, Mail, User, Calendar, Car, FileText, X, Printer } from 'lucide-react';
import type { Vehicle, Company, Profile, Booking } from '../../lib/types';

interface BookingFlowProps {
  mode?: 'flow';
  vehicle: Vehicle;
  company: Company;
  profile: Profile;
  pickupDate: string;
  returnDate: string;
  totalDays: number;
  totalPrice: number;
}

interface DashboardProps {
  mode: 'dashboard';
  booking: Booking;
  vehicle?: Vehicle | null;
  company: Company;
  onClose: () => void;
}

type BookingInvoiceProps = BookingFlowProps | DashboardProps;

export default function BookingInvoice(props: BookingInvoiceProps) {
  const isDashboard = 'mode' in props && props.mode === 'dashboard';

  const companyData = props.company;
  const vehicleData = isDashboard ? props.vehicle : props.vehicle;

  const pickupDate = isDashboard ? props.booking.pickup_date : props.pickupDate;
  const returnDate = isDashboard ? props.booking.return_date : props.returnDate;
  const totalDays = isDashboard ? props.booking.total_days : props.totalDays;
  const totalPrice = isDashboard ? Number(props.booking.total_price) : props.totalPrice;
  const pricePerDay = isDashboard ? Number(props.booking.price_per_day) : Number(vehicleData?.price_per_day || 0);
  const depositAmount = isDashboard ? Number(props.booking.deposit_amount || 0) : Number(vehicleData?.deposit_amount || 0);

  const clientName = isDashboard ? props.booking.client_name : props.profile.full_name;
  const clientEmail = isDashboard ? props.booking.client_email : props.profile.email;
  const clientPhone = isDashboard ? props.booking.client_phone : props.profile.phone;

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString('sq-AL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" id="invoice-content">
      <div className="bg-gradient-to-r from-dark-900 to-dark-800 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Fatura e Rezervimit</h3>
              <p className="text-white/60 text-xs">{invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDashboard && (
              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Printer className="w-4 h-4 text-white" />
              </button>
            )}
            <p className="text-white/60 text-xs">{today}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">Kompania</span>
            </div>
            <p className="font-bold text-dark-900">{companyData.name}</p>
            <div className="mt-2 space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs text-dark-500">
                <MapPin className="w-3 h-3 shrink-0" />
                {companyData.city}, {companyData.country}
              </p>
              {companyData.phone && (
                <p className="flex items-center gap-1.5 text-xs text-dark-500">
                  <Phone className="w-3 h-3 shrink-0" />
                  {companyData.phone}
                </p>
              )}
              {companyData.email && (
                <p className="flex items-center gap-1.5 text-xs text-dark-500">
                  <Mail className="w-3 h-3 shrink-0" />
                  {companyData.email}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">Klienti</span>
            </div>
            <p className="font-bold text-dark-900">{clientName}</p>
            <div className="mt-2 space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs text-dark-500">
                <Mail className="w-3 h-3 shrink-0" />
                {clientEmail}
              </p>
              {clientPhone && (
                <p className="flex items-center gap-1.5 text-xs text-dark-500">
                  <Phone className="w-3 h-3 shrink-0" />
                  {clientPhone}
                </p>
              )}
            </div>
          </div>
        </div>

        {vehicleData && (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-dark-500" />
                <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">Detajet e automjetit</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {vehicleData.main_image_url ? (
                    <img src={vehicleData.main_image_url} alt={`${vehicleData.brand} ${vehicleData.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-dark-900">{vehicleData.brand} {vehicleData.model}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{vehicleData.year} | {vehicleData.transmission === 'automatike' ? 'Automatike' : 'Manuale'} | {vehicleData.fuel_type}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-dark-500" />
              <span className="text-xs font-semibold text-dark-500 uppercase tracking-wider">Periudha e qerase</span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-dark-400 mb-0.5">Data e marrjes</p>
              <p className="text-sm font-semibold text-dark-900">
                {new Date(pickupDate).toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-dark-400 mb-0.5">Data e kthimit</p>
              <p className="text-sm font-semibold text-dark-900">
                {new Date(returnDate).toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-dark-500">Cmimi per dite</span>
            <span className="font-medium text-dark-900">{pricePerDay} EUR</span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm border-t border-gray-50">
            <span className="text-dark-500">Numri i diteve</span>
            <span className="font-medium text-dark-900">{totalDays} dite</span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm border-t border-gray-50">
            <span className="text-dark-500">Nentotali</span>
            <span className="font-medium text-dark-900">{totalPrice} EUR</span>
          </div>
          {depositAmount > 0 && (
            <div className="px-4 py-3 flex justify-between text-sm border-t border-gray-50">
              <span className="text-dark-500">Depozita (kthehet pas kthimit)</span>
              <span className="font-medium text-dark-900">{depositAmount} EUR</span>
            </div>
          )}
          <div className="px-4 py-4 flex justify-between bg-primary-50 border-t border-primary-100">
            <span className="font-bold text-dark-900">Totali per pagese</span>
            <span className="text-xl font-bold text-primary-600">{totalPrice} EUR</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDashboard) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm" onClick={props.onClose} />
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <button
            onClick={props.onClose}
            className="absolute right-3 top-3 z-10 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
