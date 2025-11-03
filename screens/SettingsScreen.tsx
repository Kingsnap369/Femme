
import React from 'react';
import { useAppContext } from '../App';
import { CycleSettings } from '../types';
import { SunIcon, MoonIcon } from '../components/Icons';

const SettingsScreen: React.FC = () => {
    const { settings, setSettings, isPregnancyMode, togglePregnancyMode, theme, toggleTheme } = useAppContext();

    const handleSettingsChange = (field: keyof CycleSettings, value: any) => {
        setSettings({
            ...settings,
            [field]: value,
        });
    };

    const handleNotificationChange = (field: 'period' | 'ovulation', value: boolean) => {
        setSettings({
            ...settings,
            notifications: {
                ...settings.notifications,
                [field]: value,
            },
        });
    };

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">Paramètres</h1>

            <div className="space-y-4 p-4 bg-white dark:bg-secondary-dark rounded-lg shadow">
                <h2 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-600 pb-2">Mon Cycle</h2>
                <div className="flex justify-between items-center">
                    <label htmlFor="cycleLength" className="text-gray-600 dark:text-gray-300">Durée du cycle (jours)</label>
                    <input
                        id="cycleLength"
                        type="number"
                        value={settings.cycleLength}
                        onChange={(e) => handleSettingsChange('cycleLength', parseInt(e.target.value))}
                        className="w-20 p-2 text-center bg-gray-100 dark:bg-gray-700 rounded-md"
                    />
                </div>
                 <div className="flex justify-between items-center">
                    <label htmlFor="periodLength" className="text-gray-600 dark:text-gray-300">Durée des règles (jours)</label>
                    <input
                        id="periodLength"
                        type="number"
                        value={settings.periodLength}
                        onChange={(e) => handleSettingsChange('periodLength', parseInt(e.target.value))}
                        className="w-20 p-2 text-center bg-gray-100 dark:bg-gray-700 rounded-md"
                    />
                </div>
            </div>

            <div className="space-y-4 p-4 bg-white dark:bg-secondary-dark rounded-lg shadow">
                 <h2 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-600 pb-2">Général</h2>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Mode Grossesse</span>
                    <button onClick={togglePregnancyMode} className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${isPregnancyMode ? 'bg-accent-light' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isPregnancyMode ? 'translate-x-7' : ''}`} />
                    </button>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Thème Sombre</span>
                    <button onClick={toggleTheme} className={`w-14 h-7 rounded-full p-1 flex items-center transition-colors duration-300 ${theme === 'dark' ? 'bg-accent-dark' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : ''}`}>
                            {theme === 'dark' ? <MoonIcon className="h-3 w-3 text-gray-800" /> : <SunIcon className="h-3 w-3 text-gray-800" />}
                        </div>
                    </button>
                </div>
            </div>

            <div className="space-y-4 p-4 bg-white dark:bg-secondary-dark rounded-lg shadow">
                 <h2 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-600 pb-2">Notifications</h2>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Arrivée des règles</span>
                    <button onClick={() => handleNotificationChange('period', !settings.notifications.period)} className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${settings.notifications.period ? 'bg-accent-light' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifications.period ? 'translate-x-7' : ''}`} />
                    </button>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Période d'ovulation</span>
                     <button onClick={() => handleNotificationChange('ovulation', !settings.notifications.ovulation)} className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${settings.notifications.ovulation ? 'bg-accent-light' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifications.ovulation ? 'translate-x-7' : ''}`} />
                    </button>
                </div>
            </div>

        </div>
    );
};

export default SettingsScreen;
