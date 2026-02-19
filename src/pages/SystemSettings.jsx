import React, { useState, useEffect } from 'react';
import { Settings, Upload, Trash2, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

const SystemSettings = () => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [logo, setLogo] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/settings/logo_path');
            const data = await response.json();
            if (data.success && data.data) {
                setPreviewUrl(`http://localhost:8000/storage/${data.data}`);
            }
        } catch (error) {
            console.error('Error fetching logo:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2048 * 1024) {
                setMessage({ type: 'error', text: 'File size should be less than 2MB' });
                return;
            }
            setLogo(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!logo) {
            setMessage({ type: 'error', text: 'Please select a logo first' });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('logo', logo);

        try {
            const response = await fetch('http://localhost:8000/api/v1/settings/logo', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Logo updated successfully!' });
                setLogo(null);
                if (data.data && data.data.path) {
                    setPreviewUrl(`http://localhost:8000/storage/${data.data.path}`);
                }
                // Notify header/other components if needed (could use a global state or refresh)
                window.dispatchEvent(new Event('logoUpdated'));
            } else {
                setMessage({ type: 'error', text: data.message || 'Upload failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete the company logo?')) return;

        setUploading(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/settings/logo', {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Logo deleted successfully!' });
                setPreviewUrl(null);
                setLogo(null);
                window.dispatchEvent(new Event('logoUpdated'));
            } else {
                setMessage({ type: 'error', text: data.message || 'Delete failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-green-600 rounded-xl shadow-lg shadow-green-100">
                        <Settings className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">SYSTEM SETTINGS</h1>
                        <p className="text-sm text-gray-500 font-medium">Manage company branding and global configurations</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                        {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <ImageIcon size={20} className="text-green-600" />
                            COMPANY LOGO
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">This logo will appear on GC prints and reports</p>
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-shrink-0">
                                <div className="relative group">
                                    <div className="w-48 h-48 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-green-400">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon size={48} className="text-gray-300 mx-auto mb-2" />
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No Logo Set</p>
                                            </div>
                                        )}
                                    </div>
                                    {previewUrl && (
                                        <button
                                            onClick={handleDelete}
                                            className="absolute -top-3 -right-3 p-2 bg-white text-red-500 rounded-full shadow-lg border border-red-50 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                            title="Remove Logo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div className="space-y-4">
                                    <label className="block p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-white hover:border-green-400 transition-all group">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                                <Upload size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-700">Choose New Logo</p>
                                                <p className="text-xs text-gray-400 font-medium">PNG, JPG, SVG up to 2MB</p>
                                            </div>
                                        </div>
                                    </label>

                                    {logo && (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                                            <CheckCircle2 size={16} className="text-green-600" />
                                            <p className="text-xs font-bold text-green-700">File selected: {logo.name}</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!logo || uploading}
                                    className="w-full py-4 bg-green-600 text-white font-black rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                    {uploading ? 'UPLOADING...' : 'SAVE COMPANY LOGO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 cursor-not-allowed">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 border-dashed">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Coming Soon</p>
                        <h3 className="text-sm font-black text-gray-600 uppercase">Printer Settings</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 border-dashed">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Coming Soon</p>
                        <h3 className="text-sm font-black text-gray-600 uppercase">Report Templates</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
