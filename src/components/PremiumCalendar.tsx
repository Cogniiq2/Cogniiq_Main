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
    <div className="space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-transparent to-slate-50/30" />

        <div className="relative">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <motion.h3
              className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent"
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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 shadow-sm border border-slate-200 text-slate-600 transition-all hover:bg-white hover:shadow-md hover:border-slate-300 hover:text-slate-900"
              >
                <ChevronLeft size={20} />
              </motion.button>
              <motion.button
                type="button"
                onClick={handleNextMonth}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 shadow-sm border border-slate-200 text-slate-600 transition-all hover:bg-white hover:shadow-md hover:border-slate-300 hover:text-slate-900"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>

          <div className="mb-2 sm:mb-3 grid grid-cols-7 gap-1 sm:gap-2">
            {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
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
              className="grid grid-cols-7 gap-1 sm:gap-2"
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
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-white hover:shadow-md cursor-pointer hover:text-slate-900'
                      }
                      ${today && !selected ? 'ring-2 ring-slate-300 bg-slate-50' : ''}
                      ${selected
                        ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-lg border-slate-600'
                        : 'bg-slate-50/50 border border-slate-200'
                      }
                    `}
                  >
                    {selected && (
                      <motion.div
                        layoutId="selected-date"
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800"
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
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-amber-50/30" />

          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                <Clock size={20} className="text-slate-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Wunschzeit auswählen</h4>
                <p className="text-xs text-slate-500">
                  {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-lg border border-slate-600'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white hover:shadow-md hover:border-slate-300 hover:text-slate-900'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="selected-time"
                        className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800"
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
                className="mt-4 rounded-xl bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 p-4 border border-slate-200"
              >
                <p className="text-sm font-medium text-slate-700 text-center">
                  Ausgewählt: <span className="text-slate-900 font-semibold">{selectedDate.toLocaleDateString('de-DE')} um {selectedTime} Uhr</span>
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
