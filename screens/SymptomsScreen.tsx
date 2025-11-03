
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { SymptomLog } from '../types';
import { format, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const moodMapping: { [key in SymptomLog['mood']]: { emoji: string, value: number, label: string } } = {
  'heureuse': { emoji: '😊', value: 5, label: 'Heureuse' },
  'energique': { emoji: '⚡️', value: 4, label: 'Énergique' },
  'calme': { emoji: '😌', value: 3, label: 'Calme' },
  'irritable': { emoji: '😠', value: 2, label: 'Irritable' },
  'triste': { emoji: '😢', value: 1, label: 'Triste' },
};

const painMapping: { [key in SymptomLog['pain']]: { value: number, label: string } } = {
  'aucune': { value: 0, label: 'Aucune' },
  'légère': { value: 1, label: 'Légère' },
  'modérée': { value: 2, label: 'Modérée' },
  'forte': { value: 3, label: 'Forte' },
};

const flowMapping: { [key in SymptomLog['flow']]: { value: number, label: string } } = {
  'aucune': { value: 0, label: 'Aucun' },
  'léger': { value: 1, label: 'Léger' },
  'moyen': { value: 2, label: 'Moyen' },
  'abondant': { value: 3, label: 'Abondant' },
};

const SymptomsScreen: React.FC = () => {
    const { symptomHistory, addSymptomLog } = useAppContext();
    const today = new Date();
    const todayLog = symptomHistory.find(log => isSameDay(parseISO(log.date), today));

    const [selectedDate, setSelectedDate] = useState(today);
    const [mood, setMood] = useState<SymptomLog['mood']>(todayLog?.mood || 'calme');
    const [pain, setPain] = useState<SymptomLog['pain']>(todayLog?.pain || 'aucune');
    const [flow, setFlow] = useState<SymptomLog['flow']>(todayLog?.flow || 'aucune');

    const handleSave = () => {
        addSymptomLog({
            date: selectedDate.toISOString(),
            mood,
            pain,
            flow,
        });
        alert('Symptômes enregistrés !');
    };

    const chartData = useMemo(() => {
        return symptomHistory
            .map(log => ({
                name: format(parseISO(log.date), 'dd/MM'),
                Humeur: moodMapping[log.mood].value,
                Douleur: painMapping[log.pain].value,
                Flux: flowMapping[log.flow].value,
            }))
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [symptomHistory]);

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">Suivi des Symptômes</h1>
            <p className="text-md text-gray-600 dark:text-gray-300">Aujourd'hui, {format(today, 'd MMMM yyyy', { locale: fr })}</p>

            <div className="space-y-4 p-4 bg-white dark:bg-secondary-dark rounded-lg shadow">
                <div>
                    <h3 className="font-semibold mb-2">Comment te sens-tu ?</h3>
                    <div className="flex justify-around">
                        {Object.entries(moodMapping).map(([key, { emoji, label }]) => (
                            <button key={key} onClick={() => setMood(key as SymptomLog['mood'])} 
                                    className={`flex flex-col items-center p-2 rounded-lg transition ${mood === key ? 'bg-primary-light dark:bg-fertile-dark ring-2 ring-accent-light' : ''}`}>
                                <span className="text-3xl">{emoji}</span>
                                <span className="text-xs mt-1">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Douleurs</h3>
                    <div className="flex justify-around space-x-2">
                        {Object.entries(painMapping).map(([key, { label }]) => (
                            <button key={key} onClick={() => setPain(key as SymptomLog['pain'])} 
                                    className={`flex-1 py-2 px-1 text-sm rounded-lg transition ${pain === key ? 'bg-accent-light text-white dark:bg-accent-dark' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Flux menstruel</h3>
                    <div className="flex justify-around space-x-2">
                         {Object.entries(flowMapping).map(([key, { label }]) => (
                            <button key={key} onClick={() => setFlow(key as SymptomLog['flow'])} 
                                    className={`flex-1 py-2 px-1 text-sm rounded-lg transition ${flow === key ? 'bg-accent-light text-white dark:bg-accent-dark' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                 <button onClick={handleSave} className="w-full mt-4 bg-accent-light text-white py-2 px-4 rounded-lg shadow hover:opacity-90 transition dark:bg-accent-dark">
                    Enregistrer
                </button>
            </div>
            
            <div className="p-4 bg-white dark:bg-secondary-dark rounded-lg shadow">
                <h3 className="font-semibold mb-4">Évolution des symptômes</h3>
                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3}/>
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis domain={[0, 5]} tickCount={6} fontSize={12} />
                            <Tooltip />
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                            <Line type="monotone" dataKey="Humeur" stroke="#E53E8A" strokeWidth={2} />
                            <Line type="monotone" dataKey="Douleur" stroke="#8884d8" strokeWidth={2} />
                            <Line type="monotone" dataKey="Flux" stroke="#82ca9d" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SymptomsScreen;
