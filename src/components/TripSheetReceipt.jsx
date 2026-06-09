import React from 'react';

const TripSheetReceipt = ({ printData, transportInfo, logo }) => {
    if (!printData) return null;

    const origin = (printData.dispatch_branch?.branch_code || printData.dispatch_branch?.branch_name || '').toUpperCase();
    const destinationsList = Array.from(
        new Set(
            printData.waybills?.map(wb => wb.destination?.city_name || wb.destination?.branch_name).filter(Boolean) || []
        )
    ).map(d => d.toUpperCase());
    const routeInfo = origin && destinationsList.length > 0
        ? `${origin} TO ${destinationsList.join(', ')}`
        : (printData.remarks || '-').toUpperCase();

    return (
        <div className="bg-white text-black pt-[2mm] px-[1cm] pb-[2mm] w-[210mm] font-normal">
            <div className="border-2 border-black overflow-hidden">
                {/* Header Section */}
                <div className="flex justify-between items-start p-2 border-b-2 border-black">
                    <div className="w-20">
                        {logo ? (
                            <img src={logo} alt="Logo" className="h-14 w-auto object-contain" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-50 border border-gray-200 flex items-center justify-center text-[6px] text-gray-300 uppercase italic font-normal">
                                MISSING LOGO
                            </div>
                        )}
                    </div>
                    <div className="text-center flex-1 pr-10">
                        <h1 className="text-xl font-normal tracking-tight uppercase leading-none">
                            {transportInfo.name || "LOGISTICS TRANSPORT"}
                        </h1>
                        <p className="text-[10px] font-normal mt-0.5 uppercase leading-tight">
                            {transportInfo.address || "Company Address, City, State"}
                        </p>
                        <div className="flex justify-center gap-4 mt-0.5 text-[9px] font-normal italic">
                            {transportInfo.phone && <span>MOB: {transportInfo.phone}</span>}
                        </div>
                    </div>
                    <div className="w-16">
                        <div className="w-12 h-12 border border-gray-200 ml-auto opacity-20"></div>
                    </div>
                </div>

                {/* GSTIN Section */}
                <div className="border-b-2 border-black px-2 py-0.5 text-[9px] font-normal">
                    GSTIN : {transportInfo.gstin || 'GSTIN PENDING'}
                </div>

                {/* Title */}
                <div className="bg-white border-b-2 border-black py-0.5 text-center">
                    <h2 className="text-[11px] font-normal uppercase underline tracking-wider">
                        {printData.dispatch_branch?.branch_name || 'BRANCH'} - BRANCH-TRIPSHEET DETAILS
                    </h2>
                </div>

                {/* Top Details Grid */}
                <div className="grid grid-cols-4 text-[9px] bg-white border-b-2 border-black font-normal">
                    <div className="border-r border-black px-2 py-0.5"><span>No:</span> <span className="text-[11px] font-normal">{printData.trip_number}</span></div>
                    <div className="border-r border-black px-2 py-0.5"><span>Date:</span> <span className="font-normal">{new Date(printData.trip_date).toLocaleDateString('en-GB')}</span></div>
                    <div className="border-r border-black px-2 py-0.5"><span>Vehicle No:</span> <span className="font-normal">{printData.vehicle?.vehicle_number}</span></div>
                    <div className="px-2 py-0.5"><span>Driver Name:</span> <span className="font-normal">{printData.driver?.name}</span></div>
                </div>

                <div className="grid grid-cols-5 text-[9px] bg-white border-b-2 border-black font-normal">
                    <div className="border-r border-black px-2 py-0.5 col-span-1"><span>Owner Name:</span> <span className="font-normal">{printData.owner_name || printData.vehicle?.owner_name || '-'}</span></div>
                    <div className="border-r border-black px-2 py-0.5"><span>LR NO:</span> <span className="font-normal">{printData.lr_number || printData.trip_number || '-'}</span></div>
                    <div className="border-r border-black px-2 py-0.5"><span>CR NO:</span> <span className="font-normal">{printData.cr_number || '-'}</span></div>
                    <div className="border-r border-black px-2 py-0.5"><span>Lorry Freight:</span> <span className="font-normal">{parseFloat(printData.lorry_freight || printData.total_freight || 0).toFixed(2)}</span></div>
                    <div className="px-2 py-0.5"><span>Advance:</span> <span className="font-normal">{parseFloat(printData.advance_amount || 0).toFixed(2)}</span></div>
                </div>

                {/* Main Waybills Table */}
                <table className="w-full text-[10px] border-b-2 border-black font-normal">
                    <thead>
                        <tr className="border-b-2 border-black uppercase text-[9px] font-normal">
                            <th className="border-r border-black px-1 py-0.5 w-10 text-center font-normal">SI-NO</th>
                            <th className="border-r border-black px-2 py-0.5 text-left font-normal">GC NO</th>
                            <th className="border-r border-black px-1 py-0.5 w-16 text-center font-normal">Articles</th>
                            <th className="border-r border-black px-1 py-0.5 w-16 text-center font-normal">Weight</th>
                            <th className="border-r border-black px-2 py-0.5 text-left font-normal">Consignor</th>
                            <th className="border-r border-black px-2 py-0.5 text-center font-normal">To</th>
                            <th className="px-2 py-0.5 text-right font-normal">TO PAY</th>
                        </tr>
                    </thead>
                    <tbody className="font-normal">
                        {(() => {
                            const data = printData;
                            if (data.route_id && data.route && data.route.stops) {
                                return data.route.stops.map((stop, sIdx) => {
                                    const gcsForStop = data.waybills?.filter(wb =>
                                        wb.destination?.branchMappings?.some(m => parseInt(m.branch_id) === parseInt(stop.branch_id))
                                    );
                                    if (!gcsForStop || gcsForStop.length === 0) return null;
                                    return (
                                        <React.Fragment key={stop.id}>
                                            <tr className="bg-gray-100 border-b-2 border-black font-normal">
                                                <td colSpan="7" className="px-2 py-0.5 text-center font-normal uppercase">
                                                    STOP {sIdx + 1}: {stop.branch?.branch_name} ({gcsForStop.length} GCs)
                                                </td>
                                            </tr>
                                            {gcsForStop.map((wb, idx) => (
                                                <tr key={wb.id} className="border-b border-black font-normal">
                                                    <td className="border-r border-black px-1 py-0.5 text-center font-normal">{idx + 1}</td>
                                                    <td className="border-r border-black px-2 py-0.5 uppercase font-normal">{wb.gc_number}</td>
                                                    <td className="border-r border-black px-1 py-0.5 text-center font-normal">{wb.total_articles || 0}</td>
                                                    <td className="border-r border-black px-1 py-0.5 text-center font-normal">{wb.actual_weight || 0}</td>
                                                    <td className="border-r border-black px-2 py-0.5 uppercase text-[10px] font-normal">{wb.consignor?.name}</td>
                                                    <td className="border-r border-black px-2 py-0.5 text-center uppercase text-[10px] font-normal">{wb.destination?.city_name}</td>
                                                    <td className="px-2 py-0.5 text-right font-normal">{wb.account_type?.toLowerCase() === 'topay' ? parseFloat(wb.grand_total || 0).toFixed(2) : wb.account_type?.toUpperCase()}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                });
                            }
                            return data.waybills?.map((wb, idx) => (
                                <tr key={wb.id} className="border-b border-black font-normal">
                                    <td className="border-r border-black px-1 py-0.5 text-center font-normal">{idx + 1}</td>
                                    <td className="border-r border-black px-2 py-0.5 uppercase font-normal">{wb.gc_number}</td>
                                    <td className="border-r border-black px-1 py-0.5 text-center font-normal">{wb.total_articles || 0}</td>
                                    <td className="border-r border-black px-1 py-0.5 text-center font-normal">{wb.actual_weight || 0}</td>
                                    <td className="border-r border-black px-2 py-0.5 uppercase text-[10px] font-normal">{wb.consignor?.name}</td>
                                    <td className="border-r border-black px-2 py-0.5 text-center uppercase text-[10px] font-normal">{wb.destination?.city_name}</td>
                                    <td className="px-2 py-0.5 text-right font-normal">{wb.account_type?.toLowerCase() === 'topay' ? parseFloat(wb.grand_total || 0).toFixed(2) : wb.account_type?.toUpperCase()}</td>
                                </tr>
                            ));
                        })()}
                        <tr className="text-[10px] uppercase font-normal">
                            <td colSpan="2" className="border-r border-black px-2 py-0.5 font-normal">TOTAL ARTICLE</td>
                            <td className="border-r border-black px-1 py-0.5 text-center font-normal">
                                {printData.waybills?.reduce((acc, wb) => acc + (parseInt(wb.total_articles) || wb.articles?.reduce((a, c) => a + (parseInt(c.no_of_articles) || 0), 0) || 0), 0)}
                            </td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black px-2 py-0.5 text-center font-normal">TOTAL</td>
                            <td className="px-2 py-0.5 text-right font-normal">
                                {parseFloat(printData.waybills?.reduce((acc, wb) => {
                                    return wb.account_type?.toLowerCase() === 'topay'
                                        ? acc + (parseFloat(wb.grand_total || wb.total_amount) || 0)
                                        : acc;
                                }, 0)).toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Agency Settlement Grid */}
                <div className="grid grid-cols-3 text-[10px] bg-white border-b-2 border-black font-normal">
                    <div className="border-r border-black">
                        <div className="flex justify-between border-b border-black p-0.5"><span>Opening KM :</span><span className="w-16 text-right px-1 font-normal">{printData.opening_km || '0'}</span></div>
                        <div className="flex justify-between border-b border-black p-0.5"><span>Freight Rs :</span><span className="w-16 text-right px-1 font-normal">{parseFloat(printData.total_freight || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between p-0.5"><span>Total Collection</span><span className="w-16 text-right px-1 font-normal">{parseFloat(printData.total_collection || 0).toFixed(2)}</span></div>
                    </div>
                    <div className="border-r border-black">
                        <div className="flex justify-between border-b border-black p-0.5"><span>Closing KM :</span><span className="w-16 text-right px-1 font-normal">{printData.closing_km || '0'}</span></div>
                        <div className="flex justify-between border-b border-black p-0.5"><span>Advance Rs :</span><span className="w-16 text-right px-1 font-normal">{parseFloat(printData.advance_amount || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between p-0.5"><span>Less paid to Driver</span><span className="w-16 text-right px-1 font-normal">{parseFloat(printData.less_paid_driver || 0).toFixed(2)}</span></div>
                    </div>
                    <div>
                        <div className="flex justify-between border-b border-black p-0.5"><span>Total KMS :</span><span className="w-16 text-right px-1 text-blue-600 font-normal">{printData.total_kms || '0'}</span></div>
                        <div className="flex justify-between border-b border-black p-0.5"><span>Balance Rs :</span><span className="w-16 text-right px-1 font-normal">{parseFloat(printData.balance_at_office || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between p-0.5"><span>Bal. at Office / Agency</span><span className="w-16 text-right px-1 font-normal">{parseFloat(printData.balance_at_office || 0).toFixed(2)}</span></div>
                    </div>
                </div>

                {/* Remarks Section */}
                <div className="border-b-2 border-black px-2 py-0.5 text-[10px] uppercase bg-white font-normal">
                    Remarks : {routeInfo}
                </div>

                {/* Note Section */}
                <div className="border-b-2 border-black p-1 text-[8px] text-gray-800 leading-relaxed bg-white space-y-0.5 font-normal">
                    <div>Note: 1. Octroi Superintendent, Bellary Muncipal Corporation. Kindly prepare each transit pass in the name of Lorry Owner. There is no responsibility on our Transport Company regarding the same. Delivery condition within ________ days at destination as per agreement.</div>
                    <div className="pl-7">2. Received the above goods in sound & in good condition. I & My owner are responsible for the delivery at proper destination.</div>
                    <div className="pl-7">3. Transporter not responsible if unloading is not done on Sunday and other Holiday.</div>
                </div>

                {/* Signature Section */}
                <div className="flex justify-between items-end p-4 pt-6 text-[9px] uppercase bg-white font-normal">
                    <div className="w-64 text-left leading-tight font-normal">SIGN. OF THE DRIVER</div>
                    <div className="flex-1 text-center font-normal">For {transportInfo.name}</div>
                    <div className="w-64 text-right leading-tight font-normal">OFFICE / AGENT SIGNATURE</div>
                </div>
            </div>
        </div>
    );
};

export default TripSheetReceipt;
