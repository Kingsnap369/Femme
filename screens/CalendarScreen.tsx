
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { DayType } from '../types';
// FIX: Add missing imports 'addDays', 'subDays', and 'differenceInDays' from 'date-fns'.
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isSameDay, isToday, parseISO, isWithinInterval, addDays, differenceInDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HeartIcon } from '../components/Icons';

const CalendarScreen: React.FC = () => {
    const { settings, periodHistory, activityHistory, lastPeriod, nextPeriodDate, ovulationDate, fertileWindow, addActivityLog, addPeriodEntry } = useAppContext();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getDayType = (day: Date): DayType => {
        // This logic calculates for past, current and future cycles
        for (const entry of periodHistory) {
            const periodStart = parseISO(entry.startDate);
            const periodEnd = addMonths(addDays(periodStart, settings.periodLength - 1), 0); // Correctly handle period range
            if (isWithinInterval(day, { start: periodStart, end: periodEnd })) {
                return DayType.Period;
            }
        }
        
        // Simplified future prediction based on last cycle
        if (lastPeriod && nextPeriodDate && ovulationDate && fertileWindow) {
             const cycleCount = Math.floor(differenceInDays(day, parseISO(lastPeriod.startDate)) / settings.cycleLength);

             if (cycleCount >= 0) {
                 const cycleStartDate = addDays(parseISO(lastPeriod.startDate), cycleCount * settings.cycleLength);
                 
                 const periodEndDate = addDays(cycleStartDate, settings.periodLength - 1);
                 if (isWithinInterval(day, { start: cycleStartDate, end: periodEndDate })) return DayType.Period;

                 const cycleNextPeriodDate = addDays(cycleStartDate, settings.cycleLength);
                 const cycleOvulationDate = subDays(cycleNextPeriodDate, 14);
                 if (isSameDay(day, cycleOvulationDate)) return DayType.Ovulation;

                 const cycleFertileStart = subDays(cycleOvulationDate, 5);
                 if (isWithinInterval(day, { start: cycleFertileStart, end: cycleOvulationDate })) return DayType.Fertile;
             }
        }

        return DayType.Safe;
    };
    
    const dayStyles = (dayType: DayType, isSelected: boolean, isCurrent: boolean) => {
        let styles = 'w-10 h-10 flex items-center justify-center rounded-full text-sm relative ';
        if (isCurrent) styles += ' border-2 border-accent-light dark:border-accent-dark ';
        if (isSelected) styles += ' ring-2 ring-offset-2 ring-accent-light dark:ring-accent-dark ';
        
        switch (dayType) {
            case DayType.Period:
                styles += 'bg-accent-light/80 dark:bg-accent-dark/80 text-white';
                break;
            case DayType.Fertile:
                styles += 'bg-fertile-light dark:bg-fertile-dark text-gray-700 dark:text-gray-200';
                break;
            case DayType.Ovulation:
                styles += 'bg-fertile-light dark:bg-fertile-dark border-2 border-accent-light dark:border-accent-dark text-gray-700 dark:text-gray-200';
                break;
            case DayType.Safe:
                 styles += 'bg-safe-light/60 dark:bg-safe-dark/60';
                 break;
            default:
                 styles += 'text-gray-700 dark:text-gray-300';
        }
        return styles;
    };

    const firstDayOfMonth = getDay(startOfMonth(currentMonth)) - 1 < 0 ? 6 : getDay(startOfMonth(currentMonth)) - 1;

    const changeMonth = (amount: number) => {
        setCurrentMonth(addMonths(currentMonth, amount));
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-secondary-dark">&lt;</button>
                <h2 className="text-xl font-bold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-secondary-dark">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {daysInMonth.map(day => {
                    const dayType = getDayType(day);
                    const hasActivity = activityHistory.some(a => isSameDay(parseISO(a.date), day));
                    return (
                        <div key={day.toString()} className="flex items-center justify-center">
                            <button className={dayStyles(dayType, false, isToday(day))}>
                                {format(day, 'd')}
                                {hasActivity && <HeartIcon className="w-3 h-3 absolute bottom-0.5 right-0.5 text-red-500" />}
                            </button>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-accent-light/80 dark:bg-accent-dark/80 mr-2"></div> Période de règles</div>
                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-fertile-light dark:bg-fertile-dark mr-2"></div> Période fertile</div>
                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-fertile-light dark:bg-fertile-dark border-2 border-accent-light dark:border-accent-dark mr-2"></div> Jour d'ovulation</div>
                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-safe-light/60 dark:bg-safe-dark/60 mr-2"></div> Faible risque</div>
            </div>
            <div className="mt-4 flex space-x-2">
                 <button onClick={() => addPeriodEntry(new Date())} className="flex-1 bg-accent-light text-white py-2 px-4 rounded-lg shadow hover:opacity-90 transition">
                    Début des règles aujourd'hui
                 </button>
                 <button onClick={() => addActivityLog(new Date())} className="flex-1 bg-blue-400 text-white py-2 px-4 rounded-lg shadow hover:opacity-90 transition">
                     Rapport sexuel
                 </button>
            </div>
        </div>
    );
};

export default CalendarScreen;