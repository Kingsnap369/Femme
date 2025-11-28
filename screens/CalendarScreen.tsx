
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { DayType, ActivityLog, PeriodEntry } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, getDay, isSameDay, isToday, parseISO, isWithinInterval, addDays, subDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HeartIcon, XMarkIcon, DropIcon, SparklesIcon, CalendarIcon, ArrowPathIcon } from '../components/Icons';
import { ConfirmationModal } from '../components/ConfirmationModal';

const DateActionModal: React.FC<{
    selectedDate: Date;
    onClose: () => void;
    periodEntry: PeriodEntry | undefined;
    activityLog: ActivityLog | undefined;
}> = ({ selectedDate, onClose, periodEntry, activityLog }) => {
    const { addActivityLog, removeActivityLog, addPeriodEntry, removePeriodEntry } = useAppContext();
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ action: () => void; message: string; } | null>(null);
    const [note, setNote] = useState('');

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const confirmDeletion = (onConfirm: () => void, message: string) => {
        setConfirmAction({ action: onConfirm, message });
        setConfirmOpen(true);
    };
    
    const periodDeletionMessage = periodEntry 
        ? `Êtes-vous sûr de vouloir annuler la période de règles commencée le ${format(parseISO(periodEntry.startDate), 'd MMMM', { locale: fr })} ?`
        : "Êtes-vous sûr de vouloir annuler ce début de règles ?";

    return (
        <>
            {isConfirmOpen && confirmAction && (
                <ConfirmationModal
                    title="Confirmer la suppression"
                    message={confirmAction.message}
                    onConfirm={() => {
                        confirmAction.action();
                        setConfirmOpen(false);
                        onClose();
                    }}
                    onCancel={() => setConfirmOpen(false)}
                />
            )}
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-xl w-full max-w-xs p-6 relative animate-zoom-in">
                    <button onClick={onClose} className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-500/10">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                    <h3 className="text-lg font-semibold text-center mb-6 text-text-heading-light dark:text-text-heading-dark">
                        Actions pour le {format(selectedDate, 'd MMMM', { locale: fr })}
                    </h3>
                    <div className="space-y-3">
                        {activityLog ? (
                             <button 
                                onClick={() => confirmDeletion(() => removeActivityLog(activityLog), "Êtes-vous sûr de vouloir supprimer ce rapport sexuel ?")}
                                className="w-full bg-gray-500 text-white py-3 px-4 rounded-xl shadow hover:opacity-90 transition-opacity font-semibold">
                                Supprimer le rapport
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ajouter une note (optionnelle)..."
                                    className="w-full p-2 bg-primary-bg-light dark:bg-primary-bg-dark rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none resize-none h-20 text-text-body-light dark:text-text-body-dark"
                                />
                                <button 
                                    onClick={() => handleAction(() => addActivityLog(selectedDate, note))}
                                    className="w-full bg-accent-light dark:bg-accent-dark text-white py-3 px-4 rounded-xl shadow hover:bg-accent-hover-light dark:hover:bg-accent-hover-dark transition-colors font-semibold">
                                    Rapport sexuel
                                </button>
                            </div>
                        )}
                        {periodEntry ? (
                            <button 
                                onClick={() => confirmDeletion(() => removePeriodEntry(periodEntry.id), periodDeletionMessage)}
                                className="w-full bg-gray-500 text-white py-3 px-4 rounded-xl shadow hover:opacity-90 transition-opacity font-semibold">
                                Annuler début des règles
                            </button>
                        ) : (
                             <button 
                                onClick={() => handleAction(() => addPeriodEntry(selectedDate))}
                                className="w-full bg-period-light dark:bg-period-dark text-white py-3 px-4 rounded-xl shadow hover:opacity-90 transition-opacity font-semibold">
                                Début des règles
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const FutureCyclesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { settings, lastPeriod } = useAppContext();

    const futureCycles = useMemo(() => {
        if (!lastPeriod) return [];
        
        const cycles = [];
        let currentStartDate = parseISO(lastPeriod.startDate);

        // Calculate next 5 cycles
        // Start from the NEXT cycle, not the current one
        for (let i = 0; i < 5; i++) {
            // Predict start of next period
            currentStartDate = addDays(currentStartDate, settings.cycleLength);
            
            const periodEnd = addDays(currentStartDate, settings.periodLength - 1);
            
            // Ovulation is roughly 14 days before the *following* period
            const nextNextPeriodStart = addDays(currentStartDate, settings.cycleLength);
            const ovulationDate = subDays(nextNextPeriodStart, 14);
            
            cycles.push({
                startDate: currentStartDate,
                endDate: periodEnd,
                ovulationDate: ovulationDate
            });
        }
        return cycles;
    }, [lastPeriod, settings]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col relative animate-zoom-in">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-primary-bg-light dark:bg-primary-bg-dark rounded-t-2xl">
                    <h3 className="text-lg font-bold text-text-heading-light dark:text-text-heading-dark flex items-center">
                        <ArrowPathIcon className="w-5 h-5 mr-2 text-accent-light dark:text-accent-dark"/>
                        5 Prochains Cycles
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-500/10">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="overflow-y-auto p-4 space-y-4">
                    {futureCycles.length === 0 ? (
                        <p className="text-center text-text-muted-light dark:text-text-muted-dark py-8">
                            Veuillez entrer une date de règles pour voir les prévisions.
                        </p>
                    ) : (
                        futureCycles.map((cycle, index) => (
                            <div key={index} className="bg-primary-bg-light dark:bg-primary-bg-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                                <p className="text-sm font-semibold text-accent-light dark:text-accent-dark mb-2 uppercase tracking-wide">
                                    {format(cycle.startDate, 'MMMM yyyy', { locale: fr })}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-start">
                                        <DropIcon className="w-5 h-5 text-period-light dark:text-period-dark mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-text-heading-light dark:text-text-heading-dark">Règles prévues</p>
                                            <p className="text-xs text-text-body-light dark:text-text-body-dark">
                                                {format(cycle.startDate, 'd MMM', { locale: fr })} - {format(cycle.endDate, 'd MMM', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <SparklesIcon className="w-5 h-5 text-ovulation-light dark:text-ovulation-dark mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-text-heading-light dark:text-text-heading-dark">Ovulation estimée</p>
                                            <p className="text-xs text-text-body-light dark:text-text-body-dark">
                                                {format(cycle.ovulationDate, 'd MMMM', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const CalendarScreen: React.FC = () => {
    const { settings, periodHistory, activityHistory, lastPeriod } = useAppContext();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showForecast, setShowForecast] = useState(false);

    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const periodEntryForSelectedDate = useMemo(() => {
        if (!selectedDate) return undefined;
        // This logic correctly finds the period entry associated with the selected date,
        // allowing cancellation from any day within the period.
        return periodHistory.find(p => {
            const periodStart = parseISO(p.startDate);
            const periodEnd = addDays(periodStart, settings.periodLength - 1);
            return isWithinInterval(selectedDate, { start: periodStart, end: periodEnd });
        });
    }, [selectedDate, periodHistory, settings.periodLength]);

    const getDayType = (day: Date): DayType => {
        // 1. Vérifier si c'est un jour de règles enregistré (priorité absolue)
        for (const entry of periodHistory) {
            const periodStart = parseISO(entry.startDate);
            const periodEnd = addDays(periodStart, settings.periodLength - 1);
            if (isWithinInterval(day, { start: periodStart, end: periodEnd })) {
                return DayType.Period;
            }
        }

        if (periodHistory.length === 0) return DayType.Safe;

        // Trier l'historique du plus récent au plus ancien
        const sortedHistory = [...periodHistory].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        
        // Trouver la période de référence pour ce jour (la dernière période commencée avant ou ce jour-même)
        // Note: Cela permet de baser les calculs sur le dernier cycle connu valide à la date 'day'
        const anchorPeriod = sortedHistory.find(p => parseISO(p.startDate) <= day);

        if (!anchorPeriod) return DayType.Safe; // Jour avant toute donnée enregistrée

        const anchorDate = parseISO(anchorPeriod.startDate);
        
        // Vérifier si une période plus récente existe (pour fermer le cycle en mode rétrospectif)
        // sortedHistory est décroissant, donc l'index précédent (plus petit) est une date plus récente
        const anchorIndex = sortedHistory.findIndex(p => p.id === anchorPeriod.id);
        const nextPeriodEntry = anchorIndex > 0 ? sortedHistory[anchorIndex - 1] : null;

        let ovulationDate: Date;

        if (nextPeriodEntry) {
            // Cas rétrospectif : Le jour est entre deux périodes enregistrées.
            // On estime l'ovulation 14 jours avant le début des règles SUIVANTES (cycle fermé).
            const nextDate = parseISO(nextPeriodEntry.startDate);
            
            // Si le jour est après la période suivante (ce qui ne devrait pas arriver grâce au .find mais par sécurité)
            if (day >= nextDate) return DayType.Safe;

            ovulationDate = subDays(nextDate, 14);
        } else {
            // Cas prospectif : Le jour est après la dernière période connue.
            // On projette les cycles futurs de manière répétitive.
            const daysSinceAnchor = differenceInDays(day, anchorDate);
            
            // Calculer dans quel cycle (itération) se trouve ce jour
            const cycleIndex = Math.floor(daysSinceAnchor / settings.cycleLength);
            
            // Début théorique du cycle actuel
            const currentCycleStart = addDays(anchorDate, cycleIndex * settings.cycleLength);
            
            // Fin théorique du cycle actuel (début du suivant)
            const nextCycleStart = addDays(currentCycleStart, settings.cycleLength);
            
            // L'ovulation est estimée 14 jours avant la fin du cycle
            ovulationDate = subDays(nextCycleStart, 14);
        }

        // Vérification Ovulation
        if (isSameDay(day, ovulationDate)) return DayType.Ovulation;

        // Vérification Fenêtre Fertile (5 jours avant + jour J + 1 jour après)
        const fertileStart = subDays(ovulationDate, 5);
        const fertileEnd = addDays(ovulationDate, 1);
        
        if (isWithinInterval(day, { start: fertileStart, end: fertileEnd })) {
            return DayType.Fertile;
        }

        return DayType.Safe;
    };
    
    const dayStyles = (dayType: DayType, isCurrent: boolean) => {
        let styles = 'w-10 h-10 flex items-center justify-center rounded-full text-sm relative transition-all duration-200 transform hover:scale-110 ';
        if (isCurrent) styles += ' ring-2 ring-accent-light dark:ring-accent-dark ';
        
        switch (dayType) {
            case DayType.Period:
                styles += 'bg-period-light dark:bg-period-dark text-white font-semibold';
                break;
            case DayType.Fertile:
                styles += 'bg-fertile-light/30 dark:bg-fertile-dark/30 text-text-heading-light dark:text-text-heading-dark';
                break;
            case DayType.Ovulation:
                styles += 'bg-ovulation-light dark:bg-ovulation-dark text-white font-semibold';
                break;
            case DayType.Safe:
                 styles += 'bg-gray-100 dark:bg-card-bg-dark/50 hover:bg-gray-200 dark:hover:bg-gray-700';
                 break;
            default:
                 styles += 'text-text-body-light dark:text-text-body-dark hover:bg-gray-200 dark:hover:bg-gray-700';
        }
        return styles;
    };

    const firstDayOfMonth = getDay(startOfMonth(currentMonth)) - 1 < 0 ? 6 : getDay(startOfMonth(currentMonth)) - 1;

    const changeMonth = (amount: number) => {
        setCurrentMonth(addMonths(currentMonth, amount));
    };

    return (
        <div className="p-4">
            {showForecast && <FutureCyclesModal onClose={() => setShowForecast(false)} />}
            {selectedDate && (
                <DateActionModal 
                    selectedDate={selectedDate} 
                    onClose={() => setSelectedDate(null)}
                    periodEntry={periodEntryForSelectedDate}
                    activityLog={activityHistory.find(a => isSameDay(parseISO(a.date), selectedDate))}
                />
            )}
            
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-500/10 transition-transform active:scale-90">&lt;</button>
                <h2 className="text-xl font-bold capitalize text-text-heading-light dark:text-text-heading-dark transition-all" key={currentMonth.toString() + 'title'}>{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-500/10 transition-transform active:scale-90">&gt;</button>
            </div>
            
            {/* Animated Grid Container */}
            <div key={currentMonth.toString()} className="animate-fade-in">
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-muted-light dark:text-text-muted-dark font-semibold mb-2">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => <div key={i}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-2">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                    {daysInMonth.map(day => {
                        const dayType = getDayType(day);
                        const hasActivity = activityHistory.some(a => isSameDay(parseISO(a.date), day));
                        return (
                            <div key={day.toString()} className="flex items-center justify-center">
                                <button onClick={() => setSelectedDate(day)} className={dayStyles(dayType, isToday(day))}>
                                    {format(day, 'd')}
                                    {hasActivity && <HeartIcon className="w-3 h-3 absolute bottom-0.5 right-0.5 text-red-500" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 flex justify-center">
                 <button 
                    onClick={() => setShowForecast(true)}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-accent-light to-fertile-light dark:from-accent-dark dark:to-fertile-dark text-white rounded-full shadow-md hover:shadow-lg transform transition hover:scale-105 font-semibold text-sm">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Voir les 5 prochains cycles
                </button>
            </div>

            <div className="mt-8 p-4 bg-card-bg-light dark:bg-card-bg-dark rounded-xl space-y-3 text-sm animate-fade-in" style={{animationDelay: '100ms'}}>
                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-period-light dark:bg-period-dark mr-3"></div><span className="text-text-body-light dark:text-text-body-dark">Période de règles</span></div>
                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-fertile-light/50 dark:bg-fertile-dark/50 mr-3"></div><span className="text-text-body-light dark:text-text-body-dark">Période fertile</span></div>
                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-ovulation-light dark:bg-ovulation-dark mr-3"></div><span className="text-text-body-light dark:text-text-body-dark">Jour d'ovulation</span></div>
                <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-card-bg-dark/50 mr-3"></div><span className="text-text-body-light dark:text-text-body-dark">Jour non fertile</span></div>
            </div>
        </div>
    );
};

export default CalendarScreen;
