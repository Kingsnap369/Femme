
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import { CycleSettings, PeriodEntry } from '../types';
import { SunIcon, MoonIcon, XMarkIcon, UserCircleIcon, PlusIcon, ArrowRightOnRectangleIcon } from '../components/Icons';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmationModal } from '../components/ConfirmationModal';


const SettingsScreen: React.FC = () => {
    const { settings, setSettings, isPregnancyMode, togglePregnancyMode, theme, toggleTheme, periodHistory, removePeriodEntry, user, updateUser, deleteAccount, logout } = useAppContext();
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<PeriodEntry | null>(null);

    // Profile state
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhoto, setEditPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    
    // Account Deletion State
    const [isDeleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setPhotoPreview(user.photoURL || null);
        }
    }, [user]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setEditPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            await updateUser(editName, editPhoto);
            alert('Profil mis à jour !');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la mise à jour du profil.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

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
    
    const handleCustomReminderChange = (field: 'beforePeriod' | 'beforeOvulation', key: 'enabled' | 'days', value: any) => {
        setSettings({
            ...settings,
            notifications: {
                ...settings.notifications,
                custom: {
                    ...settings.notifications.custom,
                    [field]: {
                        ...settings.notifications.custom[field],
                        [key]: value,
                    }
                }
            }
        });
    };

    const handleDeleteRequest = (entry: PeriodEntry) => {
        setEntryToDelete(entry);
        setConfirmOpen(true);
    };
    
    const confirmDeletion = () => {
        if (entryToDelete) {
            removePeriodEntry(entryToDelete.id);
        }
        setConfirmOpen(false);
        setEntryToDelete(null);
    };
    
    const handleDeleteAccount = async () => {
        setIsDeletingAccount(true);
        try {
            await deleteAccount();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression du compte. Veuillez vous reconnecter et réessayer.");
        } finally {
            setIsDeletingAccount(false);
            setDeleteAccountModalOpen(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {isConfirmOpen && (
                <ConfirmationModal 
                    title="Confirmer la suppression"
                    message="Êtes-vous sûr de vouloir supprimer cette entrée de règles ?"
                    onConfirm={confirmDeletion}
                    onCancel={() => setConfirmOpen(false)}
                />
            )}
            
            {isDeleteAccountModalOpen && (
                 <ConfirmationModal 
                    title="Supprimer le compte"
                    message="Cette action est irréversible. Toutes vos données (historique, paramètres) seront définitivement effacées."
                    onConfirm={handleDeleteAccount}
                    onCancel={() => setDeleteAccountModalOpen(false)}
                />
            )}
            
            <h1 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark">Paramètres</h1>

            {/* Profile Section */}
            <div className="space-y-4 p-5 bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-md">
                <h2 className="font-semibold text-lg text-text-heading-light dark:text-text-heading-dark">Profil Utilisateur</h2>
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-white dark:bg-primary-bg-dark border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircleIcon className="w-12 h-12 text-text-muted-light dark:text-text-muted-dark" />
                            )}
                        </div>
                        <label htmlFor="photo-upload-settings" className="absolute bottom-0 right-0 w-8 h-8 bg-accent-light dark:bg-accent-dark rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform text-white">
                            <PlusIcon className="w-5 h-5" />
                        </label>
                        <input 
                            id="photo-upload-settings" 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoChange} 
                            className="hidden" 
                        />
                    </div>
                    
                    <div className="w-full">
                        <label className="text-sm text-text-body-light dark:text-text-body-dark block mb-1">Nom</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-3 bg-primary-bg-light dark:bg-primary-bg-dark rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition"
                        />
                    </div>
                    
                    <button 
                        onClick={handleUpdateProfile} 
                        disabled={isUpdatingProfile}
                        className="w-full py-2 bg-accent-light text-white font-semibold rounded-xl shadow hover:bg-accent-hover-light transition-colors dark:bg-accent-dark dark:hover:bg-accent-hover-dark disabled:opacity-50"
                    >
                        {isUpdatingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                    
                     <button onClick={logout} className="w-full flex items-center justify-center py-2 bg-gray-200 dark:bg-gray-700 text-text-heading-light dark:text-text-heading-dark font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                        Se déconnecter
                    </button>
                </div>
            </div>

            <div className="space-y-4 p-5 bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-md">
                <h2 className="font-semibold text-lg text-text-heading-light dark:text-text-heading-dark">Mon Cycle</h2>
                <div className="flex justify-between items-center">
                    <label htmlFor="cycleLength" className="text-text-body-light dark:text-text-body-dark">Durée du cycle (jours)</label>
                    <input
                        id="cycleLength"
                        type="number"
                        value={settings.cycleLength}
                        onChange={(e) => handleSettingsChange('cycleLength', parseInt(e.target.value))}
                        className="w-20 p-2 text-center bg-primary-bg-light dark:bg-primary-bg-dark rounded-md border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-accent-light"
                    />
                </div>
                 <div className="flex justify-between items-center">
                    <label htmlFor="periodLength" className="text-text-body-light dark:text-text-body-dark">Durée des règles (jours)</label>
                    <input
                        id="periodLength"
                        type="number"
                        value={settings.periodLength}
                        onChange={(e) => handleSettingsChange('periodLength', parseInt(e.target.value))}
                        className="w-20 p-2 text-center bg-primary-bg-light dark:bg-primary-bg-dark rounded-md border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-accent-light"
                    />
                </div>
            </div>

            <div className="space-y-4 p-5 bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-md">
                <h2 className="font-semibold text-lg text-text-heading-light dark:text-text-heading-dark">Historique des règles</h2>
                {periodHistory.length > 0 ? (
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {[...periodHistory].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(entry => (
                            <li key={entry.id} className="flex justify-between items-center bg-primary-bg-light dark:bg-primary-bg-dark p-3 rounded-lg">
                                <span className="text-sm font-medium">{format(parseISO(entry.startDate), 'd MMMM yyyy', { locale: fr })}</span>
                                <button onClick={() => handleDeleteRequest(entry)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-center text-text-muted-light dark:text-text-muted-dark py-4">Aucun historique.</p>
                )}
            </div>

            <div className="space-y-4 p-5 bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-md">
                 <h2 className="font-semibold text-lg text-text-heading-light dark:text-text-heading-dark">Général</h2>
                <div className="flex justify-between items-center">
                    <span className="text-text-body-light dark:text-text-body-dark">Mode Grossesse</span>
                    <button onClick={togglePregnancyMode} className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${isPregnancyMode ? 'bg-accent-light dark:bg-accent-dark' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isPregnancyMode ? 'translate-x-7' : ''}`} />
                    </button>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-text-body-light dark:text-text-body-dark">Thème Sombre</span>
                    <button onClick={toggleTheme} className={`w-14 h-7 rounded-full p-1 flex items-center transition-colors duration-300 ${theme === 'dark' ? 'bg-accent-dark' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : ''}`}>
                            {theme === 'dark' ? <MoonIcon className="h-3 w-3 text-gray-800" /> : <SunIcon className="h-3 w-3 text-gray-800" />}
                        </div>
                    </button>
                </div>
            </div>

            <div className="space-y-4 p-5 bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-md">
                 <h2 className="font-semibold text-lg text-text-heading-light dark:text-text-heading-dark">Notifications</h2>
                 <div className="flex justify-between items-center">
                    <span className="text-text-body-light dark:text-text-body-dark">Arrivée des règles</span>
                    <button onClick={() => handleNotificationChange('period', !settings.notifications.period)} className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${settings.notifications.period ? 'bg-accent-light dark:bg-accent-dark' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifications.period ? 'translate-x-7' : ''}`} />
                    </button>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-text-body-light dark:text-text-body-dark">Période d'ovulation</span>
                     <button onClick={() => handleNotificationChange('ovulation', !settings.notifications.ovulation)} className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${settings.notifications.ovulation ? 'bg-accent-light dark:bg-accent-dark' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifications.ovulation ? 'translate-x-7' : ''}`} />
                    </button>
                </div>
                
                <div className="pt-4 border-t border-gray-200/80 dark:border-gray-500/20">
                    <h3 className="font-semibold text-md mt-2 text-text-heading-light dark:text-text-heading-dark">Rappels Personnalisés</h3>
                    
                    <div className="mt-4">
                        <div className="flex justify-between items-center">
                           <span className="text-text-body-light dark:text-text-body-dark">Rappel avant les règles</span>
                           <button onClick={() => handleCustomReminderChange('beforePeriod', 'enabled', !settings.notifications.custom.beforePeriod.enabled)} className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${settings.notifications.custom.beforePeriod.enabled ? 'bg-accent-light dark:bg-accent-dark' : 'bg-gray-300 dark:bg-gray-600'}`}>
                               <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifications.custom.beforePeriod.enabled ? 'translate-x-7' : ''}`} />
                           </button>
                        </div>
                        {settings.notifications.custom.beforePeriod.enabled && (
                             <div className="flex justify-between items-center mt-3 pl-4">
                                <label htmlFor="beforePeriodDays" className="text-sm text-text-muted-light dark:text-text-muted-dark">Jours avant</label>
                                <input id="beforePeriodDays" type="number" value={settings.notifications.custom.beforePeriod.days}
                                    onChange={(e) => handleCustomReminderChange('beforePeriod', 'days', parseInt(e.target.value))}
                                    className="w-20 p-1 text-sm text-center bg-primary-bg-light dark:bg-primary-bg-dark rounded-md border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-accent-light"/>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between items-center">
                           <span className="text-text-body-light dark:text-text-body-dark">Rappel avant l'ovulation</span>
                           <button onClick={() => handleCustomReminderChange('beforeOvulation', 'enabled', !settings.notifications.custom.beforeOvulation.enabled)} className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${settings.notifications.custom.beforeOvulation.enabled ? 'bg-accent-light dark:bg-accent-dark' : 'bg-gray-300 dark:bg-gray-600'}`}>
                               <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifications.custom.beforeOvulation.enabled ? 'translate-x-7' : ''}`} />
                           </button>
                        </div>
                        {settings.notifications.custom.beforeOvulation.enabled && (
                             <div className="flex justify-between items-center mt-3 pl-4">
                                <label htmlFor="beforeOvulationDays" className="text-sm text-text-muted-light dark:text-text-muted-dark">Jours avant</label>
                                <input id="beforeOvulationDays" type="number" value={settings.notifications.custom.beforeOvulation.days}
                                    onChange={(e) => handleCustomReminderChange('beforeOvulation', 'days', parseInt(e.target.value))}
                                    className="w-20 p-1 text-sm text-center bg-primary-bg-light dark:bg-primary-bg-dark rounded-md border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-accent-light"/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Danger Zone */}
            <div className="space-y-4 p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl shadow-md">
                <h2 className="font-semibold text-lg text-red-600 dark:text-red-400">Zone de danger</h2>
                <div className="flex flex-col space-y-2">
                    <p className="text-sm text-text-body-light dark:text-text-body-dark">
                        La suppression de votre compte est irréversible. Toutes vos données seront perdues.
                    </p>
                    <button 
                        onClick={() => setDeleteAccountModalOpen(true)} 
                        disabled={isDeletingAccount}
                        className="w-full py-2 bg-red-500 text-white font-semibold rounded-xl shadow hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {isDeletingAccount ? 'Suppression...' : 'Supprimer mon compte'}
                    </button>
                </div>
            </div>

        </div>
    );
};

export default SettingsScreen;