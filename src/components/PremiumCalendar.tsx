import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface PremiumCalendarProps {
  onSelect: (dateTime: string) => void;
  selectedDateTime?: string;
}

export function PremiumCalendar({ onSelect, selectedDateTime }: PremiumCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const daysArray = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      daysArray.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push(new Date(year, month, day));
    }

    return daysArray;
  }, [currentDate]);

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (selectedTime) {
      const dateTimeString = `${date.toLocaleDateString('de-DE')} um ${selectedTime} Uhr`;
      onSelect(dateTimeString);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const dateTimeString = `${selectedDate.toLocaleDateString('de-DE')} um ${time} Uhr`;
      onSelect(dateTimeString);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.02] via-transparent to-violet-500/[0.02]" />

        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <motion.h3
              className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </motion.h3>
            <div className="flex gap-2">
              <motion.button
                type="button"
                onClick={handlePrevMonth}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200/50 text-gray-600 transition-all hover:bg-gray-50 hover:shadow-md hover:border-gray-300"
              >
                <ChevronLeft size={20} />
              </motion.button>
              <motion.button
                type="button"
                onClick={handleNextMonth}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200/50 text-gray-600 transition-all hover:bg-gray-50 hover:shadow-md hover:border-gray-300"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-2">
            {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDate.getMonth()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-2"
            >
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const disabled = isPast(date);
                const today = isToday(date);
                const selected = isSelected(date);

                return (
                  <motion.button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => !disabled && handleDateSelect(date)}
                    disabled={disabled}
                    whileHover={!disabled ? { scale: 1.05 } : {}}
                    whileTap={!disabled ? { scale: 0.95 } : {}}
                    className={`
                      aspect-square rounded-xl text-sm font-medium transition-all relative
                      ${disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-white hover:shadow-md cursor-pointer'
                      }
                      ${today && !selected ? 'ring-2 ring-sky-500/30 bg-sky-50/50' : ''}
                      ${selected
                        ? 'bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/30'
                        : 'bg-white/60 border border-gray-200/50'
                      }
                    `}
                  >
                    {selected && (
                      <motion.div
                        layoutId="selected-date"
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{date.getDate()}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] via-transparent to-sky-500/[0.02]" />

          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/10 to-violet-500/10">
                <Clock size={20} className="text-sky-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Wunschzeit auswählen</h4>
                <p className="text-xs text-gray-400">
                  {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <motion.button
                    key={time}
                    type="button"
                    onClick={() => handleTimeSelect(time)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      relative overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all
                      ${isSelected
                        ? 'bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20'
                        : 'bg-white border border-gray-200/50 text-gray-700 hover:bg-gray-50 hover:shadow-md hover:border-gray-300'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="selected-time"
                        className="absolute inset-0 bg-gradient-to-br from-sky-500 to-violet-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{time}</span>
                  </motion.button>
                );
              })}
            </div>

            {selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl bg-gradient-to-r from-sky-500/10 via-violet-500/10 to-sky-500/10 p-4 border border-sky-200/50"
              >
                <p className="text-sm font-medium text-gray-700 text-center">
                  Ausgewählt: <span className="text-sky-600">{selectedDate.toLocaleDateString('de-DE')} um {selectedTime} Uhr</span>
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
