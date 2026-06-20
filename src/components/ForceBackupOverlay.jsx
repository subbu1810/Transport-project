import React, { useState } from 'react';
import { Database, Loader2, AlertTriangle, DownloadCloud } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const ForceBackupOverlay = ({ onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [step, setStep] = useState('');

    const handleBackupAndDownload = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        
        try {
            // Step 1: Generate backup
            setStep('Generating full system backup... This may take a minute.');
            const generateResponse = await fetch(`${API_BASE_URL}/backups/manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'combined' })
            });
            const generateData = await generateResponse.json();
            
            if (!generateData.success) {
                throw new Error(generateData.message || 'Failed to generate backup');
            }

            // Step 2: Fetch the latest backups to get the filename
            setStep('Locating backup file...');
            const fetchResponse = await fetch(`${API_BASE_URL}/backups`);
            const fetchData = await fetchResponse.json();
            
            if (!fetchData.success || !fetchData.data || fetchData.data.length === 0) {
                throw new Error('Could not retrieve the generated backup file.');
            }
            
            const latestBackup = fetchData.data[0];

            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user?.id || '';
            const userName = user?.name || '';
            
            // Step 3: Trigger download
            setStep('Downloading backup file...');
            window.location.href = `${API_BASE_URL}/backups/download?file=${latestBackup.name}&user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
            
            // Mark as complete and unlock after a short delay to ensure download starts
            setTimeout(() => {
                onComplete();
            }, 3000);

        } catch (error) {
            console.error('Backup forced generation error:', error);
            setMessage({ type: 'error', text: error.message || 'Something went wrong during backup.' });
            setLoading(false);
            setStep('');
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 font-sans p-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full text-center border-4 border-amber-400">
                <div className="bg-amber-400 p-6 flex flex-col items-center">
                    <div className="bg-white p-3 rounded-full mb-3 shadow-lg text-amber-600 animate-pulse">
                        <AlertTriangle size={48} />
                    </div>
                    <h1 className="text-2xl font-black text-amber-900 uppercase tracking-tight">Weekly Backup Required</h1>
                </div>
                
                <div className="p-8">
                    <p className="text-gray-600 font-medium mb-6">
                        It has been more than 7 days since your last system backup. To ensure data safety, the application is locked until a fresh backup is generated and downloaded.
                    </p>

                    {message.text && (
                        <div className={`mb-6 p-3 rounded text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        onClick={handleBackupAndDownload}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                    >
                        {loading ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <DownloadCloud size={24} />
                        )}
                        {loading ? 'Processing...' : 'Generate & Download'}
                    </button>

                    {loading && step && (
                        <p className="mt-4 text-sm font-bold text-gray-500 animate-pulse">{step}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForceBackupOverlay;
