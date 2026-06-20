import React, { useState, useEffect } from 'react';
import { Database, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const BackupOptions = () => {
    const [autoBackup, setAutoBackup] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [backups, setBackups] = useState([]);
    const [logs, setLogs] = useState([]);
    const [fetchingBackups, setFetchingBackups] = useState(false);
    const [fetchingLogs, setFetchingLogs] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchBackupStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/settings/backup/status`);
            const data = await response.json();
            if (data.success) {
                setAutoBackup(data.enabled);
            }
        } catch (error) {
            console.error('Error fetching backup status:', error);
        }
    };

    const fetchBackups = async () => {
        setFetchingBackups(true);
        try {
            const response = await fetch(`${API_BASE_URL}/backups`);
            const data = await response.json();
            if (data.success) {
                setBackups(data.data);
            }
        } catch (error) {
            console.error('Error fetching backups:', error);
        } finally {
            setFetchingBackups(false);
        }
    };

    const fetchLogs = async () => {
        setFetchingLogs(true);
        try {
            const response = await fetch(`${API_BASE_URL}/backups/logs`);
            const data = await response.json();
            if (data.success) {
                setLogs(data.data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setFetchingLogs(false);
        }
    };

    useEffect(() => {
        fetchBackupStatus();
        fetchBackups();
        fetchLogs();
    }, []);

    const handleAutoBackupToggle = async () => {
        const newValue = !autoBackup;
        setAutoBackup(newValue);
        try {
            const response = await fetch(`${API_BASE_URL}/settings/backup/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newValue })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
            } else {
                setAutoBackup(!newValue);
                setMessage({ type: 'error', text: 'Failed to update backup settings' });
            }
        } catch (error) {
            setAutoBackup(!newValue);
            setMessage({ type: 'error', text: 'Connection error' });
        }
    };

    const handleManualBackup = async (type) => {
        setBackupLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/backups/manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: `Backup generated successfully! (${type})` });
                fetchBackups();
            } else {
                setMessage({ type: 'error', text: data.message || 'Backup failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed during backup' });
        } finally {
            setBackupLoading(false);
        }
    };

    const handleDownloadBackup = (fileName) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id || '';
        const userName = user?.name || '';
        window.location.href = `${API_BASE_URL}/backups/download?file=${fileName}&user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
        // refresh logs after a short delay
        setTimeout(fetchLogs, 3000);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="w-full mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-100">
                        <Database className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Backup Options</h1>
                        <p className="text-sm text-gray-500 font-medium">Manage database and application file backups</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                        {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <Database size={20} className="text-purple-600" />
                                SYSTEM BACKUPS
                            </h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage database and application file backups</p>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Auto Backup Section */}
                        <div className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Automatic Weekly Backup</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">When enabled, the system will automatically generate a full combined backup (database and files) every week.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={autoBackup} onChange={handleAutoBackupToggle} />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        {/* Manual Backup Options */}
                        <div className="mb-8">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Manual Backup Generation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button 
                                    onClick={() => handleManualBackup('database')} 
                                    disabled={backupLoading}
                                    className="p-4 border-2 border-purple-100 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
                                >
                                    {backupLoading ? <Loader2 size={24} className="text-purple-600 animate-spin" /> : <Database size={24} className="text-purple-600" />}
                                    <span className="text-xs font-black text-purple-900 uppercase">Database Only</span>
                                    <span className="text-[10px] text-purple-600 font-medium">(SQL file)</span>
                                </button>
                                <button 
                                    onClick={() => handleManualBackup('files')} 
                                    disabled={backupLoading}
                                    className="p-4 border-2 border-blue-100 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
                                >
                                    {backupLoading ? <Loader2 size={24} className="text-blue-600 animate-spin" /> : <Upload size={24} className="text-blue-600" />}
                                    <span className="text-xs font-black text-blue-900 uppercase">App Files Only</span>
                                    <span className="text-[10px] text-blue-600 font-medium">(Uploads, Logos, QRs)</span>
                                </button>
                                <button 
                                    onClick={() => handleManualBackup('combined')} 
                                    disabled={backupLoading}
                                    className="p-4 border-2 border-green-100 bg-green-50 rounded-xl hover:bg-green-100 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
                                >
                                    {backupLoading ? <Loader2 size={24} className="text-green-600 animate-spin" /> : <Database size={24} className="text-green-600" />}
                                    <span className="text-xs font-black text-green-900 uppercase">Combined Backup</span>
                                    <span className="text-[10px] text-green-600 font-medium">(SQL + All Files)</span>
                                </button>
                            </div>
                        </div>

                        {/* Backup History */}
                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                                <span>Recent Backups</span>
                                <button onClick={fetchBackups} className="text-blue-500 hover:text-blue-700 underline text-[10px]">Refresh List</button>
                            </h3>
                            
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                {fetchingBackups ? (
                                    <div className="p-6 text-center text-gray-400"><Loader2 size={24} className="animate-spin mx-auto text-blue-500" /></div>
                                ) : backups.length === 0 ? (
                                    <div className="p-6 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">No backups found</div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">Date & Time</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">File Name</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">Size</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {backups.map((backup, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-600">{new Date(backup.date).toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-medium text-blue-600 text-xs">{backup.name}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-500 text-xs">{(backup.size / 1024 / 1024).toFixed(2)} MB</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button 
                                                            onClick={() => handleDownloadBackup(backup.name)}
                                                            className="px-3 py-1.5 bg-gray-900 text-white rounded text-[10px] font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
                                                        >
                                                            Download
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {/* Backup Download History */}
                        <div className="mt-8">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                                <span>Download History</span>
                                <button onClick={fetchLogs} className="text-blue-500 hover:text-blue-700 underline text-[10px]">Refresh Logs</button>
                            </h3>
                            
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                {fetchingLogs ? (
                                    <div className="p-6 text-center text-gray-400"><Loader2 size={24} className="animate-spin mx-auto text-blue-500" /></div>
                                ) : logs.length === 0 ? (
                                    <div className="p-6 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">No download logs found</div>
                                ) : (
                                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <sticky className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">Downloaded At</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">File Name</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">User</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">System Info</th>
                                                </tr>
                                            </sticky>
                                            <tbody className="divide-y divide-gray-100">
                                                {logs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                                        <td className="px-4 py-3 font-medium text-blue-600 text-xs">{log.file_name}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-700 text-xs">{log.user_name || `User ID: ${log.user_id}`}</td>
                                                        <td className="px-4 py-3 text-gray-500 text-[10px] max-w-[200px] truncate" title={log.user_agent}>
                                                            <div className="font-bold">{log.ip_address}</div>
                                                            {log.user_agent}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupOptions;
