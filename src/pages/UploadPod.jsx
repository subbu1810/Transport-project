import React, { useState } from 'react';
import {
    Search, Upload, FileCheck2, AlertCircle, CheckCircle2,
    ImagePlus, X, Eye, FileText, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const UploadPod = () => {
    const [gcNumber, setGcNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [waybillData, setWaybillData] = useState(null);
    const [searchMessage, setSearchMessage] = useState({ type: '', text: '' });

    const [podFile, setPodFile] = useState(null);
    const [podPreview, setPodPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!gcNumber.trim()) return;

        setLoading(true);
        setWaybillData(null);
        setSearchMessage({ type: '', text: '' });
        setPodFile(null);
        setPodPreview(null);
        setUploadMessage({ type: '', text: '' });
        setUploadSuccess(false);

        try {
            const res = await axios.get(`${API_BASE_URL}/waybills/search/${gcNumber.trim()}`);
            if (res.data.success) {
                setWaybillData(res.data.data);
            } else {
                setSearchMessage({ type: 'error', text: res.data.message || 'GC not found.' });
            }
        } catch {
            setSearchMessage({ type: 'error', text: 'Failed to fetch GC. Please check the GC number and try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPodFile(file);
        setUploadMessage({ type: '', text: '' });
        setUploadSuccess(false);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setPodPreview({ type: 'image', url: reader.result });
            reader.readAsDataURL(file);
        } else {
            setPodPreview({ type: 'pdf', name: file.name });
        }
    };

    const handleRemoveFile = () => {
        setPodFile(null);
        setPodPreview(null);
        setUploadMessage({ type: '', text: '' });
    };

    const handleUpload = async () => {
        if (!podFile || !waybillData) return;
        setUploading(true);
        setUploadMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('pod_file', podFile);

            const res = await axios.post(
                `${API_BASE_URL}/waybills/${waybillData.id}/upload-pod`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (res.data.success) {
                setUploadSuccess(true);
                setUploadMessage({ type: 'success', text: 'POD uploaded successfully for GC ' + waybillData.gc_number });
                setWaybillData(prev => ({ ...prev, pod_file: res.data.data?.pod_file || prev.pod_file }));
                setPodFile(null);
                setPodPreview(null);
            } else {
                setUploadMessage({ type: 'error', text: res.data.message || 'Upload failed. Please try again.' });
            }
        } catch (err) {
            setUploadMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed. Check file size (max 5MB) and format.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-xl">
                    <ImagePlus className="text-indigo-600" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Upload POD</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Proof of Delivery - Upload signed receipt for any delivered GC
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
                <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0 mt-0.5">
                    <AlertCircle size={16} className="text-indigo-600" />
                </div>
                <div>
                    <p className="text-xs font-black text-indigo-800 uppercase tracking-wide mb-1">What is POD?</p>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                        Proof of Delivery (POD) is the signed document confirming that the consignee received the goods.
                        You can upload it at any time after the delivery is recorded — even days later.
                        Accepted formats: <strong>JPG, PNG, PDF</strong> (max 5MB).
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={gcNumber}
                            onChange={(e) => setGcNumber(e.target.value)}
                            placeholder="Enter GC Number to search..."
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none transition-all font-medium text-gray-700 text-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center gap-2 uppercase tracking-wider"
                    >
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Searching</>
                        ) : (
                            <><Search size={16} />Search GC</>
                        )}
                    </button>
                </form>

                {searchMessage.text && (
                    <div className={`mt-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold ${
                        searchMessage.type === 'error'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                        {searchMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        {searchMessage.text}
                    </div>
                )}
            </div>

            {/* GC Info + Upload Section */}
            {waybillData && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
                    {/* GC Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-white font-black text-lg tracking-tight">{waybillData.gc_number}</p>
                                <p className="text-indigo-100 text-xs font-medium">{waybillData.consignor?.name} to {waybillData.consignee?.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {(waybillData.pod_file || uploadSuccess) && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg">
                                        <FileCheck2 size={12} /> POD On File
                                    </span>
                                )}
                                <span className={`px-3 py-1.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                                    (waybillData.status || '').toUpperCase() === 'DELIVERED'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {waybillData.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b border-gray-100">
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Booking Date</p>
                                <p className="font-bold text-gray-700">{waybillData.bill_date || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">From</p>
                                <p className="font-bold text-gray-700">{waybillData.origin_branch?.branch_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">To</p>
                                <p className="font-bold text-gray-700">{waybillData.destination?.city_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Delivered On</p>
                                <p className="font-bold text-gray-700">{waybillData.delivered_at ? new Date(waybillData.delivered_at).toLocaleDateString('en-IN') : 'Not Delivered Yet'}</p>
                            </div>
                        </div>

                        {/* Upload Area */}
                        <div className="p-6">
                            {uploadMessage.text && (
                                <div className={`mb-5 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold ${
                                    uploadMessage.type === 'success'
                                        ? 'bg-green-50 text-green-700 border-2 border-green-200'
                                        : 'bg-red-50 text-red-600 border-2 border-red-200'
                                }`}>
                                    {uploadMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    {uploadMessage.text}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* File Picker */}
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Select POD Document
                                    </label>

                                    {!podFile ? (
                                        <label
                                            htmlFor="pod-file-input"
                                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50/50 group"
                                        >
                                            <div className="p-3 bg-indigo-100 rounded-full mb-3 group-hover:bg-indigo-200 transition-colors">
                                                <Upload size={24} className="text-indigo-600" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-700 text-center">Click to Select POD File</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">PDF, JPG, PNG - Max 5MB</p>
                                            <input
                                                id="pod-file-input"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    ) : (
                                        <div className="border-2 border-indigo-400 bg-indigo-50 rounded-xl p-4">
                                            {podPreview?.type === 'image' ? (
                                                <div className="relative">
                                                    <img
                                                        src={podPreview.url}
                                                        alt="POD Preview"
                                                        className="w-full max-h-48 object-contain rounded-lg"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-200">
                                                    <FileText size={32} className="text-red-500 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-800 truncate">{podFile.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{(podFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="text-xs text-indigo-700 font-bold truncate max-w-[70%]">{podFile.name}</span>
                                                <button
                                                    onClick={handleRemoveFile}
                                                    className="flex items-center gap-1 text-xs text-red-500 font-bold hover:text-red-700 transition-colors"
                                                >
                                                    <X size={14} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Upload Action */}
                                <div className="flex flex-col justify-between gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Upload Guidelines</p>
                                        <ul className="space-y-2 text-xs text-gray-600">
                                            <li className="flex items-start gap-2">
                                                <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">1</span>
                                                Ensure the document is the <strong>signed receipt</strong> from the consignee.
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">2</span>
                                                Image must be <strong>clear and readable</strong>.
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">3</span>
                                                Max file size: <strong>5 MB</strong>.
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">4</span>
                                                You can re-upload to <strong>replace</strong> an existing POD.
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        onClick={handleUpload}
                                        disabled={!podFile || uploading}
                                        className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                                            podFile && !uploading
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                        }`}
                                    >
                                        {uploading ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading POD...</>
                                        ) : (
                                            <><ImagePlus size={18} />Upload POD</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!waybillData && !loading && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="inline-flex p-5 bg-indigo-50 rounded-full text-indigo-300 mb-4">
                        <ImageIcon size={44} />
                    </div>
                    <h3 className="text-lg font-black text-gray-500 uppercase tracking-widest mb-2">No GC Selected</h3>
                    <p className="text-gray-400 text-sm font-medium max-w-xs mx-auto">
                        Search for a GC number above to upload its Proof of Delivery document.
                    </p>
                </div>
            )}
        </div>
    );
};

export default UploadPod;
