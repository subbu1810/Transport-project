import React from 'react';

const GCEntryReceipt = ({ waybill, companyDetails, branches = [], currentUser, storageUrl, onlyContent = false }) => {
    if (!waybill) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN');
    };

    const getFullStorageUrl = (path, type = 'logo') => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/^\/+/, '');
        if (cleanPath.includes('/')) {
            return `${storageUrl || ''}/${cleanPath}`;
        }
        const folder = type === 'qr' ? 'qr_codes' : 'logos';
        return `${storageUrl || ''}/${folder}/${cleanPath}`;
    };

    const [imgErrors, setImgErrors] = React.useState({});
    const handleImgError = (key) => setImgErrors(prev => ({ ...prev, [key]: true }));

    const ddCharges       = parseFloat(waybill.dd_charges       || waybill.dd       || 0);
    const handlingCharges = parseFloat(waybill.handling_charges  || waybill.handling  || 0);
    const stationaryCharges = parseFloat(waybill.stationary_charges || waybill.stationary || 0);
    const totalAmount     = parseFloat(waybill.total_amount      || waybill.total     || 0);
    const freightAmount   = parseFloat(waybill.freight_amount    || waybill.freight   || 0) || totalAmount;
    const gstAmount       = parseFloat(waybill.gst_amount        || waybill.gst       || 0);
    const grandTotal      = parseFloat(waybill.grand_total       || waybill.total_amount || 0);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
    const branchCode = waybill.origin_branch?.branch_code || waybill.origin_branch?.branch_name?.slice(0, 3).toUpperCase() || 'HQ';

    // GST Robust key check
    const transportGST = companyDetails?.gst_number || companyDetails?.gstin || companyDetails?.gst || '';

    // Ultra compact branch string
    const branchStr = branches
        .filter(b => b.branch_name)
        .map(b => `${b.branch_name}${b.phone ? `-${b.phone}` : ''}`)
        .join(', ');

    const cellCls = `border border-black px-1 py-0 text-[10px] leading-tight`;
    const labelCls = `${cellCls} font-bold whitespace-nowrap`;
    const thCls = `border border-black px-1 py-0 text-[10px] font-bold text-center bg-gray-50/10`;

    const colWidths = ['10%', '26%', '15%', '9%', '9%', '18%', '13%'];

    return (
        <div className="receipt-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {[1, 2, 3].map((copyNum) => {
                const isAccountOrPaid = waybill.account_type?.toUpperCase() === 'ACCOUNT' || waybill.account_type?.toUpperCase() === 'PAID';
                const hideAmounts = isAccountOrPaid && (copyNum === 1 || copyNum === 2);

                return (
                    <div key={copyNum} 
                         className={`receipt-copy receipt-copy-${copyNum} flex flex-col text-black font-sans bg-white overflow-hidden ${onlyContent ? 'mb-0' : 'mb-[4mm]'}`} 
                         style={{ 
                            color: 'black', 
                            height: '95mm', 
                            maxHeight: '95mm', 
                            background: 'white',
                            width: '190mm', 
                            margin: '0 auto',
                            ...(onlyContent && copyNum === 2 ? { marginTop: '0.6cm' } : {}),
                            ...(onlyContent && copyNum === 3 ? { marginTop: '1.6cm' } : {}),
                         }}>

                        {/* ── ALIGNED HEADER (Visible or Invisible) ── */}
                        <div className={`flex justify-between items-start border-b-2 border-black pt-1 pb-2 mb-2 px-1 ${onlyContent ? 'opacity-0 pointer-events-none' : ''}`}>
                            <div className="w-14 h-14 flex-shrink-0">
                                {(companyDetails?.logo_path || companyDetails?.logo) && !imgErrors[`logo_${copyNum}`] ? (
                                    <div className="w-12 h-12 overflow-hidden">
                                        <img
                                            src={getFullStorageUrl(companyDetails.logo_path || companyDetails.logo)}
                                            alt=""
                                            className="w-full h-full object-contain mix-blend-multiply"
                                            onError={() => handleImgError(`logo_${copyNum}`)}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-[10px] font-black opacity-30">LOGO</div>
                                )}
                            </div>

                            <div className="text-center flex-1 mx-2 flex flex-col justify-center text-black">
                                <h1 className="text-[20px] font-black uppercase leading-tight tracking-tighter">
                                    {companyDetails?.company_name || companyDetails?.name || ''}
                                </h1>
                                <p className="text-[8.5px] font-black leading-tight mt-0.5">
                                    {companyDetails?.address}
                                </p>
                                {branchStr && (
                                    <p className="text-[7.5px] font-bold leading-tight mt-0.5 opacity-90 italic">
                                        <span className="font-black not-italic">Branches: </span>{branchStr}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-right flex flex-col justify-center leading-tight pr-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest mb-1 underline decoration-black/20">
                                        {copyNum === 1 ? 'CONSIGNOR' : copyNum === 2 ? 'CONSIGNEE' : 'OFFICE'} COPY
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-tighter mb-0.5">
                                        GST: <span className="font-black">{transportGST || 'Pending'}</span>
                                    </p>
                                    <p className="text-[7.5px] font-bold opacity-90">
                                        {companyDetails?.email}
                                    </p>
                                </div>
                                <div className="border border-black p-0.5 rounded bg-white w-14 h-14 flex-shrink-0 flex items-center justify-center">
                                    {companyDetails?.upi_qr_path && !imgErrors[`qr_${copyNum}`] ? (
                                        <img
                                            src={getFullStorageUrl(companyDetails.upi_qr_path, 'qr')}
                                            alt=""
                                            className="w-full h-full object-contain"
                                            onError={() => handleImgError(`qr_${copyNum}`)}
                                        />
                                    ) : (
                                        <div className="text-[6px] font-bold text-black/40 text-center uppercase">QR PAY</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── MAIN DATA TABLE ── */}
                        <table className="w-full border-collapse border border-black mb-0" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                            </colgroup>
                            <tbody>
                                <tr>
                                    <td className={labelCls} colSpan="2" style={{ padding: '0px 2px' }}>G.C.No : <span className="font-black text-[12px] ml-1">{waybill.gc_number}</span></td>
                                    <td className={labelCls} colSpan="1" style={{ padding: '0px 2px' }}>Date : <span className="font-bold ml-1">{formatDate(waybill.bill_date)}</span></td>
                                    <td className={labelCls} colSpan="2" style={{ padding: '0px 2px' }}>From : <span className="font-bold uppercase ml-1">{waybill.origin_branch?.branch_name || '-'}</span></td>
                                    <td className={labelCls} colSpan="2" style={{ padding: '0px 2px' }}>To : <span className="font-bold uppercase ml-1">{waybill.destination?.city_name || '-'}</span></td>
                                </tr>
                                <tr>
                                    <td className={labelCls} style={{ width: '15%', padding: '0px 2px' }}>Consignor :</td>
                                    <td className={cellCls} colSpan="6" style={{ padding: '0px 2px' }}>
                                        <span className="font-black uppercase text-[13px]">{waybill.consignor?.name}</span>
                                        {waybill.consignor?.gst_number && <span className="font-bold ml-4 text-[10px]">GSTIN : {waybill.consignor.gst_number}</span>}
                                    </td>
                                </tr>
                                <tr>
                                    <td className={labelCls} style={{ padding: '0px 2px' }}>Address :</td>
                                    <td className={cellCls} colSpan="6" style={{ padding: '0px 2px' }}>
                                        <span className="font-bold text-[11px]">
                                            {waybill.consignor?.address} {(waybill.consignor?.mobile_no || waybill.consignor?.mobile_number) ? <span className="font-black ml-2">MOB: {waybill.consignor.mobile_no || waybill.consignor.mobile_number}</span> : ''}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className={labelCls} style={{ padding: '0px 2px' }}>Consignee :</td>
                                    <td className={cellCls} colSpan="6" style={{ padding: '0px 2px' }}>
                                        <span className="font-black uppercase text-[13px]">{waybill.consignee?.name}</span>
                                        {waybill.consignee?.gst_number && <span className="font-bold ml-4 text-[10px]">GSTIN : {waybill.consignee.gst_number}</span>}
                                    </td>
                                </tr>
                                <tr>
                                    <td className={labelCls} style={{ padding: '0px 2px' }}>Address :</td>
                                    <td className={cellCls} colSpan="6" style={{ padding: '0px 2px' }}>
                                        <span className="font-bold text-[11px]">
                                            {waybill.consignee?.address} {(waybill.consignee?.mobile_no || waybill.consignee?.mobile_number) ? <span className="font-black ml-2">MOB: {waybill.consignee.mobile_no || waybill.consignee.mobile_number}</span> : ''}
                                        </span>
                                    </td>
                                </tr>
                                <tr className="bg-gray-50/5">
                                    <td className={labelCls} colSpan="1" style={{ padding: '0px 2px' }}>Articles : <span className="font-black">{waybill.total_articles}</span></td>
                                    <td className={labelCls} colSpan="2" style={{ padding: '0px 2px' }}>D.Value Rs : <span className="font-bold">{parseFloat(waybill.declared_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></td>
                                    <td className={labelCls} colSpan="2" style={{ padding: '0px 2px' }}>Freight : <span className="uppercase font-bold">{waybill.account_type}</span></td>
                                    <td className={labelCls} colSpan="2" style={{ padding: '0px 2px' }}>Invoice No : <span className="font-bold">{waybill.invoice_no || '-'}</span></td>
                                </tr>
                                <tr>
                                    <th className={thCls} rowSpan="2" style={{ padding: '0px' }}>No Of<br/>Articles</th>
                                    <th className={thCls} rowSpan="2" style={{ padding: '0px' }}>Description</th>
                                    <th className={thCls} rowSpan="2" style={{ padding: '0px' }}>Rate/Kg</th>
                                    <th className={thCls} colSpan="2" style={{ padding: '0px' }}>Weight</th>
                                    <th className={thCls} rowSpan="2" style={{ padding: '0px' }}>Freight Charges</th>
                                    <th className={thCls} rowSpan="2" style={{ padding: '0px' }}>Rs.</th>
                                </tr>
                                <tr>
                                    <th className={thCls} style={{ padding: '0px' }}>Actual</th>
                                    <th className={thCls} style={{ padding: '0px' }}>Charged</th>
                                </tr>
                                {waybill.articles?.map((art, idx) => (
                                    <tr key={idx} style={{ height: '3.5mm' }}>
                                        <td className={`${cellCls} text-center font-bold`}>{art.no_of_articles}</td>
                                        <td className={`${cellCls} uppercase text-[9px]`}>{art.article_type}</td>
                                        <td className={`${cellCls} text-right text-[9px]`}>{parseFloat(art.freight || art.rate || 0).toFixed(2)}</td>
                                        <td className={`${cellCls} text-center text-[9px]`}>{parseFloat(art.actual_weight || 0).toFixed(1)}</td>
                                        <td className={`${cellCls} text-center text-[9px]`}>{parseFloat(art.charged_weight || 0).toFixed(1)}</td>
                                        <td className={`${cellCls} text-[9px]`}>Freight Basic</td>
                                        <td className={`${cellCls} text-right font-black text-[10px]`}>{hideAmounts ? '' : parseFloat(art.amount || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!waybill.articles || waybill.articles.length < 1) && (
                                    <tr style={{ height: '3.5mm' }}>
                                        <td className={cellCls} colSpan="7">&nbsp;</td>
                                    </tr>
                                )}
                                <tr>
                                    <td colSpan="3" rowSpan="6" className={`${cellCls} align-top py-0.5`} style={{ height: '22mm' }}>
                                        <div className="flex flex-col h-full justify-between">
                                            <p className="italic text-[9px] font-bold opacity-60">Received the material in good condition</p>
                                            <p className="font-black text-[11px] uppercase mt-auto pb-1 text-black">Receiver's Signature with seal</p>
                                        </div>
                                    </td>
                                    <td colSpan="2" rowSpan="6" className={`${cellCls} text-center align-middle py-0.5`}>
                                        <div className="flex flex-col items-center gap-0">
                                            <p className="font-bold text-[9px] uppercase leading-none mb-1.5 opacity-80">{branchCode} / {timeStr}</p>
                                            <div className="flex items-center justify-center my-1">
                                                <img
                                                    src={`https://barcode.tec-it.com/barcode.ashx?data=${waybill.gc_number}&code=Code128&translate-esc=on&imagetype=Png&height=35&modulewidth=1.1&humanreadable=0`}
                                                    alt="Barcode"
                                                    className="h-7 w-auto object-contain mix-blend-multiply"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            </div>
                                            <p className="border-t border-black/20 mt-0.5 pt-1 font-bold text-[9px] uppercase opacity-70">Booking Clerk</p>
                                            <p className="font-black text-[11px] uppercase leading-none">{currentUser?.full_name || currentUser?.name || 'ADMIN'}</p>
                                        </div>
                                    </td>
                                    <td className={`${cellCls} font-bold`} style={{ height: '3.5mm' }}>D.D Charges</td>
                                    <td className={`${cellCls} text-right font-bold`}>{hideAmounts ? '' : ddCharges.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className={`${cellCls} font-bold`} style={{ height: '3.5mm' }}>Handling Charges</td>
                                    <td className={`${cellCls} text-right font-bold`}>{hideAmounts ? '' : handlingCharges.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className={`${cellCls} font-bold`} style={{ height: '3.5mm' }}>Stationary Charges</td>
                                    <td className={`${cellCls} text-right font-bold`}>{hideAmounts ? '' : stationaryCharges.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className={`${cellCls} font-bold`} style={{ height: '3.5mm' }}>Total</td>
                                    <td className={`${cellCls} text-right font-black`}>{hideAmounts ? '' : (freightAmount + ddCharges + handlingCharges + stationaryCharges).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className={`${cellCls} font-bold`} style={{ height: '3.5mm' }}>GST-AMT</td>
                                    <td className={`${cellCls} text-right font-bold`}>{hideAmounts ? '' : gstAmount.toFixed(2)}</td>
                                </tr>
                                <tr className="bg-gray-50/50">
                                    <td className={`${cellCls} font-black text-[12px]`} style={{ height: '4.5mm' }}>Grand Total</td>
                                    <td className={`${cellCls} text-right font-black text-[12px]`}>{hideAmounts ? '' : grandTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className={`px-1 py-1 border-t-0 bg-transparent flex items-center justify-center ${onlyContent ? 'opacity-0 pointer-events-none' : ''}`}>
                             <p className="text-[9.5px] font-black text-center leading-none tracking-tight">
                                Note : 1) We are not responsible for Damage, Leakage of goods 2) Unloading by party 3) Booked at owner's risk
                             </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GCEntryReceipt;
