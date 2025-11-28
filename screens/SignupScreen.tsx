
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import * as api from '../firebaseApi';
import { AppLogo } from '../components/Logo';
import { UserCircleIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, PlusIcon } from '../components/Icons';

const SignupScreen: React.FC = () => {
    const { signup } = useAppContext();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setIsLoading(true);
        try {
            await api.signInWithGoogle();
            navigate('/');
        } catch (err: any) {
            console.error("Google Signup Error:", err);
             if (err.code === 'auth/popup-closed-by-user') {
                setError("Inscription annulée.");
            } else {
                setError("Erreur avec Google : " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setIsLoading(true);
        try {
            await signup({ name, email, password, photo });
            // Navigate to Email Verification Screen instead of home
            navigate('/verify-email', { state: { email } });
        } catch (err: any) {
            console.error("Signup error:", err);
            // Robust check for duplicate email error
            if (err.code === 'auth/email-already-in-use' || (err.message && err.message.includes('email-already-in-use'))) {
                setError("Cet utilisateur existe déjà. Veuillez vous connecter.");
            } else if (err.code === 'auth/weak-password') {
                setError("Le mot de passe est trop faible.");
            } else if (err.code === 'auth/invalid-email') {
                setError("L'adresse email est invalide.");
            } else if (err.code === 'auth/operation-not-allowed') {
                setError("L'inscription par email n'est pas activée dans Firebase.");
            } else if (err.code === 'auth/api-key-not-valid' || (err.message && err.message.includes("API key"))) {
                setError("Configuration manquante : Clé API invalide.");
            } else {
                setError(`Erreur : ${err.message || "Une erreur est survenue."}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-primary-bg-light dark:bg-primary-bg-dark p-4">
            <div className="w-full max-w-sm mx-auto">
                 <div className="flex flex-col items-center mb-6 animate-fade-in">
                    <AppLogo className="w-20 h-20" />
                    <h1 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mt-2">Créer un compte</h1>
                </div>

                <div className="bg-card-bg-light dark:bg-card-bg-dark p-6 rounded-2xl shadow-xl animate-fade-in" style={{animationDelay: '100ms'}}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg font-medium">{error}</p>}
                        
                        {/* Photo Upload */}
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-white dark:bg-primary-bg-dark border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircleIcon className="w-10 h-10 text-text-muted-light dark:text-text-muted-dark" />
                                    )}
                                </div>
                                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 w-7 h-7 bg-accent-light dark:bg-accent-dark rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform text-white">
                                    <PlusIcon className="w-4 h-4" />
                                </label>
                                <input 
                                    id="photo-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handlePhotoChange} 
                                    className="hidden" 
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <UserCircleIcon className="w-5 h-5 absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                            <input
                                type="text"
                                placeholder="Nom"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3 bg-gray-200 dark:bg-gray-700 border-2 border-gray-500 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>
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
                                minLength={6}
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
                        <div className="relative">
                            <LockClosedIcon className="w-5 h-5 absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirmer le mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-12 pr-12 py-3 bg-gray-200 dark:bg-gray-700 border-2 border-gray-500 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-accent-light text-white font-semibold rounded-xl shadow-lg hover:bg-accent-hover-light transition-all dark:bg-accent-dark dark:hover:bg-accent-hover-dark transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100">
                            {isLoading ? 'Création...' : 'Inscription'}
                        </button>
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-card-bg-light dark:bg-card-bg-dark text-gray-500 dark:text-gray-400">Ou s'inscrire avec</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            <img src="https://storage.googleapis.com/your_ai_workflow_public_bucke/google_g_logo.svg.png" alt="Google" className="w-5 h-5 mr-3" />
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Google</span>
                        </button>
                    </form>
                    <p className="text-center text-sm text-text-body-light dark:text-text-body-dark mt-6">
                        Vous avez déjà un compte ?{' '}
                        <Link to="/login" className="font-semibold text-accent-light dark:text-accent-dark hover:underline">
                            Connectez-vous
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupScreen;
