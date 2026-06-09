import React, { useState, useEffect } from 'react';
import { Settings, Upload, Trash2, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Building2 } from 'lucide-react';
import { API_BASE_URL, STORAGE_URL } from '../config/api';

const SystemSettings = () => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [logo, setLogo] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [qrPreviewUrl, setQrPreviewUrl] = useState(null);
    const [transport, setTransport] = useState(null);
    const [qrUploading, setQrUploading] = useState(false);

    // Get the logged-in admin's transport_id from localStorage
    const [currentUser, setCurrentUser] = useState(null)
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
    }, [])

    const adminInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const transportId = adminInfo?.transport_id;

    useEffect(() => {
        if (transportId) {
            fetchTransport();
        } else {
            // Fallback: fetch global logo if no transport_id assigned
            fetchGlobalLogo();
        }
    }, []);

    const fetchTransport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/transports/${transportId}`);
            const data = await response.json();
            if (data.success && data.data) {
                setTransport(data.data);
                if (data.data.logo_path) {
                    setPreviewUrl(`${STORAGE_URL}/${data.data.logo_path}`);
                }
            }
        } catch (error) {
            console.error('Error fetching transport:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalLogo = async () => {
        setLoading(true);
        try {
            const [logoRes, qrRes] = await Promise.all([
                fetch(`${API_BASE_URL}/settings/logo_path`).then(r => r.json()),
                fetch(`${API_BASE_URL}/settings/upi_qr_path`).then(r => r.json())
            ]);

            if (logoRes.success && logoRes.data) {
                setPreviewUrl(`${STORAGE_URL}/${logoRes.data}`);
            }
            if (qrRes.success && qrRes.data) {
                setQrPreviewUrl(`${STORAGE_URL}/${qrRes.data}`);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!transportId || (currentUser && currentUser.role === 'superadmin')) {
            // Nothing to fetch initially for superadmin until settings are moved here
        }
    }, [transportId, currentUser]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2048 * 1024) {
                setMessage({ type: 'error', text: 'File size should be less than 2MB' });
                return;
            }
            setLogo(file);
            setPreviewUrl(URL.createObjectURL(file));
            setMessage({ type: '', text: '' });
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
            // Determine endpoint based on transportId
            const endpoint = transportId
                ? `${API_BASE_URL}/transports/${transportId}/logo`
                : `${API_BASE_URL}/settings/logo`;

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Logo updated successfully!' });
                setLogo(null);

                const finalUrl = data.data?.logo_url || data.data?.url;
                if (finalUrl) {
                    setPreviewUrl(finalUrl);
                }

                // Update the stored admin info so Header/other components refresh
                const storageKey = localStorage.getItem('user') ? 'user' : 'admin';
                const updated = { ...adminInfo, transport_logo_url: finalUrl };
                localStorage.setItem(storageKey, JSON.stringify(updated));
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
            // Determine endpoint based on transportId
            const endpoint = transportId
                ? `${API_BASE_URL}/transports/${transportId}/logo`
                : `${API_BASE_URL}/settings/logo`;

            const response = await fetch(endpoint, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Logo deleted successfully!' });
                setPreviewUrl(null);
                setLogo(null);

                // Update storage
                const storageKey = localStorage.getItem('user') ? 'user' : 'admin';
                const updated = { ...adminInfo, transport_logo_url: null };
                localStorage.setItem(storageKey, JSON.stringify(updated));
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

    const handleQRChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2048 * 1024) {
                setMessage({ type: 'error', text: 'QR code size should be less than 2MB' });
                return;
            }
            setQrCode(file);
            setQrPreviewUrl(URL.createObjectURL(file));
            setMessage({ type: '', text: '' });
        }
    };

    const handleQRUpload = async () => {
        if (!qrCode) {
            setMessage({ type: 'error', text: 'Please select a QR code first' });
            return;
        }

        setQrUploading(true);
        const formData = new FormData();
        formData.append('qr_code', qrCode);

        try {
            const response = await fetch(`${API_BASE_URL}/settings/upi-qr`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Payment QR updated successfully!' });
                setQrCode(null);
                if (data.data?.url) {
                    setQrPreviewUrl(data.data.url);
                }
            } else {
                setMessage({ type: 'error', text: data.message || 'Upload failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setQrUploading(false);
        }
    };

    const handleQRDelete = async () => {
        if (!window.confirm('Are you sure you want to delete the payment QR code?')) return;

        setQrUploading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/settings/upi-qr`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'QR code deleted successfully!' });
                setQrPreviewUrl(null);
                setQrCode(null);
            } else {
                setMessage({ type: 'error', text: data.message || 'Delete failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setQrUploading(false);
        }
    };

    if (currentUser && currentUser.role !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Access Denied</h2>
                <p className="text-gray-600 mt-2 font-medium">Only Super Administrators have access to Logo Management.</p>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-green-600 rounded-xl shadow-lg shadow-green-100">
                        <ImageIcon className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Logo Management</h1>
                        <p className="text-sm text-gray-500 font-medium">Manage company branding and report headers</p>
                    </div>
                </div>

                {/* Transport Info Banner */}
                {transport ? (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                        <Building2 size={20} className="text-blue-500 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Managing Logo For</p>
                            <p className="text-sm font-bold text-blue-900">{transport.transport_name} <span className="text-blue-500 font-normal">({transport.transport_code})</span></p>
                        </div>
                    </div>
                ) : !transportId ? (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                        <AlertCircle size={20} className="text-amber-500 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-amber-800">No transport company linked to your account</p>
                            <p className="text-xs text-amber-600 mt-0.5">Ask a superadmin to assign your account to a transport company, or this will update the global logo.</p>
                        </div>
                    </div>
                ) : null}

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
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
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">This logo appears on GC prints, reports, and the app header</p>
                    </div>

                    <div className="p-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={32} className="animate-spin text-green-500" />
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center gap-12">
                                {/* Logo Preview */}
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
                                        {previewUrl && !logo && (
                                            <button
                                                onClick={handleDelete}
                                                className="absolute -top-3 -right-3 p-2 bg-white text-red-500 rounded-full shadow-lg border border-red-50 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                                title="Remove Logo"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {previewUrl && (
                                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-3">Current Logo</p>
                                    )}
                                </div>

                                {/* Upload Controls */}
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-4">
                                        <label className="block p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-white hover:border-green-400 transition-all group">
                                            <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/gif" onChange={handleFileChange} />
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                                    <Upload size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-700">Choose New Logo</p>
                                                    <p className="text-xs text-gray-400 font-medium">PNG, JPG, SVG, GIF up to 2MB</p>
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
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <Upload size={20} className="text-blue-600" />
                            PAYMENT QR CODE (UPI)
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">This QR appears on GC copies for direct customer payments</p>
                    </div>

                    <div className="p-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center gap-12">
                                {/* QR Preview */}
                                <div className="flex-shrink-0">
                                    <div className="relative group">
                                        <div className="w-48 h-48 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                            {qrPreviewUrl ? (
                                                <img src={qrPreviewUrl} alt="QR Preview" className="w-full h-full object-contain p-4" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <Loader2 size={48} className="text-gray-300 mx-auto mb-2" />
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No QR Set</p>
                                                </div>
                                            )}
                                        </div>
                                        {qrPreviewUrl && !qrCode && (
                                            <button
                                                onClick={handleQRDelete}
                                                className="absolute -top-3 -right-3 p-2 bg-white text-red-500 rounded-full shadow-lg border border-red-50 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                                title="Remove QR"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {qrPreviewUrl && (
                                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-3">Current Payment QR</p>
                                    )}
                                </div>

                                {/* Upload Controls */}
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-4">
                                        <label className="block p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-white hover:border-blue-400 transition-all group">
                                            <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleQRChange} />
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <Upload size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-700">Choose New QR Code</p>
                                                    <p className="text-xs text-gray-400 font-medium">PNG, JPG or SVG up to 2MB</p>
                                                </div>
                                            </div>
                                        </label>

                                        {qrCode && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                <CheckCircle2 size={16} className="text-blue-600" />
                                                <p className="text-xs font-bold text-blue-700">QR selected: {qrCode.name}</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleQRUpload}
                                        disabled={!qrCode || qrUploading}
                                        className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {qrUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                        {qrUploading ? 'UPLOADING...' : 'SAVE PAYMENT QR'}
                                    </button>
                                </div>
                            </div>
                        )}
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
