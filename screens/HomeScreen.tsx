
import React from 'react';
import { useAppContext } from '../App';
import { differenceInDays, format, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DropIcon } from '../components/Icons';

const HomeScreen: React.FC = () => {
  const { isPregnancyMode, lastPeriod, nextPeriodDate, ovulationDate, settings } = useAppContext();

  if (isPregnancyMode) {
    return (
      <div className="p-6 text-center text-gray-700 dark:text-gray-300">
        <h1 className="text-2xl font-bold mb-4 text-accent-light dark:text-accent-dark">Mode Grossesse Activé</h1>
        <p className="text-lg">Félicitations ! Nous mettons le suivi de cycle en pause pour vous.</p>
        <div className="mt-8 p-6 bg-white dark:bg-secondary-dark rounded-xl shadow-md">
            <p className="text-xl font-semibold">Bientôt parent !</p>
            <p className="mt-2">Suivez le développement de votre bébé semaine par semaine (fonctionnalité à venir).</p>
        </div>
      </div>
    );
  }

  if (!lastPeriod || !nextPeriodDate || !ovulationDate) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-accent-light dark:text-accent-dark">Bienvenue !</h1>
        <p className="mt-4 text-lg">Veuillez ajouter la date de vos dernières règles dans les paramètres pour commencer.</p>
      </div>
    );
  }

  const daysUntilNextPeriod = differenceInDays(nextPeriodDate, new Date());
  const progress = ((settings.cycleLength - daysUntilNextPeriod) / settings.cycleLength) * 100;

  const renderCountdown = () => {
    if(daysUntilNextPeriod < 0) return <p className="text-lg">Vos règles sont en retard.</p>;
    if(daysUntilNextPeriod === 0) return <p className="text-lg">Vos règles devraient commencer aujourd'hui.</p>;
    return (
      <>
        <span className="text-5xl font-bold text-accent-light dark:text-accent-dark">{daysUntilNextPeriod}</span>
        <span className="text-xl ml-2">jour{daysUntilNextPeriod > 1 ? 's' : ''}</span>
      </>
    );
  };
  
  return (
    <div className="p-4 sm:p-6 space-y-6 text-center">
        <h1 className="text-xl font-semibold text-gray-600 dark:text-gray-300">Mon Cycle</h1>

        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-secondary-light dark:text-secondary-dark" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                className="text-accent-light dark:text-accent-dark"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={(2 * Math.PI * 45) * (1 - progress / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
                transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                {renderCountdown()}
                <p className="text-sm text-gray-500 dark:text-gray-400">avant les règles</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-white dark:bg-secondary-dark rounded-xl shadow-md">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-fertile-light dark:bg-fertile-dark rounded-full">
                        <DropIcon className="w-5 h-5 text-accent-light dark:text-accent-dark"/>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">Prochaines règles</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{format(nextPeriodDate, 'eeee dd MMMM', { locale: fr })}</p>
                    </div>
                </div>
            </div>
             <div className="p-4 bg-white dark:bg-secondary-dark rounded-xl shadow-md">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-fertile-light dark:bg-fertile-dark rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-light dark:text-accent-dark" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">Ovulation estimée</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{format(ovulationDate, 'eeee dd MMMM', { locale: fr })}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-4 bg-white dark:bg-secondary-dark rounded-xl shadow-md">
            <h3 className="font-semibold mb-2 text-left">Conseil du jour</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                Tu es actuellement dans ta phase post-ovulatoire. L'énergie peut commencer à baisser, c'est normal. Pense à bien t'hydrater et à te reposer.
            </p>
        </div>
    </div>
  );
};

export default HomeScreen;
