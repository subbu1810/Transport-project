import React from 'react';

const GCTrackReceipt = ({ waybill, companyDetails, branches = [], currentUser, storageUrl, onlyContent = false }) => {
    if (!waybill) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN');
    };

    const getInitials = (name) => {
        if (!name) return 'TL';
        return name
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 3);
    };

    const getFullStorageUrl = (path, type = 'logo') => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        // Strip leading slash
        const cleanPath = path.replace(/^\/+/, '');

        // If path already contains a directory (like 'logos/' or 'qr_codes/'), don't prepend again
        if (cleanPath.includes('/')) {
            return `${storageUrl || ''}/${cleanPath}`;
        }

        // Determine folder based on type
        const folder = type === 'qr' ? 'qr_codes' : 'logos';
        return `${storageUrl || ''}/${folder}/${cleanPath}`;
    };

    const [imgErrors, setImgErrors] = React.useState({});
    const handleImgError = (key) => setImgErrors(prev => ({ ...prev, [key]: true }));

    // Calculate totals to ensure we have numbers
    const ddCharges = parseFloat(waybill.dd_charges || waybill.dd || 0);
    const handlingCharges = parseFloat(waybill.handling_charges || waybill.handling || 0);
    const stationaryCharges = parseFloat(waybill.stationary_charges || waybill.stationary || 0);
    const totalAmount = parseFloat(waybill.total_amount || waybill.total || 0);

    // Fallback: If freight header is 0 but total is present, use total as freight for display
    const freightAmount = parseFloat(waybill.freight_amount || waybill.freight || 0) || totalAmount;
    const gstAmount = parseFloat(waybill.gst_amount || waybill.gst || 0);
    const grandTotal = parseFloat(waybill.grand_total || waybill.total_amount || 0);

    return (
        <div className="receipt-container">
            {[1, 2, 3].map((copyNum) => {
                const isAccountOrPaid = waybill.account_type?.toUpperCase() === 'ACCOUNT' || waybill.account_type?.toUpperCase() === 'PAID';
                const hideAmounts = isAccountOrPaid && (copyNum === 1 || copyNum === 2);

                return (
                    <div key={copyNum} className={`receipt-copy ${onlyContent ? 'mb-0' : 'mb-[4mm]'}`} style={{
                        ...(onlyContent && copyNum === 2 ? { marginTop: '0.6cm' } : {}),
                        ...(onlyContent && copyNum === 3 ? { marginTop: '1.6cm' } : {}),
                    }}>
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-2 border-red-800 pb-0.5 mb-0.5 bg-gradient-to-r from-red-50/10 to-transparent">
                            <div className="flex flex-col items-start min-w-[60px]">
                                <div className="border-2 border-red-800 p-0.5 rounded bg-white shadow-sm flex items-center justify-center">
                                    <div className="w-16 h-16 flex-shrink-0 bg-gray-50 flex items-center justify-center relative border border-gray-100 rounded-sm overflow-hidden">
                                        {companyDetails?.upi_qr_path && !imgErrors[`qr_${copyNum}`] ? (
                                            <img
                                                src={getFullStorageUrl(companyDetails.upi_qr_path, 'qr')}
                                                alt="QR"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    console.error("QR Load Failed:", e.target.src);
                                                    handleImgError(`qr_${copyNum}`);
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="text-[11px] font-black text-red-800 leading-none mb-1">
                                                    {getInitials(companyDetails?.company_name || waybill.origin_branch?.branch_name)}
                                                </div>
                                                <div className="text-[6px] font-bold text-gray-400 uppercase">SCAN TO PAY</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center flex-1 mx-1 px-1 border-x border-red-100 flex flex-col justify-center">
                                <h1 className="text-xl font-black text-red-800 uppercase tracking-tighter leading-none mb-0.5 drop-shadow-sm">
                                    {companyDetails?.company_name || companyDetails?.name || waybill.origin_branch?.branch_name || 'Transport Logistics'}
                                </h1>
                                <p className="text-[8px] font-bold text-gray-600 leading-tight mt-0.5 max-w-[350px] mx-auto uppercase text-center">
                                    {companyDetails?.address}
                                    {companyDetails?.phone && ` | PH: ${companyDetails.phone}`}
                                    {companyDetails?.mobile && ` | MOB: ${companyDetails.mobile}`}
                                </p>
                                <div className="flex justify-center gap-x-3 text-[7px] font-black text-red-800/80 uppercase tracking-tighter mt-0">
                                    {companyDetails?.email && <span className="truncate max-w-[120px] lowercase pointer-events-none" style={{ textDecoration: 'none', color: 'inherit' }}>{companyDetails.email.toLowerCase()}</span>}
                                    {(companyDetails?.gstin || companyDetails?.gst_number) && <span>GST: {companyDetails.gstin || companyDetails.gst_number}</span>}
                                </div>
                                <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-0.5">
                                    {branches.map((br, i) => (
                                        <div key={i} className="flex items-center gap-0.5 bg-red-50/30 px-1 rounded-sm border border-red-100/50">
                                            <span className="text-[6px] font-black text-red-800 uppercase leading-none">{br.branch_name}:</span>
                                            <span className="text-[6.5px] font-bold text-black leading-none">{br.phone || 'N/A'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-right text-[10px] font-black text-red-800 flex flex-col items-end pt-0.5 min-w-[100px]">
                                <span className="text-[10px] font-black italic mb-1 uppercase opacity-90">
                                    {copyNum === 1 ? 'CONSIGNOR COPY' : copyNum === 2 ? 'CONSIGNEE COPY' : 'OFFICE COPY'}
                                </span>
                                {(companyDetails?.logo_path || companyDetails?.logo) && !imgErrors[`logo_${copyNum}`] ? (
                                    <div className="w-14 h-14 border border-red-100 rounded p-0.5 bg-white shadow-sm ring-1 ring-red-50 overflow-hidden">
                                        <img
                                            src={getFullStorageUrl(companyDetails.logo_path || companyDetails.logo)}
                                            alt="Logo"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                console.error("Logo Load Failed URL:", e.target.src);
                                                handleImgError(`logo_${copyNum}`);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 border border-dashed border-gray-200 rounded flex flex-col items-center justify-center bg-gray-50">
                                        <div className="text-[10px] font-black text-gray-300">
                                            {getInitials(companyDetails?.company_name || waybill.origin_branch?.branch_name)}
                                        </div>
                                        <span className="text-[6px] font-black text-gray-300 uppercase">LOGO</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* GC Details Grid */}
                        <div className="details-table">
                            <table className="w-full text-[9px] font-bold border-t border-b border-red-800">
                                <tbody>
                                    <tr>
                                        <td className="w-1/6 py-0.25">GC No:</td>
                                        <td className="w-1/3 text-red-700 font-black">{waybill.gc_number}</td>
                                        <td className="w-1/6">Date:</td>
                                        <td className="w-1/3">{formatDate(waybill.bill_date)}</td>
                                    </tr>
                                    <tr className="border-t border-red-50">
                                        <td className="py-0.25">Consignor:</td>
                                        <td className="pr-1">
                                            <div className="leading-tight flex flex-wrap items-center gap-1">
                                                <span>{waybill.consignor?.name}</span>
                                                {waybill.consignor?.gst_number && (
                                                    <span className="text-[6.5px] font-black text-red-800 bg-red-100 rounded px-1 tracking-tighter border border-red-200 uppercase">
                                                        GST: {waybill.consignor.gst_number}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[7px] font-medium text-black opacity-80">Ph: {waybill.consignor?.mobile_no || waybill.consignor?.mobile_number || waybill.consignor?.phone || waybill.consignor?.land_no || '-'}</div>
                                        </td>
                                        <td className="py-0.25">Consignee:</td>
                                        <td>
                                            <div className="leading-tight flex flex-wrap items-center gap-1">
                                                <span>{waybill.consignee?.name}</span>
                                                {waybill.consignee?.gst_number && (
                                                    <span className="text-[6.5px] font-black text-red-800 bg-red-100 rounded px-1 tracking-tighter border border-red-200 uppercase">
                                                        GST: {waybill.consignee.gst_number}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[7px] font-medium text-black opacity-80">Ph: {waybill.consignee?.mobile_number || waybill.consignee?.phone || waybill.consignee?.mobile_no || '-'}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-0.25 align-top">Address:</td>
                                        <td className="pr-1 text-[7px] font-bold leading-tight opacity-90 line-clamp-2">{waybill.consignor?.address}</td>
                                        <td className="py-0.25 align-top">Address:</td>
                                        <td className="text-[7px] font-bold leading-tight opacity-90 line-clamp-2">{waybill.consignee?.address}</td>
                                    </tr>
                                    <tr className="border-t border-red-50">
                                        <td className="py-0.25">From:</td>
                                        <td>{waybill.origin_branch?.branch_name || 'ORIGIN'}</td>
                                        <td className="py-0.25 text-black">To:</td>
                                        <td>{waybill.destination?.city_name}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-0.25">Inv No:</td>
                                        <td>{waybill.invoice_no || '-'}</td>
                                        <td className="py-0.25">Payable:</td>
                                        <td className="uppercase">{waybill.tax_payable_by}</td>
                                    </tr>
                                    <tr className="border-t border-red-50">
                                        <td className="py-0.25">Frght Type:</td>
                                        <td className="font-black text-red-800 uppercase">{waybill.account_type || 'PAID'}</td>
                                        <td className="py-0.25"></td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Articles Table */}
                        <table className="w-full mt-0.5 border-collapse text-[9.5px] font-bold">
                            <thead>
                                <tr className="bg-gray-50 border-b border-red-800 text-red-800">
                                    <th className="text-left py-0.5">Article Type</th>
                                    <th className="text-right py-0.5">Qty</th>
                                    <th className="text-right py-0.5">W/Kg</th>
                                    <th className="text-right py-0.5">Rate</th>
                                    {!hideAmounts && (
                                        <>
                                            <th className="text-right py-0.5">Total</th>
                                            <th className="text-right py-0.5">DD.Tot</th>
                                            <th className="text-right py-0.5">H.Tot</th>
                                            <th className="text-right py-0.5">Freight</th>
                                            <th className="text-right py-0.5">Amount</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {waybill.articles?.map((art, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                                        <td className="py-0.5">{art.article_type}</td>
                                        <td className="text-right py-0.5">{art.no_of_articles}</td>
                                        <td className="text-right py-0.5">{parseFloat(art.charged_weight || 0).toFixed(2)}</td>
                                        <td className="text-right py-0.5">{parseFloat(art.freight || art.rate || 0).toFixed(2)}</td>
                                        {!hideAmounts && (
                                            <>
                                                <td className="text-right py-0.5">{parseFloat(art.total || 0).toFixed(2)}</td>
                                                <td className="text-right py-0.5">{parseFloat(art.dd_total || 0).toFixed(2)}</td>
                                                <td className="text-right py-0.5">{parseFloat(art.handling_total || 0).toFixed(2)}</td>
                                                <td className="text-right py-0.5">{parseFloat(art.freight || 0).toFixed(2)}</td>
                                                <td className="text-right py-0.5">{parseFloat(art.amount || 0).toFixed(2)}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {waybill.article_desc && (
                            <div className="mt-0.25 px-0.5 py-0.25 bg-gray-50/30 text-[8.5px] border-l-2 border-red-200">
                                <span className="font-black text-red-800 uppercase mr-1">DESC:</span>
                                <span className="text-black italic">{waybill.article_desc}</span>
                            </div>
                        )}

                        {/* Totals Section */}
                        {!hideAmounts ? (
                            <div className="flex justify-end mt-0.25 pt-0.25 border-t border-red-50">
                                <div className="w-[45%] text-[7px] font-black text-red-800 flex flex-col gap-0 p-0.25 bg-red-50/20 rounded border border-red-100/50 leading-none">
                                    <div className="flex justify-between border-b border-red-100/50 pb-0.25">
                                        <span>FREIGHT:</span>
                                        <span>₹{freightAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-red-100/50 py-0.25">
                                        <span>DD CHARGES:</span>
                                        <span>₹{ddCharges.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-red-100/50 py-0.25">
                                        <span>STATIONARY:</span>
                                        <span>₹{stationaryCharges.toFixed(2)}</span>
                                    </div>
                                    {handlingCharges > 0 && (
                                        <div className="flex justify-between border-b border-red-100/50 py-0.25">
                                            <span>HANDLING:</span>
                                            <span>₹{handlingCharges.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-b border-red-100/50 text-red-900 font-bold bg-red-100/30 px-0.5 py-0.25">
                                        <span>SUB TOTAL:</span>
                                        <span>₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                    {gstAmount > 0 && (
                                        <div className="flex justify-between border-b border-red-100/50 py-0.25">
                                            <span>GST ({waybill.gst_percent}%):</span>
                                            <span>₹{gstAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-red-900 text-[9px] font-black mt-0.25 border-t border-red-200/50 pt-0.25">
                                        <span>TOTAL:</span>
                                        <span>₹{grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-0.5 pt-0.5 border-t border-red-50 flex items-center justify-center p-2 bg-red-50/10 rounded">
                                <span className="text-[10px] font-black text-red-800/60 uppercase tracking-widest text-center">
                                    {waybill.account_type?.toUpperCase() === 'PAID' ? 'FREIGHT PAID' : 'TO BE BILLED ON ACCOUNT'}
                                </span>
                            </div>
                        )}

                        <div className="receipt-signatures mt-auto" style={{ display: 'block', marginBottom: '0', marginLeft: '1%', marginRight: '1%', padding: '0', width: '98%' }}>
                            <div className="border-b border-red-800 bg-white">
                                <div className="flex border-b border-red-800">
                                    {/* Receiver Sign Section */}
                                    <div className="flex-1 p-0.25 min-h-[22px] flex flex-col justify-between items-center bg-white">
                                        <p className="text-[6.5px] font-bold text-gray-700 italic leading-none">Received materials in good condition</p>
                                        <p className="text-[7.5px] font-black text-red-800 uppercase tracking-tight text-center mt-auto">Receiver's Signature</p>
                                    </div>

                                    {/* Barcode Section */}
                                    <div className="w-[25%] p-0.5 flex items-center justify-center bg-gray-50/10">
                                        <img
                                            src={`https://barcode.tec-it.com/barcode.ashx?data=${waybill.gc_number}&code=Code128&translate-esc=on&imagetype=Png&height=30&modulewidth=1.1&humanreadable=0`}
                                            alt="Barcode"
                                            className="h-6 w-auto object-contain mix-blend-multiply"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>

                                    {/* Booking Clerk Section */}
                                    <div className="w-[28%] p-0.25 flex flex-col items-center justify-center min-h-[22px] bg-white">
                                        <div className="text-[7.5px] font-black text-black border-b border-gray-400 w-full text-center leading-none pb-0.5 mb-0.5">
                                            {(waybill.booking_clerk || currentUser?.full_name || currentUser?.name || currentUser?.username || 'ADMIN').toUpperCase()}
                                        </div>
                                        <p className="text-[7px] font-black text-gray-800 uppercase">Booking Clerk</p>
                                    </div>
                                </div>
                                {/* Footer Note Section */}
                                <div className="px-2 py-0 bg-white text-center border-t border-red-50">
                                    <p className="text-[7px] font-[1000] text-red-700 leading-tight uppercase tracking-tighter">
                                        Note: 1. We are not responsible for Damage, Leakage of goods. 2. Unloading by party. 3. Booked at owner's risk.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GCTrackReceipt;
