import React, { useState, useEffect } from 'react';
import { QrCode, Upload, Trash2, CheckCircle2, AlertCircle, Loader2, Save, CreditCard } from 'lucide-react';
import { API_BASE_URL, STORAGE_URL } from '../config/api';

const ManageUPI = () => {
    const [upiDetails, setUpiDetails] = useState({ upi_id: '', account_holder: '' });
    const [qrFile, setQrFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updatingDetails, setUpdatingDetails] = useState(false);
    const [uploadingQR, setUploadingQR] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [currentUser, setCurrentUser] = useState(null)
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
        fetchUPISettings();
    }, []);

    // Auto-hide success messages
    useEffect(() => {
        if (message.text && message.type === 'success') {
            const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const PopupMessage = () => {
        if (!message.text) return null;

        const isError = message.type === 'error';
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border-2 ${isError ? 'border-red-100' : 'border-green-100'}`}>
                    <div className={`p-8 text-center space-y-4 ${isError ? 'bg-red-50/50' : 'bg-green-50/50'}`}>
                        <div className="flex justify-center">
                            <div className={`p-4 rounded-full ${isError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {isError ? <AlertCircle size={40} /> : <CheckCircle2 size={40} />}
                            </div>
                        </div>
                        <h2 className={`text-2xl font-black ${isError ? 'text-red-900' : 'text-green-900'}`}>
                            {isError ? 'Oops!' : 'Success!'}
                        </h2>
                        <p className="text-gray-600 text-sm font-bold leading-relaxed px-4">{message.text}</p>
                    </div>
                    <div className="p-4 bg-white">
                        <button
                            onClick={() => setMessage({ type: '', text: '' })}
                            className={`w-full py-3.5 rounded-xl text-white text-xs font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest ${isError ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-green-600 shadow-green-100 hover:bg-green-700'}`}
                        >
                            {isError ? 'TRY AGAIN' : 'CONTINUE'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        fetchUPISettings();
    }, []);

    const fetchUPISettings = async () => {
        setLoading(true);
        try {
            const [idResp, holderResp, qrResp] = await Promise.all([
                fetch(`${API_BASE_URL}/settings/upi_id`),
                fetch(`${API_BASE_URL}/settings/upi_account_holder`),
                fetch(`${API_BASE_URL}/settings/upi_qr_path`)
            ]);

            const idData = await idResp.json();
            const holderData = await holderResp.json();
            const qrData = await qrResp.json();

            const user = JSON.parse(localStorage.getItem('user'));
            setUpiDetails({
                upi_id: idData.data || '',
                account_holder: holderData.data || (user?.transport_name || '')
            });

            if (qrData.success && qrData.data) {
                setPreviewUrl(`${STORAGE_URL}/${qrData.data}`);
            }
        } catch (error) {
            console.error('Error fetching UPI settings:', error);
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
            setQrFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSaveDetails = async () => {
        if (!upiDetails.upi_id) {
            setMessage({ type: 'error', text: 'UPI ID is required' });
            return;
        }

        setUpdatingDetails(true);
        try {
            const response = await fetch(`${API_BASE_URL}/settings/upi-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(upiDetails),
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'UPI details updated successfully!' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Update failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setUpdatingDetails(false);
        }
    };

    const handleUploadQR = async () => {
        if (!qrFile) {
            setMessage({ type: 'error', text: 'Please select a QR code image first' });
            return;
        }

        setUploadingQR(true);
        const formData = new FormData();
        formData.append('qr_code', qrFile);

        try {
            const response = await fetch(`${API_BASE_URL}/settings/upi-qr`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'QR code uploaded successfully!' });
                setQrFile(null);
                if (data.data && data.data.path) {
                    setPreviewUrl(`${STORAGE_URL}/${data.data.path}`);
                }
            } else {
                setMessage({ type: 'error', text: data.message || 'Upload failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setUploadingQR(false);
        }
    };

    const handleDeleteQR = async () => {
        if (!window.confirm('Are you sure you want to delete the QR code?')) return;

        setUploadingQR(true);
        try {
            const response = await fetch(`${API_BASE_URL}/settings/upi-qr`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'QR code deleted successfully!' });
                setPreviewUrl(null);
                setQrFile(null);
            } else {
                setMessage({ type: 'error', text: data.message || 'Delete failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setUploadingQR(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (currentUser && currentUser.role !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Access Denied</h2>
                <p className="text-gray-600 mt-2 font-medium">Only Super Administrators have access to UPI Management.</p>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <PopupMessage />
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
                        <QrCode className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">UPI & QR Management</h1>
                        <p className="text-sm text-gray-500 font-medium">Manage digital payment collection settings</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* UPI Box */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <CreditCard size={20} className="text-blue-600" />
                                UPI DETAILS
                            </h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configure your UPI ID</p>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">UPI ID (VPA)</label>
                                <input
                                    type="text"
                                    value={upiDetails.upi_id}
                                    onChange={(e) => setUpiDetails({ ...upiDetails, upi_id: e.target.value })}
                                    placeholder="e.g. business@okaxis"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Account Holder Name</label>
                                <input
                                    type="text"
                                    value={upiDetails.account_holder}
                                    onChange={(e) => setUpiDetails({ ...upiDetails, account_holder: e.target.value })}
                                    placeholder="e.g. Agency Name"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-gray-700"
                                />
                            </div>
                            <button
                                onClick={handleSaveDetails}
                                disabled={updatingDetails}
                                className="w-full mt-4 py-3.5 bg-gray-900 text-white font-black rounded-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
                            >
                                {updatingDetails ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                SAVE UPI DETAILS
                            </button>
                        </div>
                    </div>

                    {/* QR Box */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <QrCode size={20} className="text-blue-600" />
                                PAYMENT QR CODE
                            </h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage payment QR image</p>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-6">
                            <div className="relative group self-center">
                                <div className="w-48 h-48 bg-gray-50 rounded-3xl border-4 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="QR Preview" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <QrCode size={48} className="text-gray-200 mx-auto mb-2" />
                                            <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest text-center">No QR Code Image</p>
                                        </div>
                                    )}
                                </div>
                                {previewUrl && (
                                    <button
                                        onClick={handleDeleteQR}
                                        className="absolute -top-3 -right-3 p-2 bg-white text-red-500 rounded-full shadow-lg border border-red-50 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="w-full space-y-4">
                                <label className="block p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-white hover:border-blue-400 transition-all group">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Upload size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-700">Choose QR Image</p>
                                            <p className="text-[10px] text-gray-400 font-medium">PNG, JPG up to 2MB</p>
                                        </div>
                                    </div>
                                </label>

                                <button
                                    onClick={handleUploadQR}
                                    disabled={!qrFile || uploadingQR}
                                    className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploadingQR ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                    {uploadingQR ? 'UPLOADING...' : 'UPLOAD NEW QR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex gap-4">
                        <div className="p-3 bg-white rounded-xl text-blue-600 flex-shrink-0 self-start">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-blue-900 uppercase text-sm">How it works?</h4>
                            <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                                The UPI ID and QR code you configure here will be displayed to your staff and customers during the payment process in segments like <strong>Update Delivery</strong> and <strong>Receive Payment</strong>. Ensure the QR code is clear and the UPI ID is correct to avoid payment issues.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageUPI;
