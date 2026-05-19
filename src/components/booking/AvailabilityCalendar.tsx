/**
 * 🔒 PROTECTED COMPONENT — DO NOT DELETE OR REVERT
 *
 * Visual availability calendar that shows blocked dates for a vehicle.
 * Uses RPC `vehicle_blocked_dates` to fetch booked + maintenance windows.
 * Used by VehicleDetailPage to replace basic date inputs.
 */
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AvailabilityCalendarProps {
  vehicleId: string;
  pickupDate: string;
  returnDate: string;
  onSelect: (pickup: string, ret: string) => void;
}

interface BlockedRange {
  start_date: string;
  end_date: string;
  reason: string;
}

const WEEKDAYS = ['Hë', 'Ma', 'Më', 'En', 'Pr', 'Sh', 'Di'];
const MONTHS = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nentor', 'Dhjetor',
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isBlocked(dateStr: string, blocked: BlockedRange[]): boolean {
  return blocked.some(b => dateStr >= b.start_date && dateStr <= b.end_date);
}

function hasBlockedInRange(start: string, end: string, blocked: BlockedRange[]): boolean {
  // E vërtetë nëse ka ndonjë ditë të bllokuar midis [start, end]
  return blocked.some(b => !(b.end_date < start || b.start_date > end));
}

export default function AvailabilityCalendar({
  vehicleId,
  pickupDate,
  returnDate,
  onSelect,
}: AvailabilityCalendarProps) {
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [blocked, setBlocked] = useState<BlockedRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [picking, setPicking] = useState<'pickup' | 'return'>('pickup');

  const today = useMemo(() => toDateStr(new Date()), []);

  // Window i kalendarit: 4 muaj nga muaji aktual
  const windowFrom = useMemo(() => toDateStr(viewMonth), [viewMonth]);
  const windowTo = useMemo(() => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + 4);
    return toDateStr(d);
  }, [viewMonth]);

  useEffect(() => {
    if (!vehicleId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc('vehicle_blocked_dates', {
        p_vehicle_id: vehicleId,
        p_from: windowFrom,
        p_to: windowTo,
      });
      if (!cancelled) {
        setBlocked((data || []) as BlockedRange[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [vehicleId, windowFrom, windowTo]);

  function handleDayClick(dateStr: string) {
    if (dateStr < today) return;
    if (isBlocked(dateStr, blocked)) return;

    if (picking === 'pickup') {
      onSelect(dateStr, dateStr < returnDate ? returnDate : toDateStr(addDays(new Date(dateStr), 1)));
      setPicking('return');
    } else {
      if (dateStr <= pickupDate) {
        // Kliki me herët se pickup → trajtoje si pickup të ri
        onSelect(dateStr, toDateStr(addDays(new Date(dateStr), 1)));
        setPicking('return');
        return;
      }
      // Verifiko qe nuk ka ditë te bllokuara midis [pickup+1, dateStr]
      const startCheck = toDateStr(addDays(new Date(pickupDate), 1));
      if (hasBlockedInRange(startCheck, dateStr, blocked)) {
        // Ka konflikt — rivendos vetëm si pickup
        onSelect(dateStr, toDateStr(addDays(new Date(dateStr), 1)));
        return;
      }
      onSelect(pickupDate, dateStr);
      setPicking('pickup');
    }
  }

  function renderMonth(monthOffset: number) {
    const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + monthOffset, 1);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // E hëna = 0
    const firstDow = (monthStart.getDay() + 6) % 7;

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div key={monthOffset} className="flex-1 min-w-[280px]">
        <p className="text-center font-semibold text-dark-900 text-sm mb-3">
          {MONTHS[month]} {year}
        </p>
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {WEEKDAYS.map(w => (
            <div key={w} className="text-center text-[10px] font-medium text-dark-400 uppercase">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const past = dateStr < today;
            const block = isBlocked(dateStr, blocked);
            const isPickup = dateStr === pickupDate;
            const isReturn = dateStr === returnDate;
            const inRange = pickupDate && returnDate && dateStr > pickupDate && dateStr < returnDate;
            const inHoverRange = picking === 'return' && hoverDate && pickupDate
              && dateStr > pickupDate && dateStr <= hoverDate;

            const disabled = past || block;

            let classes = 'h-9 flex items-center justify-center text-xs rounded-lg transition-all relative ';
            if (disabled) {
              classes += 'text-gray-300 cursor-not-allowed line-through';
              if (block && !past) classes += ' bg-red-50 text-red-300 no-underline';
            } else if (isPickup || isReturn) {
              classes += 'bg-primary-600 text-white font-bold shadow-sm';
            } else if (inRange || inHoverRange) {
              classes += 'bg-primary-100 text-primary-700 font-medium';
            } else {
              classes += 'hover:bg-gray-100 text-dark-700 cursor-pointer';
            }

            return (
              <button
                key={dateStr}
                type="button"
                disabled={disabled}
                onClick={() => handleDayClick(dateStr)}
                onMouseEnter={() => setHoverDate(dateStr)}
                onMouseLeave={() => setHoverDate(null)}
                className={classes}
                title={block ? 'I zene' : past ? 'Date kaluar' : ''}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            const d = new Date(viewMonth);
            d.setMonth(d.getMonth() - 1);
            if (d.getTime() >= startOfMonth(new Date()).getTime()) setViewMonth(d);
          }}
          disabled={viewMonth.getTime() <= startOfMonth(new Date()).getTime()}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 text-dark-600" />
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary-600" />
            <span className="text-dark-600">Të zgjedhura</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-200" />
            <span className="text-dark-600">Të zëna</span>
          </span>
          {loading && <Loader2 className="w-3 h-3 animate-spin text-dark-400 ml-1" />}
        </div>
        <button
          type="button"
          onClick={() => {
            const d = new Date(viewMonth);
            d.setMonth(d.getMonth() + 1);
            setViewMonth(d);
          }}
          className="p-1.5 rounded-lg hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4 text-dark-600" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {renderMonth(0)}
        {renderMonth(1)}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
        <p className="text-dark-500">
          {picking === 'pickup'
            ? 'Klikoni ditën e marrjes'
            : 'Klikoni ditën e kthimit'}
        </p>
        {(pickupDate || returnDate) && (
          <button
            type="button"
            onClick={() => {
              onSelect('', '');
              setPicking('pickup');
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Pastro
          </button>
        )}
      </div>
    </div>
  );
}
