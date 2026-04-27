import { Link } from 'react-router-dom';
import { MapPin, Fuel, Users, Cog, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Vehicle } from '../../lib/types';

interface VehicleCardProps {
  vehicle: Vehicle & { company?: { id: string; name: string; slug: string; city: string; rating: number } };
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const { t } = useTranslation();
  return (
    <Link
      to={'/automjetet/' + vehicle.id}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-dark-950/5 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
        <img
          src={vehicle.main_image_url || 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop'}
          alt={vehicle.brand + ' ' + vehicle.model}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-dark-700 shadow-sm capitalize">
            {vehicle.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1.5 rounded-lg bg-primary-600 text-xs font-bold text-white shadow-lg shadow-primary-600/30">
            {vehicle.price_per_day} EUR{t('common.perDay')}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-[15px] font-bold text-dark-900 group-hover:text-primary-600 transition-colors">
            {vehicle.brand} {vehicle.model}
          </h3>
          <span className="text-xs text-dark-400 font-medium mt-0.5 shrink-0 ml-2">{vehicle.year}</span>
        </div>

        {vehicle.company && (
          <div className="flex items-center gap-1.5 mb-4">
            <MapPin className="w-3 h-3 text-dark-400" />
            <span className="text-xs text-dark-500">{vehicle.company.name} - {vehicle.company.city}</span>
            {vehicle.company.rating > 0 && (
              <span className="flex items-center gap-0.5 ml-auto text-xs text-accent-600 font-semibold">
                <Star className="w-3 h-3 fill-accent-500 text-accent-500" />
                {vehicle.company.rating}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-[11px] text-dark-500">
            <Cog className="w-3.5 h-3.5 text-dark-400" />
            {vehicle.transmission === 'automatike' ? t('vehicles.automatic') : t('vehicles.manual')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-dark-500">
            <Fuel className="w-3.5 h-3.5 text-dark-400" />
            <span className="capitalize">{vehicle.fuel_type}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-dark-500">
            <Users className="w-3.5 h-3.5 text-dark-400" />
            {vehicle.seats} {t('vehicles.seats').toLowerCase()}
          </div>
        </div>
      </div>
    </Link>
  );
}
