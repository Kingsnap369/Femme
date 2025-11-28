
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import * as api from '../firebaseApi';
import { AppLogo } from '../components/Logo';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowPathIcon } from '../components/Icons';

const LoginScreen: React.FC = () => {
    const { login } = useAppContext();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showResendButton, setShowResendButton] = useState(false);
    
    // Forgot Password State
    const [isResetMode, setIsResetMode] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowResendButton(false);
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            // Check for common auth errors to suppress console noise for expected user errors
            const isCommonError = ['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-login-credentials', 'auth/email-not-verified'].includes(err.code);
            
            if (!isCommonError) {
                console.error("Login error:", err);
            }

            // Specific error handling
            if (['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-login-credentials'].includes(err.code)) {
                setError("Email ou mot de passe incorrect.");
            } else if (err.code === 'auth/email-not-verified') {
                setError("Veuillez vérifier votre email pour activer votre compte.");
                setShowResendButton(true);
            } else if (err.code === 'auth/too-many-requests') {
                setError("Trop de tentatives. Veuillez réessayer plus tard.");
            } else if (err.code === 'auth/api-key-not-valid' || (err.message && err.message.includes("API key"))) {
                setError("Configuration manquante : Clé API invalide.");
            } else {
                setError(`Erreur : ${err.message || "Impossible de se connecter."}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            await api.signInWithGoogle();
            navigate('/');
        } catch (err: any) {
            console.error("Google Login Error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Connexion annulée.");
            } else {
                setError("Erreur avec Google : " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.resendVerificationEmail(email, password);
            setError("Email de vérification renvoyé ! Veuillez vérifier votre boîte de réception.");
            setShowResendButton(false);
        } catch (err: any) {
             setError("Erreur lors de l'envoi : " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);
        try {
            await api.resetPassword(email);
            setSuccessMessage(`Nous avons envoyé un lien de réinitialisation à ${email}.`);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                setError("Aucun compte trouvé avec cet email.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Adresse email invalide.");
            } else {
                setError("Erreur : " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isResetMode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-primary-bg-light dark:bg-primary-bg-dark p-4">
                <div className="w-full max-w-sm mx-auto">
                     <div className="flex flex-col items-center mb-8 animate-fade-in">
                        <AppLogo className="w-20 h-20" />
                        <h1 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mt-4">Mot de passe oublié</h1>
                    </div>
                    
                    <div className="bg-card-bg-light dark:bg-card-bg-dark p-6 rounded-2xl shadow-xl animate-fade-in" style={{animationDelay: '100ms'}}>
                        {successMessage ? (
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                                    <ArrowPathIcon className="w-6 h-6" />
                                </div>
                                <p className="text-text-body-light dark:text-text-body-dark">{successMessage}</p>
                                <button 
                                    onClick={() => { setIsResetMode(false); setSuccessMessage(''); }}
                                    className="w-full py-3 bg-accent-light text-white font-semibold rounded-xl shadow hover:bg-accent-hover-light transition-colors dark:bg-accent-dark dark:hover:bg-accent-hover-dark"
                                >
                                    Retour à la connexion
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark text-center mb-4">
                                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                </p>
                                
                                {error && (
                                    <div className="text-center bg-red-500/10 p-3 rounded-lg">
                                        <p className="text-red-500 text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="relative">
                                    <EnvelopeIcon className="w-5 h-5 absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-gray-200 dark:bg-gray-700 border-2 border-gray-500 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full py-3 bg-accent-light text-white font-semibold rounded-xl shadow-lg hover:bg-accent-hover-light transition-all dark:bg-accent-dark dark:hover:bg-accent-hover-dark transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">
                                    {isLoading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                                </button>
                                
                                <button 
                                    type="button" 
                                    onClick={() => setIsResetMode(false)}
                                    className="w-full py-3 text-text-body-light dark:text-text-body-dark hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-primary-bg-light dark:bg-primary-bg-dark p-4">
            <div className="w-full max-w-sm mx-auto">
                <div className="flex flex-col items-center mb-8 animate-fade-in">
                    <AppLogo className="w-24 h-24" />
                    <h1 className="text-3xl font-bold text-text-heading-light dark:text-text-heading-dark mt-4">Mon Cycle</h1>
                    <p className="text-text-body-light dark:text-text-body-dark">Connectez-vous pour continuer</p>
                </div>
                
                <div className="bg-card-bg-light dark:bg-card-bg-dark p-6 rounded-2xl shadow-xl animate-fade-in" style={{animationDelay: '100ms'}}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-center bg-red-500/10 p-3 rounded-lg">
                                <p className="text-red-500 text-sm font-medium">{error}</p>
                                {showResendButton && (
                                    <button 
                                        type="button" 
                                        onClick={handleResendVerification}
                                        disabled={isLoading}
                                        className="mt-2 text-xs font-bold text-accent-light dark:text-accent-dark hover:underline"
                                    >
                                        Renvoyer l'email de vérification
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="relative">
                            <EnvelopeIcon className="w-5 h-5 absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-200 dark:bg-gray-700 border-2 border-gray-500 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>
                         <div className="relative">
                            <LockClosedIcon className="w-5 h-5 absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-12 py-3 bg-gray-200 dark:bg-gray-700 border-2 border-gray-500 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                type="button" 
                                onClick={() => setIsResetMode(true)}
                                className="text-xs font-semibold text-accent-light dark:text-accent-dark hover:underline"
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-accent-light text-white font-semibold rounded-xl shadow-lg hover:bg-accent-hover-light transition-all dark:bg-accent-dark dark:hover:bg-accent-hover-dark transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">
                            {isLoading ? 'Chargement...' : 'Connexion'}
                        </button>
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-card-bg-light dark:bg-card-bg-dark text-gray-500 dark:text-gray-400">Ou continuer avec</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            <img src="https://storage.googleapis.com/your_ai_workflow_public_bucke/google_g_logo.svg.png" alt="Google" className="w-5 h-5 mr-3" />
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Google</span>
                        </button>
                    </form>

                    <p className="text-center text-sm text-text-body-light dark:text-text-body-dark mt-8">
                        Pas encore de compte ?{' '}
                        <Link to="/signup" className="font-semibold text-accent-light dark:text-accent-dark hover:underline">
                            Inscrivez-vous
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
