import React, { useState } from 'react';
import { Search, MapPin, Calendar, Clock, CheckCircle2, AlertCircle, Upload, FileText, Camera } from 'lucide-react';

const UpdateDelivery = () => {
    const [gcNumber, setGcNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deliveryData, setDeliveryData] = useState(null);
    const [status, setStatus] = useState('Arrived at Destination');
    const [remarks, setRemarks] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [proofFile, setProofFile] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });


    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDeliveryData(null);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`http://localhost:8000/api/v1/waybills/search/${gcNumber}`);
            const data = await response.json();

            if (data.success) {
                setDeliveryData(data.data);
                setStatus(data.data.status || 'Arrived at Destination');
                setRemarks(data.data.remarks || '');
                setReceiverName(data.data.receiver_name || '');
            } else {

                setMessage({ type: 'error', text: data.message || 'GC not found' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofFile(file);
            setMessage({ type: '', text: '' });
        }
    };



    const handleUpdate = async () => {
        if (!proofFile) {
            setMessage({ type: 'error', text: 'Please upload/scan proof document first' });
            return;
        }

        const adminInfo = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('admin'));
        setUpdating(true);

        const formData = new FormData();
        formData.append('gc_number', gcNumber);
        formData.append('status', status);
        formData.append('remarks', remarks);
        formData.append('receiver_name', status === 'Delivered' ? receiverName : '');
        formData.append('delivery_proof', proofFile);

        if (status === 'Delivered' && adminInfo) {
            formData.append('delivered_branch_id', adminInfo.branch_id || '');
            formData.append('delivered_branch_name', adminInfo.branch_name || '');
        }



        try {
            const response = await fetch('http://localhost:8000/api/v1/waybills/update-delivery-status', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Delivery status updated successfully' });
                // Refresh data
                setDeliveryData(data.data);
                setProofFile(null);
            } else {
                setMessage({ type: 'error', text: data.message || 'Update failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-green-600" />
                    Update Delivery Status
                </h1>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={gcNumber}
                                onChange={(e) => setGcNumber(e.target.value)}
                                placeholder="Enter GC Number (e.g., GC-12345)"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search GC'}
                        </button>
                    </form>
                </div>

                {deliveryData && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                            <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-white font-bold text-lg">GC Details: {deliveryData.gc_number}</h2>
                                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-sm">
                                    {deliveryData.status}
                                </span>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Booking Date</p>
                                            <p className="text-gray-800 font-medium">{deliveryData.bill_date}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Route</p>
                                            <p className="text-gray-800 font-medium">{deliveryData.origin_branch?.branch_name} → {deliveryData.destination?.city_name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Consignor</p>
                                        <p className="text-gray-800 font-medium">{deliveryData.consignor?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Consignee</p>
                                        <p className="text-gray-800 font-medium">{deliveryData.consignee?.name}</p>
                                    </div>
                                </div>

                            </div>

                            <div className="px-6 pb-6 space-y-6">
                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider underline decoration-green-500 underline-offset-4">1. Proof Document (Required)</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="proof-upload"
                                            />
                                            <label
                                                htmlFor="proof-upload"
                                                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${proofFile ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-green-400 group-hover:bg-white'}`}
                                            >
                                                <div className={`p-3 rounded-full mb-3 ${proofFile ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-sm font-bold text-gray-700">{proofFile ? proofFile.name : 'Upload Scanned Proof'}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">PDF, JPG, PNG</p>
                                            </label>


                                        </div>

                                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl hover:border-blue-400 hover:bg-white transition-all cursor-pointer group">
                                            <div className="p-3 bg-gray-200 text-gray-500 rounded-full mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                <Camera size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-700">Scan Document</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">Use Connected Scanner</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider underline decoration-green-500 underline-offset-4">2. Update Delivery Information</h3>
                                    <div className={`grid grid-cols-1 ${status === 'Delivered' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 font-black">Status</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                            >
                                                <option>Arrived at Destination</option>
                                                <option>Out for Delivery</option>
                                                <option>Delivered</option>
                                                <option>RTO (Return to Origin)</option>
                                                <option>Redirected</option>
                                            </select>
                                        </div>
                                        {status === 'Delivered' && (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 font-black">Receiver Name</label>
                                                <input
                                                    type="text"
                                                    value={receiverName}
                                                    onChange={(e) => setReceiverName(e.target.value)}
                                                    placeholder="Enter receiver name..."
                                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 font-black">
                                                {status === 'RTO (Return to Origin)' ? 'RTO Reason' : 'Remarks'}
                                            </label>
                                            <input
                                                type="text"
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder={status === 'RTO (Return to Origin)' ? "Enter RTO reason..." : "Enter remarks..."}
                                                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                            />
                                        </div>
                                    </div>


                                    <div className="mt-8 flex justify-end">
                                        <button
                                            onClick={handleUpdate}
                                            disabled={!proofFile || updating}
                                            className={`px-10 py-3 text-white font-black rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2 uppercase tracking-wider text-sm ${proofFile ? 'bg-green-600 shadow-green-200 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                        >
                                            {updating ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={18} />
                                                    Update Delivery Status
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!deliveryData && !loading && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="inline-flex p-4 bg-gray-50 rounded-full text-gray-400 mb-4">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-600 uppercase tracking-widest">No GC Selected</h3>
                        <p className="text-gray-400 text-sm font-medium">Search for a GC number to update its delivery status.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdateDelivery;

