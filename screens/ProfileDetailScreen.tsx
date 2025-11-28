
import React, { useMemo } from 'react';
import { useAppContext } from '../App';
import { DayType } from '../types';
import { format, parseISO, addDays, subDays, isSameDay, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HeartIcon, ShieldCheckIcon, SparklesIcon } from '../components/Icons';

const getPhaseForDate = (date: Date, periodHistory: any[], settings: any): DayType => {
    // Find the last period entry that started on or before the given date
    const anchorPeriod = [...periodHistory]
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .find(p => parseISO(p.startDate) <= date);

    if (!anchorPeriod) {
        return DayType.Safe; // Not enough data
    }

    const cycleStartDate = parseISO(anchorPeriod.startDate);
    
    // Check if it's a period day
    const periodEnd = addDays(cycleStartDate, settings.periodLength - 1);
    if (isWithinInterval(date, { start: cycleStartDate, end: periodEnd })) {
        return DayType.Period;
    }

    // Calculate ovulation and fertile window for that specific cycle
    const nextPeriodDate = addDays(cycleStartDate, settings.cycleLength);
    const ovulationDate = subDays(nextPeriodDate, 14);

    if (isSameDay(date, ovulationDate)) {
        return DayType.Ovulation;
    }
    
    const fertileWindowStart = subDays(ovulationDate, 5);
    const fertileWindowEnd = addDays(ovulationDate, 1);
    if (isWithinInterval(date, { start: fertileWindowStart, end: fertileWindowEnd })) {
        return DayType.Fertile;
    }

    return DayType.Safe;
};


const ProfileDetailScreen: React.FC = () => {
    const { activityHistory, periodHistory, settings } = useAppContext();

    const sortedActivities = useMemo(() => {
        return [...activityHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activityHistory]);

    const getRiskInfo = (dayType: DayType) => {
        switch (dayType) {
            case DayType.Ovulation:
                return { text: "Risque de grossesse : Très élevé", color: "text-red-500", icon: <SparklesIcon className="w-5 h-5 mr-2 text-red-500" /> };
            case DayType.Fertile:
                return { text: "Risque de grossesse : Élevé", color: "text-orange-500", icon: <SparklesIcon className="w-5 h-5 mr-2 text-orange-500" /> };
            case DayType.Period:
                return { text: "Risque de grossesse : Très faible", color: "text-blue-500", icon: <ShieldCheckIcon className="w-5 h-5 mr-2 text-blue-500" /> };
            case DayType.Safe:
            default:
                return { text: "Risque de grossesse : Faible", color: "text-green-500", icon: <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-500" /> };
        }
    };


    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">Journal d'activité</h1>
            
            {sortedActivities.length === 0 ? (
                <div className="text-center py-10">
                    <HeartIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="mt-4 text-text-secondary">Aucune activité enregistrée.</p>
                    <p className="text-sm text-gray-400">Ajoutez des rapports depuis le calendrier.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {sortedActivities.map(activity => {
                        const activityDate = parseISO(activity.date);
                        const dayType = getPhaseForDate(activityDate, periodHistory, settings);
                        const riskInfo = getRiskInfo(dayType);

                        return (
                            <li key={activity.date} className="bg-secondary-light dark:bg-secondary-dark p-4 rounded-lg shadow bg-card-bg-light dark:bg-card-bg-dark">
                               <div className="flex justify-between items-center">
                                    <span className="font-semibold capitalize text-text-heading-light dark:text-text-heading-dark">
                                        {format(activityDate, 'eeee d MMMM yyyy', { locale: fr })}
                                    </span>
                                    <div className="w-6 h-6 flex items-center justify-center bg-red-100 dark:bg-red-900/50 rounded-full">
                                        <HeartIcon className="w-4 h-4 text-red-500" />
                                    </div>
                               </div>
                                <div className={`flex items-center text-sm mt-2 ${riskInfo.color}`}>
                                    {riskInfo.icon}
                                    <span>{riskInfo.text}</span>
                                </div>
                                {activity.note && (
                                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <p className="text-sm italic text-text-body-light dark:text-text-body-dark">
                                            "{activity.note}"
                                        </p>
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    );
};

export default ProfileDetailScreen;
