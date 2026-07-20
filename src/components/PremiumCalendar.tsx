import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PremiumCalendarProps {
  onSelect: (dateTime: string) => void;
  selectedDateTime?: string;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

function parseSelectedDateTime(value?: string): { date: Date | null; time: string } {
  if (!value) return { date: null, time: '' };

  const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s*(?:um|·)\s*(\d{2}:\d{2}))?/);
  if (!match) return { date: null, time: '' };

  const [, day, month, year, time = ''] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? { date: null, time: '' } : { date, time };
}

export function PremiumCalendar({ onSelect, selectedDateTime }: PremiumCalendarProps) {
  const initialSelection = useMemo(() => parseSelectedDateTime(selectedDateTime), [selectedDateTime]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialSelection.date);
  const [selectedTime, setSelectedTime] = useState(initialSelection.time);

  useEffect(() => {
    setSelectedDate(initialSelection.date);
    setSelectedTime(initialSelection.time);
    if (initialSelection.date) {
      setCurrentDate(new Date(initialSelection.date.getFullYear(), initialSelection.date.getMonth(), 1));
    }
  }, [initialSelection]);

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    return cells;
  }, [currentDate]);

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (date: Date) =>
    date.toDateString() === new Date().toDateString();

  const isSelected = (date: Date) =>
    selectedDate?.toDateString() === date.toDateString();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (selectedTime) {
      onSelect(`${date.toLocaleDateString('de-DE')} um ${selectedTime} Uhr`);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      onSelect(`${selectedDate.toLocaleDateString('de-DE')} um ${time} Uhr`);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Calendar grid */}
      <div
        className="border border-gray-200 rounded-xl overflow-hidden"
        style={{ background: '#fafafa' }}
      >
        {/* Month nav */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background: '#ffffff' }}
        >
          <span
            className="text-gray-900 font-medium"
            style={{ fontSize: '13px', letterSpacing: '-0.01em' }}
          >
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 pt-3 pb-1">
          {DAY_LABELS.map(d => (
            <div
              key={d}
              className="text-center text-gray-400"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', paddingBottom: '6px' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-7 px-3 pb-3 gap-y-1"
          >
            {days.map((date, idx) => {
              if (!date) return <div key={`e-${idx}`} />;

              const past = isPast(date);
              const today = isToday(date);
              const sel = isSelected(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={past}
                  onClick={() => !past && handleDateSelect(date)}
                  className="aspect-square flex items-center justify-center rounded-lg text-xs transition-all mx-0.5"
                  style={{
                    fontSize: '12.5px',
                    fontWeight: sel ? 500 : 400,
                    background: sel ? '#111827' : today ? '#f3f4f6' : 'transparent',
                    color: sel ? '#ffffff' : past ? '#d1d5db' : today ? '#111827' : '#374151',
                    cursor: past ? 'default' : 'pointer',
                    outline: today && !sel ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Time slots — only shown after date selection */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="border border-gray-200 rounded-xl overflow-hidden"
          style={{ background: '#fafafa' }}
        >
          <div
            className="px-5 py-3.5 border-b border-gray-100"
            style={{ background: '#ffffff' }}
          >
            <p className="text-gray-500" style={{ fontSize: '12px', fontWeight: 400 }}>
              {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            {TIME_SLOTS.map(time => {
              const active = selectedTime === time;
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleTimeSelect(time)}
                  className="py-2.5 rounded-lg text-center transition-all"
                  style={{
                    fontSize: '12.5px',
                    fontWeight: active ? 500 : 400,
                    background: active ? '#111827' : '#ffffff',
                    color: active ? '#ffffff' : '#374151',
                    border: `1px solid ${active ? '#111827' : '#e5e7eb'}`,
                    cursor: 'pointer',
                  }}
                >
                  {time}
                </button>
              );
            })}
          </div>

          {selectedTime && (
            <div
              className="mx-3 mb-3 px-4 py-3 rounded-lg border border-gray-100"
              style={{ background: '#f9fafb' }}
            >
              <p className="text-gray-600 text-xs text-center" style={{ lineHeight: 1.5 }}>
                Wunschtermin:{' '}
                <span className="font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('de-DE')} · {selectedTime} Uhr
                </span>
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
