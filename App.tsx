
import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase'; // Import auth to check config
import * as api from './firebaseApi'; // Import the new API service
import { addDays, subDays, parseISO, isSameDay, isWithinInterval, differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import SymptomsScreen from './screens/SymptomsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileDetailScreen from './screens/ProfileDetailScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import AssistantScreen from './screens/AssistantScreen';
import { HomeIcon, CalendarIcon, ReportsIcon, SettingsIcon, BellIcon, UserCircleIcon, XMarkIcon, ChatBubbleLeftRightIcon, ArrowRightOnRectangleIcon, BellAlertIcon } from './components/Icons';
import { AppLogo } from './components/Logo';
import { CycleSettings, PeriodEntry, SymptomLog, ActivityLog, User, Notification, AppNotification, AppContextType } from './types';

// App Context (Type imported)

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

const DemoBanner: React.FC = () => (
    <div className="bg-orange-500 text-white text-xs font-bold text-center py-1 px-4 animate-fade-in">
        Mode Démo / Hors ligne (Données sauvegardées localement)
    </div>
);

// Main App Component
const App: React.FC = () => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if we are in mock mode to show the banner (but don't block the app)
    const isMockMode = !auth.app.options.apiKey || auth.app.options.apiKey === "VOTRE_API_KEY_ICI" || auth.app.options.apiKey.includes("VOTRE_");

    useEffect(() => {
        // Use the onAuthChange function from the API service
        const unsubscribe = api.onAuthChange((fbUser, userData) => {
            setFirebaseUser(fbUser);
            setUser(userData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-primary-bg-light dark:bg-primary-bg-dark"><AppLogo className="w-24 h-24 animate-pulse" /></div>;
    }

    return (
        <HashRouter>
            {firebaseUser ? (
                <LoggedInApp user={user} setUser={setUser} firebaseUser={firebaseUser} logout={api.apiLogout} isMockMode={isMockMode} />
            ) : (
                <AuthRoutes login={api.apiLogin} signup={api.apiSignup} isMockMode={isMockMode} />
            )}
        </HashRouter>
    );
};

const AuthRoutes: React.FC<{ login: AppContextType['login']; signup: AppContextType['signup']; isMockMode: boolean }> = ({ login, signup, isMockMode }) => {
    const authContextValue = { login, signup } as any; 
    return (
        <AppContext.Provider value={authContextValue}>
            <div className="flex flex-col h-full">
                {isMockMode && <DemoBanner />}
                <Routes>
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/signup" element={<SignupScreen />} />
                    <Route path="/verify-email" element={<EmailVerificationScreen />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </div>
        </AppContext.Provider>
    );
};

const LoggedInApp: React.FC<{ user: User | null; setUser: (u: User | null) => void; firebaseUser: FirebaseUser; logout: () => void; isMockMode: boolean }> = ({ user, setUser, firebaseUser, logout, isMockMode }) => {
    const defaultSettings: CycleSettings = { 
        cycleLength: 28, periodLength: 5, 
        notifications: { period: true, ovulation: true, custom: { beforePeriod: { enabled: false, days: 2 }, beforeOvulation: { enabled: false, days: 1 } } } 
    };

    const [settings, setSettings] = useState<CycleSettings>(defaultSettings);
    const [periodHistory, setPeriodHistory] = useState<PeriodEntry[]>([]);
    const [symptomHistory, setSymptomHistory] = useState<SymptomLog[]>([]);
    const [activityHistory, setActivityHistory] = useState<ActivityLog[]>([]);
    const [isPregnancyMode, setPregnancyMode] = useState<boolean>(false);
    const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);
    const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
    
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        return (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light';
    });

    // Firestore data listeners using the new API service
    useEffect(() => {
        const unsubSettings = api.subscribeToSettings(firebaseUser.uid, (data, pregnancyMode) => {
            if (data) setSettings(data);
            setPregnancyMode(pregnancyMode);
        });
        const unsubPeriod = api.subscribeToPeriodHistory(firebaseUser.uid, setPeriodHistory);
        const unsubSymptoms = api.subscribeToSymptomHistory(firebaseUser.uid, setSymptomHistory);
        const unsubActivity = api.subscribeToActivityHistory(firebaseUser.uid, setActivityHistory);
        const unsubNotifications = api.subscribeToAppNotifications(firebaseUser.uid, setAppNotifications);

        return () => {
            unsubSettings();
            unsubPeriod();
            unsubSymptoms();
            unsubActivity();
            unsubNotifications();
        };
    }, [firebaseUser.uid]);

    // Simplified data manipulation functions
    const updateSettings = (newSettings: CycleSettings) => {
        api.saveSettings(firebaseUser.uid, newSettings, isPregnancyMode);
    };

    const markNotificationsAsRead = () => {
        api.markNotificationsAsRead(firebaseUser.uid, appNotifications);
    }

    const removeToastNotification = (id: string) => setToastNotifications(prev => prev.filter(n => n.id !== id));
    
    const addToastNotification = (notification: Omit<Notification, 'id'>) => {
        const id = new Date().toISOString() + Math.random();
        setToastNotifications(prev => [...prev, { id, ...notification }]);
        setTimeout(() => removeToastNotification(id), 5000); 
    };
    
    const removePeriodEntry = (id: string) => {
        api.removePeriodEntry(firebaseUser.uid, id);
    };
    
    const updatePeriodEntry = (id: string, endDate: Date) => {
        api.updatePeriodEntry(firebaseUser.uid, id, endDate);
        addToastNotification({ message: "Fin des règles enregistrée." });
    }

    const addPeriodEntry = async (date: Date) => {
        const isDateInExistingPeriod = periodHistory.some(p => {
            const periodStart = parseISO(p.startDate);
            const periodEnd = addDays(periodStart, settings.periodLength - 1);
            return isWithinInterval(date, { start: periodStart, end: periodEnd });
        });
        if (isDateInExistingPeriod) {
            addToastNotification({ message: "Cette date fait déjà partie d'une période existante." });
            return;
        };

        const addedDoc = await api.addPeriodEntry(firebaseUser.uid, date);
        addToastNotification({
            message: "Début des règles enregistré.",
            onUndo: () => removePeriodEntry(addedDoc.id)
        });
        api.addAppNotification(firebaseUser.uid, `Nouvelle période de règles enregistrée le ${format(date, 'd MMMM yyyy', {locale: fr})}.`);
    };
    
    const addSymptomLog = (log: Omit<SymptomLog, 'id'>) => {
        api.saveSymptomLog(firebaseUser.uid, log, symptomHistory);
    };

    const addActivityLog = (date: Date, note?: string) => {
        const isAlreadyLogged = activityHistory.some(a => isSameDay(parseISO(a.date), date));
        if (!isAlreadyLogged) {
            api.addActivityLog(firebaseUser.uid, date, note);
        }
    };

    const removeActivityLog = (entry: ActivityLog) => {
        api.removeActivityLog(firebaseUser.uid, entry.id);
    };

    const togglePregnancyMode = () => {
        const newMode = !isPregnancyMode;
        setPregnancyMode(newMode);
        api.togglePregnancyMode(firebaseUser.uid, newMode);
    };

    const updateUser = async (name: string, photo: File | null) => {
        if (!firebaseUser) return;
        const newPhotoURL = await api.updateUserProfile(firebaseUser, { displayName: name, photo });
        setUser({
            name: name,
            email: user?.email || '',
            photoURL: newPhotoURL || user?.photoURL
        });
    };
    
    const deleteAccount = async () => {
        if (!firebaseUser) return;
        await api.deleteUserAccount(firebaseUser);
        // Auth listener will handle the redirect to login
    };

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [theme]);
    
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    // Memos for calculated data remain the same
    const lastPeriod = useMemo(() => {
        return periodHistory.length > 0 ? periodHistory[periodHistory.length - 1] : null;
    }, [periodHistory]);

    const { nextPeriodDate, ovulationDate, fertileWindow, currentPeriodInfo, nextPeriodWindow } = useMemo(() => {
        if (!lastPeriod) return { nextPeriodDate: null, ovulationDate: null, fertileWindow: null, currentPeriodInfo: null, nextPeriodWindow: null };
        const lastPeriodStart = parseISO(lastPeriod.startDate);
        const nextPeriodStartDate = addDays(lastPeriodStart, settings.cycleLength);
        const ovulationDate = subDays(nextPeriodStartDate, 14);
        const fertileWindow = { start: subDays(ovulationDate, 5), end: addDays(ovulationDate, 1) };
        const nextPeriodWindow = { start: nextPeriodStartDate, end: addDays(nextPeriodStartDate, settings.periodLength - 1) };

        let currentPeriodInfo = null;
        const today = new Date();
        const currentPeriodEntry = periodHistory.find(p => {
            const periodStart = parseISO(p.startDate);
            // Use manual end date if available, otherwise default duration
            const periodEnd = p.endDate 
                ? parseISO(p.endDate)
                : addDays(periodStart, settings.periodLength - 1);
            return isWithinInterval(today, { start: periodStart, end: periodEnd });
        });

        if (currentPeriodEntry) {
            currentPeriodInfo = {
                start: parseISO(currentPeriodEntry.startDate),
                end: currentPeriodEntry.endDate 
                    ? parseISO(currentPeriodEntry.endDate)
                    : addDays(parseISO(currentPeriodEntry.startDate), settings.periodLength - 1),
            };
        }

        return { nextPeriodDate: nextPeriodStartDate, ovulationDate, fertileWindow, currentPeriodInfo, nextPeriodWindow };
    }, [lastPeriod, periodHistory, settings.cycleLength, settings.periodLength]);

    const predictionAccuracy = useMemo(() => {
        if (periodHistory.length < 3) return 85;
        let accuratePredictions = 0;
        const predictionsToMake = periodHistory.length - 2;
        for (let i = 0; i < predictionsToMake; i++) {
            const historySlice = periodHistory.slice(0, i + 2);
            const cycleLengths = [];
            for (let j = 1; j < historySlice.length; j++) {
                cycleLengths.push(differenceInDays(parseISO(historySlice[j].startDate), parseISO(historySlice[j-1].startDate)));
            }
            const avgCycleLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
            const lastKnownPeriodStart = parseISO(historySlice[historySlice.length - 2].startDate);
            const predictedDate = addDays(lastKnownPeriodStart, Math.round(avgCycleLength));
            const actualDate = parseISO(historySlice[historySlice.length - 1].startDate);
            if (Math.abs(differenceInDays(actualDate, predictedDate)) <= 2) accuratePredictions++;
        }
        return Math.round((accuratePredictions / predictionsToMake) * 100);
    }, [periodHistory]);

    const contextValue: AppContextType = {
        settings, setSettings: updateSettings, periodHistory, addPeriodEntry, removePeriodEntry, updatePeriodEntry,
        symptomHistory, addSymptomLog, activityHistory, addActivityLog, removeActivityLog,
        isPregnancyMode, togglePregnancyMode, theme, toggleTheme, lastPeriod, nextPeriodDate, nextPeriodWindow,
        ovulationDate, fertileWindow, currentPeriodInfo, user, logout, updateUser, deleteAccount, predictionAccuracy,
        toastNotifications, addToastNotification, removeToastNotification,
        appNotifications, markNotificationsAsRead,
        login: async () => {}, // placeholder
        signup: async () => {}, // placeholder
    };

    return (
        <AppContext.Provider value={contextValue}>
            <AppUILayout isMockMode={isMockMode} />
        </AppContext.Provider>
    );
};


// The rest of the file (UI components like Toast, AppUILayout, Header, etc.) remains unchanged.
const Toast: React.FC<{ notification: Notification }> = ({ notification }) => {
    const { removeToastNotification } = useAppContext();

    const handleUndo = () => {
        if (notification.onUndo) {
            notification.onUndo();
        }
        removeToastNotification(notification.id);
    };

    return (
        <div className="bg-card-bg-light dark:bg-card-bg-dark text-text-body-light dark:text-text-body-dark rounded-xl shadow-lg p-4 flex items-center justify-between animate-fade-in">
            <p className="text-sm font-medium">{notification.message}</p>
            <div className="flex items-center space-x-2">
                {notification.onUndo && (
                    <button onClick={handleUndo} className="text-sm font-semibold text-accent-light dark:text-accent-dark hover:underline">
                        Annuler
                    </button>
                )}
                <button onClick={() => removeToastNotification(notification.id)} className="p-1 rounded-full hover:bg-gray-500/10">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const NotificationContainer: React.FC = () => {
    const { toastNotifications } = useAppContext();
    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[100] space-y-2">
            {toastNotifications.map(notif => (
                <Toast key={notif.id} notification={notif} />
            ))}
        </div>
    );
};

const AppUILayout: React.FC<{ isMockMode: boolean }> = ({ isMockMode }) => {
    const { user, logout, appNotifications, markNotificationsAsRead } = useAppContext();
    const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [isProfilePanelOpen, setProfilePanelOpen] = useState(false);

    const hasUnreadNotifications = useMemo(() => appNotifications.some(n => !n.read), [appNotifications]);

    const handleOpenNotifications = () => {
        setNotificationPanelOpen(true);
        markNotificationsAsRead();
    }

    return (
        <div className="flex flex-col h-screen max-w-sm mx-auto bg-primary-bg-light dark:bg-primary-bg-dark text-text-body-light dark:text-text-body-dark shadow-2xl">
            <Header user={user} onNotificationClick={handleOpenNotifications} onProfileClick={() => setProfilePanelOpen(true)} hasUnread={hasUnreadNotifications} />
            {isMockMode && (
                <div className="fixed top-20 left-0 right-0 max-w-sm mx-auto z-30">
                    <DemoBanner />
                </div>
            )}
            <NotificationContainer />
            <main className={`flex-grow overflow-y-auto pb-24 ${isMockMode ? 'pt-28' : 'pt-20'}`}>
                <Routes>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/calendar" element={<CalendarScreen />} />
                    <Route path="/reports" element={<SymptomsScreen />} />
                    <Route path="/assistant" element={<AssistantScreen />} />
                    <Route path="/settings" element={<SettingsScreen />} />
                    <Route path="/activity-log" element={<ProfileDetailScreen />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
            <BottomNav />
            <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />
            <ProfilePanel isOpen={isProfilePanelOpen} onClose={() => setProfilePanelOpen(false)} user={user} onLogout={logout} />
        </div>
    );
};

const Header: React.FC<{ user: User | null; onNotificationClick: () => void; onProfileClick: () => void; hasUnread: boolean; }> = ({ user, onNotificationClick, onProfileClick, hasUnread }) => (
    <header className="fixed top-0 left-0 right-0 max-w-sm mx-auto h-20 bg-primary-bg-light/80 dark:bg-primary-bg-dark/80 backdrop-blur-lg z-40 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-3">
             <AppLogo className="w-10 h-10" />
             <span className="text-xl font-bold text-text-heading-light dark:text-text-heading-dark">Mon Cycle</span>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={onNotificationClick} className="p-2 rounded-full hover:bg-gray-500/10 transition-colors relative">
                {hasUnread ? <BellAlertIcon className="h-6 w-6 text-accent-light dark:text-accent-dark"/> : <BellIcon className="h-6 w-6 text-text-body-light dark:text-text-body-dark"/>}
                {hasUnread && <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-primary-bg-light dark:ring-primary-bg-dark"></span>}
            </button>
            <button onClick={onProfileClick} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-500/10 transition-colors">
                <span className="text-sm font-semibold text-text-heading-light dark:text-text-heading-dark hidden md:block">{user?.name}</span>
                {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                    <UserCircleIcon className="h-8 w-8 text-text-body-light dark:text-text-body-dark"/>
                )}
            </button>
        </div>
    </header>
);

const SidePanel: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string; }> = ({ isOpen, onClose, children, title }) => (
    <>
        <div className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
        <div className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-card-bg-light dark:bg-card-bg-dark shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200/80 dark:border-gray-500/20">
                <h2 className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark">{title}</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-500/10">
                    <XMarkIcon className="h-6 w-6"/>
                </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">{children}</div>
        </div>
    </>
);

const NotificationPanel: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { appNotifications } = useAppContext();
    return (
        <SidePanel isOpen={isOpen} onClose={onClose} title="Notifications">
            {appNotifications.length > 0 ? (
                <ul className="space-y-3">
                    {appNotifications.map(notif => (
                        <li key={notif.id} className="p-3 bg-primary-bg-light dark:bg-primary-bg-dark rounded-lg">
                            <p className="text-sm text-text-body-light dark:text-text-body-dark">{notif.message}</p>
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                                {format(parseISO(notif.date), 'd MMM yyyy, HH:mm', { locale: fr })}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-text-muted-light dark:text-text-muted-dark mt-8">Aucune nouvelle notification.</p>
            )}
        </SidePanel>
    );
}

const ProfilePanel: React.FC<{ isOpen: boolean; onClose: () => void; user: User | null; onLogout: () => void; }> = ({ isOpen, onClose, user, onLogout }) => (
    <SidePanel isOpen={isOpen} onClose={onClose} title="Profil">
        <div className="flex flex-col space-y-4">
            <div className="flex flex-col items-center space-y-2 py-4">
                {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-card-bg-light dark:border-card-bg-dark shadow-md" />
                ) : (
                    <UserCircleIcon className="h-24 w-24 text-gray-400 dark:text-gray-500"/>
                )}
                <p className="font-semibold text-lg text-text-heading-light dark:text-text-heading-dark">{user?.name}</p>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{user?.email}</p>
            </div>
            <div className="border-t border-gray-200/80 dark:border-gray-500/20 pt-4 space-y-2">
                <NavLink to="/activity-log" onClick={onClose} className="w-full text-left py-3 px-4 hover:bg-gray-500/10 rounded-lg transition-colors block">
                    Journal d'activité
                </NavLink>
                <NavLink to="/settings" onClick={onClose} className="w-full text-left py-3 px-4 hover:bg-gray-500/10 rounded-lg transition-colors block">
                    Paramètres du cycle
                </NavLink>
                 <button onClick={onLogout} className="w-full flex items-center text-left py-3 px-4 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors">
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                    Se déconnecter
                </button>
            </div>
        </div>
    </SidePanel>
);

const BottomNav: React.FC = () => {
    const location = useLocation();
    const navItems = [
        { path: '/', label: 'Cycle', icon: HomeIcon }, 
        { path: '/calendar', label: 'Calendrier', icon: CalendarIcon }, 
        { path: '/reports', label: 'Rapports', icon: ReportsIcon },
        { path: '/assistant', label: 'Assistant', icon: ChatBubbleLeftRightIcon },
        { path: '/settings', label: 'Profil', icon: SettingsIcon }
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto h-20 bg-card-bg-light/80 dark:bg-card-bg-dark/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-500/20">
            <div className="flex justify-around h-full">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink key={item.path} to={item.path} className="relative flex flex-col items-center justify-center w-full text-xs font-medium transition-colors duration-300 text-text-muted-light dark:text-text-muted-dark hover:text-accent-light dark:hover:text-accent-dark">
                            <div className={`relative z-10 flex flex-col items-center transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                                <item.icon className={`h-6 w-6 mb-1 transition-colors ${isActive ? 'text-accent-light dark:text-accent-dark' : ''}`} />
                                <span className={`${isActive ? 'text-accent-light dark:text-accent-dark font-semibold' : ''}`}>{item.label}</span>
                            </div>
                            {isActive && <div className="absolute top-0 w-12 h-1 bg-accent-light dark:bg-accent-dark rounded-full transition-all duration-300"></div>}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default App;