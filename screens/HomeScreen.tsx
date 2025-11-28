
import React, { useMemo } from 'react';
import { useAppContext } from '../App';
import { differenceInDays, format, parseISO, isWithinInterval, isSameDay, startOfDay, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PlusIcon, ReportsIcon, CalendarIcon, DropIcon, ClockIcon, ShieldCheckIcon, LightBulbIcon } from '../components/Icons';
import { Link } from 'react-router-dom';
import { getPersonalizedAdvice, CyclePhase } from '../utils/advice';

const HomeScreen: React.FC = () => {
  const { isPregnancyMode, lastPeriod, nextPeriodDate, nextPeriodWindow, ovulationDate, settings, fertileWindow, predictionAccuracy, symptomHistory, currentPeriodInfo } = useAppContext();

  const today = new Date();
  
  const { phase, day, currentPhaseName, dayInPhase } = useMemo(() => {
    if (!lastPeriod || !nextPeriodDate || !ovulationDate || !fertileWindow) {
      return { phase: 'Inconnue', day: '', currentPhaseName: CyclePhase.Unknown, dayInPhase: 0 };
    }

    // Normalize dates to start of day for accurate comparison to avoid time-of-day discrepancies
    const todayNormalized = startOfDay(new Date());
    const lastPeriodStart = startOfDay(parseISO(lastPeriod.startDate));
    const ovulationDay = startOfDay(ovulationDate);
    
    // Cycle Day 1 is the start of the period
    const dayOfCycle = differenceInDays(todayNormalized, lastPeriodStart) + 1;

    // Edge Case: Future dates or bad data
    if (dayOfCycle < 1) {
         return { phase: 'En attente', day: '-', currentPhaseName: CyclePhase.Unknown, dayInPhase: 0 };
    }

    // 1. Menstrual Phase: Day 1 to End of Period
    if (dayOfCycle <= settings.periodLength) {
      return { 
          phase: 'Règles', 
          day: `Jour ${dayOfCycle}`, 
          currentPhaseName: CyclePhase.Menstrual, 
          dayInPhase: dayOfCycle 
      };
    }
    
    // 2. Ovulation Phase: Day of Ovulation
    if (isSameDay(todayNormalized, ovulationDay)) {
        return { 
            phase: 'Ovulation', 
            day: `Jour d'ovulation`, 
            currentPhaseName: CyclePhase.Ovulation, 
            dayInPhase: 1 
        };
    }
    
    // 3. Follicular Phase: After Period, Before Ovulation
    if (isBefore(todayNormalized, ovulationDay)) {
        return { 
            phase: 'Phase Folliculaire', 
            day: `Jour ${dayOfCycle}`, 
            currentPhaseName: CyclePhase.Follicular, 
            dayInPhase: dayOfCycle // Users typically track "Cycle Day" here
        };
    }
    
    // 4. Luteal Phase: After Ovulation
    if (isAfter(todayNormalized, ovulationDay)) {
        const dpo = differenceInDays(todayNormalized, ovulationDay);
        return { 
            phase: 'Phase Lutéale', 
            day: `DPO ${dpo}`, 
            currentPhaseName: CyclePhase.Luteal, 
            dayInPhase: dpo 
        };
    }

    // Default fallback
    return { 
        phase: 'Phase Folliculaire', 
        day: `Jour ${dayOfCycle}`, 
        currentPhaseName: CyclePhase.Follicular, 
        dayInPhase: dayOfCycle 
    };
  }, [lastPeriod, nextPeriodDate, ovulationDate, fertileWindow, settings.periodLength, today]);

  const todaySymptom = useMemo(() => {
      return symptomHistory.find(log => isSameDay(parseISO(log.date), today));
  }, [symptomHistory, today]);

  const advice = useMemo(() => getPersonalizedAdvice(currentPhaseName, todaySymptom), [currentPhaseName, todaySymptom]);


  if (isPregnancyMode) {
    return (
      <div className="p-6 text-center text-text-heading-light dark:text-text-heading-dark">
        <h1 className="text-2xl font-bold mb-4 text-accent-light dark:text-accent-dark">Mode Grossesse Activé</h1>
        <p className="text-lg text-text-body-light dark:text-text-body-dark">Félicitations ! Nous mettons le suivi de cycle en pause pour vous.</p>
        <div className="mt-8 p-6 bg-card-bg-light dark:bg-card-bg-dark rounded-xl shadow-md">
            <p className="text-xl font-semibold">Bientôt parent !</p>
            <p className="mt-2 text-text-body-light dark:text-text-body-dark">Suivez le développement de votre bébé semaine par semaine (fonctionnalité à venir).</p>
        </div>
      </div>
    );
  }

  if (!lastPeriod || !nextPeriodDate || !ovulationDate || !fertileWindow || !nextPeriodWindow) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-accent-light dark:text-accent-dark">Bienvenue !</h1>
        <p className="mt-4 text-lg text-text-body-light dark:text-text-body-dark">Veuillez ajouter la date de vos dernières règles dans les paramètres pour commencer.</p>
      </div>
    );
  }

  const daysToNextPeriod = nextPeriodDate ? differenceInDays(nextPeriodDate, today) : 0;
  const daysToOvulation = ovulationDate ? differenceInDays(ovulationDate, today) : 0;

  return (
    <div className="p-4 space-y-6">
        <div className="bg-gradient-to-br from-accent-light to-fertile-light dark:from-accent-dark dark:to-fertile-dark text-white rounded-3xl shadow-lg p-6 text-center animate-fade-in">
            <p className="font-semibold text-white/90">{phase}</p>
            <p className="text-5xl font-bold my-2">{day}</p>
            <p className="text-white/90 capitalize">{format(today, 'eeee d MMMM', { locale: fr })}</p>
        </div>

        {/* Phase Tracker */}
        <div className="grid grid-cols-4 gap-2 animate-fade-in" style={{animationDelay: '50ms'}}>
             {[
                 { id: CyclePhase.Menstrual, label: 'Règles', color: 'bg-period-light dark:bg-period-dark' },
                 { id: CyclePhase.Follicular, label: 'Follic.', color: 'bg-blue-300 dark:bg-blue-600' },
                 { id: CyclePhase.Ovulation, label: 'Ovulation', color: 'bg-ovulation-light dark:bg-ovulation-dark' },
                 { id: CyclePhase.Luteal, label: 'Lutéale', color: 'bg-purple-300 dark:bg-purple-600' }
             ].map(p => {
                 const isActive = currentPhaseName === p.id;
                 return (
                     <div key={p.id} className={`relative flex flex-col items-center p-2 rounded-xl transition-all duration-300 border border-transparent ${isActive ? 'bg-card-bg-light dark:bg-card-bg-dark shadow-md border-accent-light/30 dark:border-accent-dark/30 scale-105 z-10 ring-1 ring-accent-light dark:ring-accent-dark' : 'opacity-60 grayscale'}`}>
                         <div className={`w-3 h-3 rounded-full mb-2 ${p.color} ${isActive ? 'animate-pulse' : ''}`}></div>
                         <span className="text-[10px] font-bold text-text-heading-light dark:text-text-heading-dark uppercase">{p.label}</span>
                         {isActive && <span className="text-xs font-bold text-accent-light dark:text-accent-dark mt-1 whitespace-nowrap">
                            {p.id === CyclePhase.Luteal ? `DPO ${dayInPhase}` : `J ${dayInPhase}`}
                         </span>}
                     </div>
                 );
             })}
        </div>
        
        <div className="p-5 bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-md flex items-center space-x-4 animate-fade-in" style={{animationDelay: '100ms'}}>
            <ShieldCheckIcon className="w-9 h-9 text-green-500" />
            <div>
                <p className="font-semibold text-text-heading-light dark:text-text-heading-dark">Précision des prédictions</p>
                <p className="text-sm text-green-500 font-bold">{predictionAccuracy}%</p>
            </div>
        </div>
        
        <div className="p-5 bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-md animate-fade-in" style={{animationDelay: '200ms'}}>
            <div className="flex items-center mb-4">
                <LightBulbIcon className="w-6 h-6 text-yellow-500 mr-3" />
                <h3 className="font-semibold text-lg text-text-heading-light dark:text-text-heading-dark">Conseils du Jour</h3>
            </div>
            <div className="space-y-3 text-sm text-text-body-light dark:text-text-body-dark">
                <p><span className="font-semibold text-accent-light dark:text-accent-dark">Nutrition :</span> {advice.nutrition}</p>
                <p><span className="font-semibold text-accent-light dark:text-accent-dark">Bien-être :</span> {advice.wellness}</p>
            </div>
        </div>

        <div className="p-5 bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-md space-y-5 animate-fade-in" style={{animationDelay: '300ms'}}>
            <h3 className="font-semibold text-lg text-text-heading-light dark:text-text-heading-dark">Prochains évènements</h3>
            {currentPeriodInfo ? (
                 <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-11 h-11 flex items-center justify-center bg-pink-100 dark:bg-period-dark/20 rounded-full mr-4">
                            <DropIcon className="w-6 h-6 text-period-light dark:text-period-dark" />
                        </div>
                        <div>
                            <p className="font-semibold text-base">Fin des règles</p>
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{format(currentPeriodInfo.end, 'eeee d MMMM', { locale: fr })}</p>
                        </div>
                    </div>
                    <p className="font-bold text-xl text-text-heading-light dark:text-text-heading-dark">
                        {(() => {
                            const daysToEnd = differenceInDays(currentPeriodInfo.end, today);
                            if (daysToEnd < 0) return 'Terminé';
                            if (daysToEnd === 0) return 'Aujourd\'hui';
                            return `dans ${daysToEnd} j`;
                        })()}
                    </p>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-11 h-11 flex items-center justify-center bg-pink-100 dark:bg-period-dark/20 rounded-full mr-4">
                            <DropIcon className="w-6 h-6 text-period-light dark:text-period-dark" />
                        </div>
                        <div>
                            <p className="font-semibold text-base">Prochaines règles</p>
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                Du {format(nextPeriodWindow.start, 'd')} au {format(nextPeriodWindow.end, 'd MMMM yyyy', { locale: fr })}
                            </p>
                        </div>
                    </div>
                    <p className="font-bold text-xl text-text-heading-light dark:text-text-heading-dark">
                        {daysToNextPeriod > 0 ? `dans ${daysToNextPeriod} j` : 'Aujourd\'hui'}
                    </p>
                </div>
            )}
             <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-11 h-11 flex items-center justify-center bg-purple-100 dark:bg-accent-dark/20 rounded-full mr-4">
                         <ClockIcon className="w-6 h-6 text-accent-light dark:text-accent-dark" />
                    </div>
                    <div>
                        <p className="font-semibold text-base">Prochaine ovulation</p>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{format(ovulationDate, 'eeee d MMMM', { locale: fr })}</p>
                    </div>
                </div>
                <p className="font-bold text-xl text-text-heading-light dark:text-text-heading-dark">
                     {daysToOvulation > 0 ? `dans ${daysToOvulation} j` : 'Aujourd\'hui'}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 animate-zoom-in" style={{animationDelay: '400ms'}}>
            <Link to="/reports" className="relative p-4 h-36 flex flex-col justify-between bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900/40 dark:to-pink-900/40 rounded-2xl shadow-md text-text-heading-light dark:text-text-heading-dark overflow-hidden transition-transform hover:scale-105">
                <div>
                    <h3 className="font-bold text-lg">Rapports</h3>
                    <p className="text-xs mt-1">Ajouter vos symptômes</p>
                </div>
                <ReportsIcon className="absolute w-20 h-20 -right-5 -bottom-5 text-black/10 dark:text-white/10" />
                 <div className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/50 dark:bg-black/20 rounded-full">
                    <PlusIcon className="w-5 h-5"/>
                </div>
            </Link>
            <Link to="/calendar" className="relative p-4 h-36 flex flex-col justify-between bg-gradient-to-br from-green-200 to-blue-200 dark:from-green-900/40 dark:to-blue-900/40 rounded-2xl shadow-md text-text-heading-light dark:text-text-heading-dark overflow-hidden transition-transform hover:scale-105">
                <div>
                    <h3 className="font-bold text-lg">Calendrier</h3>
                    <p className="text-xs mt-1">Voir le cycle complet</p>
                </div>
                <CalendarIcon className="absolute w-20 h-20 -right-5 -bottom-5 text-black/10 dark:text-white/10" />
                 <div className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/50 dark:bg-black/20 rounded-full">
                    <PlusIcon className="w-5 h-5"/>
                </div>
            </Link>
        </div>
    </div>
  );
};

export default HomeScreen;
