
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppLogo } from '../components/Logo';
import { EnvelopeIcon } from '../components/Icons';

const EmailVerificationScreen: React.FC = () => {
    const location = useLocation();
    const email = location.state?.email || "votre adresse email";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-primary-bg-light dark:bg-primary-bg-dark p-4">
            <div className="w-full max-w-sm mx-auto text-center">
                <div className="flex flex-col items-center mb-8 animate-fade-in">
                    <AppLogo className="w-24 h-24" />
                    <h1 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mt-4">Vérifiez votre email</h1>
                </div>

                <div className="bg-card-bg-light dark:bg-card-bg-dark p-6 rounded-2xl shadow-xl animate-fade-in" style={{animationDelay: '100ms'}}>
                    <div className="w-16 h-16 bg-accent-light/10 dark:bg-accent-dark/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <EnvelopeIcon className="w-8 h-8 text-accent-light dark:text-accent-dark" />
                    </div>
                    <p className="text-text-body-light dark:text-text-body-dark mb-6">
                        Nous avons envoyé un email de vérification à <span className="font-semibold text-text-heading-light dark:text-text-heading-dark">{email}</span>.
                    </p>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-8">
                        Veuillez cliquer sur le lien dans l'email pour activer votre compte, puis connectez-vous.
                    </p>

                    <Link to="/login" className="block w-full py-3 bg-accent-light text-white font-semibold rounded-xl shadow-lg hover:bg-accent-hover-light transition-all dark:bg-accent-dark dark:hover:bg-accent-hover-dark transform hover:scale-105 text-center">
                        Se connecter
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationScreen;
