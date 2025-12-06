
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UserCircleIcon, SparklesIcon } from '../components/Icons';
import { useAppContext } from '../App';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Robust way to access API KEY in different environments (Vite, CRA, etc.)
// @ts-ignore - import.meta meta-property is not allowed in this context (suppress TS warning for direct browser usage)
const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) || (typeof process !== 'undefined' && process.env && process.env.API_KEY);

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AssistantScreen: React.FC = () => {
    const { settings, lastPeriod, nextPeriodDate, ovulationDate, symptomHistory } = useAppContext();
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Bonjour ! Je suis votre assistant personnel. Grâce à vos données, je peux répondre à vos questions sur votre cycle. N'oubliez pas que je ne suis pas un professionnel de santé." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Construct user context
        let userContext = "Voici les informations sur le cycle de l'utilisateur. Utilise-les pour personnaliser ta réponse sans les mentionner directement:\n";
        userContext += `- Longueur moyenne du cycle: ${settings.cycleLength} jours\n`;
        userContext += `- Longueur moyenne des règles: ${settings.periodLength} jours\n`;
        if (lastPeriod) {
            userContext += `- Début des dernières règles: ${format(parseISO(lastPeriod.startDate), 'd MMMM yyyy', { locale: fr })}\n`;
        }
        if (nextPeriodDate) {
            userContext += `- Prédiction des prochaines règles: ${format(nextPeriodDate, 'd MMMM yyyy', { locale: fr })}\n`;
        }
        if (ovulationDate) {
            userContext += `- Prédiction de l'ovulation: ${format(ovulationDate, 'd MMMM yyyy', { locale: fr })}\n`;
        }
        const todaySymptom = symptomHistory.find(s => format(parseISO(s.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
        if (todaySymptom) {
             userContext += `- Symptômes du jour: Humeur - ${todaySymptom.mood}, Douleur - ${todaySymptom.pain}\n`;
        }

        try {
            if (!API_KEY) {
                // Simulate API response for UI development without a key
                setTimeout(() => {
                    const demoResponse: Message = { sender: 'ai', text: "Je ne peux pas répondre pour le moment car la clé API (VITE_API_KEY) n'est pas configurée. En attendant, n'oubliez pas de consulter un professionnel de santé pour tout avis médical." };
                    setMessages(prev => [...prev, demoResponse]);
                    setIsLoading(false);
                }, 1000);
                return;
            }
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            
            const fullPrompt = `${userContext}\n\nQuestion de l'utilisateur: ${input}`;

            const stream = await ai.models.generateContentStream({
                model: 'gemini-flash-lite-latest',
                contents: fullPrompt,
                config: {
                    systemInstruction: "You are a helpful and compassionate AI assistant for the 'Mon Cycle' app. Your purpose is to answer general questions about menstrual cycles, fertility, and pregnancy in French. Provide clear, supportive, and easy-to-understand information. Use the user's cycle data provided in the prompt to tailor your answers. For example, if they ask when to expect something, calculate based on their provided dates. IMPORTANT: You are not a medical professional. Always conclude your response with a clear disclaimer advising the user to consult a healthcare provider for any medical advice, diagnosis, or treatment. Do not provide specific medical recommendations."
                }
            });

            setMessages(prev => [...prev, { sender: 'ai', text: "" }]);
            
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    setMessages(prevMessages => {
                        const lastMessage = prevMessages[prevMessages.length - 1];
                        if (lastMessage?.sender === 'ai') {
                            const updatedMessages = [...prevMessages];
                            updatedMessages[updatedMessages.length - 1] = {
                                ...lastMessage,
                                text: lastMessage.text + chunkText,
                            };
                            return updatedMessages;
                        }
                        return prevMessages;
                    });
                }
            }

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: Message = { sender: 'ai', text: "Désolé, une erreur est survenue lors de la connexion à l'assistant. Veuillez réessayer plus tard." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-4">
            <h1 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-4">Assistant IA</h1>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && (
                            <div className="w-9 h-9 flex-shrink-0 bg-accent-light/20 dark:bg-accent-dark/20 rounded-full flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-accent-light dark:text-accent-dark" />
                            </div>
                        )}
                        <div className={`max-w-xs md:max-w-md p-3 px-4 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-accent-light dark:bg-accent-dark text-white rounded-br-none' : 'bg-card-bg-light dark:bg-card-bg-dark text-text-body-light dark:text-text-body-dark rounded-bl-none'}`}>
                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                        </div>
                         {msg.sender === 'user' && (
                            <div className="w-9 h-9 flex-shrink-0 bg-gray-200 dark:bg-card-bg-dark rounded-full flex items-center justify-center">
                                <UserCircleIcon className="w-5 h-5 text-gray-500" />
                            </div>
                        )}
                    </div>
                ))}
                 {isLoading && messages[messages.length - 1]?.sender !== 'ai' && (
                     <div className="flex items-start gap-3">
                        <div className="w-9 h-9 flex-shrink-0 bg-accent-light/20 dark:bg-accent-dark/20 rounded-full flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-accent-light dark:text-accent-dark" />
                        </div>
                        <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-card-bg-light dark:bg-card-bg-dark text-text-body-light dark:text-text-body-dark rounded-bl-none">
                            <div className="flex items-center space-x-1.5 py-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez votre question..."
                    className="flex-grow p-3 px-5 bg-card-bg-light dark:bg-card-bg-dark border border-gray-200/80 dark:border-gray-500/20 rounded-full focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-accent-light text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M3.105 3.105a.75.75 0 01.99 0L19.5 17.25l-1.06 1.061L3.105 4.165a.75.75 0 010-.99z" />
                        <path d="M19.5 3.53a.75.75 0 010 1.061L4.165 19.95l-1.06-1.06L18.439 3.53a.75.75 0 011.061 0z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default AssistantScreen;
