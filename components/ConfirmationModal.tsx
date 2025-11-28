import React from 'react';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card-bg-light dark:bg-card-bg-dark rounded-2xl shadow-xl w-full max-w-xs p-6 relative animate-zoom-in">
                <h3 className="text-lg font-bold text-center mb-2 text-text-heading-light dark:text-text-heading-dark">{title}</h3>
                <p className="text-sm text-center text-text-body-light dark:text-text-body-dark mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-200 dark:bg-gray-600/50 text-text-body-light dark:text-text-body-dark py-2.5 px-4 rounded-lg shadow-sm hover:opacity-90 transition-opacity font-semibold">
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 text-white py-2.5 px-4 rounded-lg shadow-sm hover:bg-red-600 transition-colors font-semibold">
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
};