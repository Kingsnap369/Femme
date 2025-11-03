
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { addDays, subDays, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import SymptomsScreen from './screens/SymptomsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { HomeIcon, CalendarIcon, ChartIcon, SettingsIcon } from './components/Icons';
import { CycleSettings, PeriodEntry, SymptomLog, ActivityLog } from './types';

// --- App Context ---
interface AppContextType {
  settings: CycleSettings;
  setSettings: (settings: CycleSettings) => void;
  periodHistory: PeriodEntry[];
  addPeriodEntry: (date: Date) => void;
  symptomHistory: SymptomLog[];
  addSymptomLog: (log: SymptomLog) => void;
  activityHistory: ActivityLog[];
  addActivityLog: (date: Date) => void;
  isPregnancyMode: boolean;
  togglePregnancyMode: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  lastPeriod: PeriodEntry | null;
  nextPeriodDate: Date | null;
  ovulationDate: Date | null;
  fertileWindow: { start: Date, end: Date } | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

// --- Main App Component ---
const App: React.FC = () => {
  const [settings, setSettingsState] = useState<CycleSettings>(() => {
    const saved = localStorage.getItem('cycleSettings');
    return saved ? JSON.parse(saved) : { cycleLength: 28, periodLength: 5, notifications: { period: true, ovulation: true } };
  });

  const [periodHistory, setPeriodHistory] = useState<PeriodEntry[]>(() => {
    const saved = localStorage.getItem('periodHistory');
    return saved ? JSON.parse(saved) : [{ startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() }];
  });

  const [symptomHistory, setSymptomHistory] = useState<SymptomLog[]>(() => {
    const saved = localStorage.getItem('symptomHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activityHistory, setActivityHistory] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('activityHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [isPregnancyMode, setPregnancyMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isPregnancyMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setSettings = (newSettings: CycleSettings) => {
    localStorage.setItem('cycleSettings', JSON.stringify(newSettings));
    setSettingsState(newSettings);
  };

  const addPeriodEntry = (date: Date) => {
    const newEntry = { startDate: date.toISOString() };
    const updatedHistory = [...periodHistory, newEntry].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    localStorage.setItem('periodHistory', JSON.stringify(updatedHistory));
    setPeriodHistory(updatedHistory);
  };
  
  const addSymptomLog = (log: SymptomLog) => {
      const existingIndex = symptomHistory.findIndex(s => isSameDay(parseISO(s.date), parseISO(log.date)));
      let updatedHistory;
      if (existingIndex > -1) {
        updatedHistory = [...symptomHistory];
        updatedHistory[existingIndex] = log;
      } else {
        updatedHistory = [...symptomHistory, log];
      }
      localStorage.setItem('symptomHistory', JSON.stringify(updatedHistory));
      setSymptomHistory(updatedHistory);
  };

  const addActivityLog = (date: Date) => {
    const newEntry = { date: date.toISOString() };
    const isAlreadyLogged = activityHistory.some(a => isSameDay(parseISO(a.date), date));
    if (!isAlreadyLogged) {
        const updatedHistory = [...activityHistory, newEntry].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        localStorage.setItem('activityHistory', JSON.stringify(updatedHistory));
        setActivityHistory(updatedHistory);
    }
  };

  const togglePregnancyMode = () => {
    const newMode = !isPregnancyMode;
    localStorage.setItem('isPregnancyMode', JSON.stringify(newMode));
    setPregnancyMode(newMode);
  };
  
  const lastPeriod = useMemo(() => periodHistory.length > 0 ? periodHistory[periodHistory.length - 1] : null, [periodHistory]);
  
  const { nextPeriodDate, ovulationDate, fertileWindow } = useMemo(() => {
    if (!lastPeriod) return { nextPeriodDate: null, ovulationDate: null, fertileWindow: null };
    const lastPeriodStart = parseISO(lastPeriod.startDate);
    const nextPeriodDate = addDays(lastPeriodStart, settings.cycleLength);
    const ovulationDate = subDays(nextPeriodDate, 14);
    const fertileWindow = {
      start: subDays(ovulationDate, 5),
      end: ovulationDate
    };
    return { nextPeriodDate, ovulationDate, fertileWindow };
  }, [lastPeriod, settings.cycleLength]);


  const contextValue: AppContextType = {
    settings,
    setSettings,
    periodHistory,
    addPeriodEntry,
    symptomHistory,
    addSymptomLog,
    activityHistory,
    addActivityLog,
    isPregnancyMode,
    togglePregnancyMode,
    theme,
    toggleTheme,
    lastPeriod,
    nextPeriodDate,
    ovulationDate,
    fertileWindow
  };

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <div className="flex flex-col h-screen max-w-sm mx-auto bg-primary-light dark:bg-secondary-dark text-gray-800 dark:text-gray-200 font-sans shadow-2xl">
          <main className="flex-grow overflow-y-auto pb-16">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/calendar" element={<CalendarScreen />} />
              <Route path="/symptoms" element={<SymptomsScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

// --- Bottom Navigation ---
const BottomNav: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Accueil', icon: HomeIcon },
    { path: '/calendar', label: 'Calendrier', icon: CalendarIcon },
    { path: '/symptoms', label: 'Symptômes', icon: ChartIcon },
    { path: '/settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white dark:bg-primary-dark border-t border-secondary-light dark:border-secondary-dark shadow-t-lg">
      <div className="flex justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full text-sm font-medium transition-colors duration-200 ${
                isActive ? 'text-accent-light dark:text-accent-dark' : 'text-gray-500 dark:text-gray-400 hover:text-accent-light dark:hover:text-accent-dark'
              }`}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};


export default App;
