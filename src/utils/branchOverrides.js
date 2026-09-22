export const applyBranchOverrides = (user, currentDetails) => {
    if (!user) return currentDetails;
    
    const branchName = (user.branch_name || user.branch?.branch_name || '').toUpperCase();
    
    if (branchName === 'SINDHNUR') {
        const overrides = {
            company_name: 'LIFE ROAD LINES',
            transport_name: 'LIFE ROAD LINES',
            name: 'LIFE ROAD LINES',
            address: 'Shop No. 15/18, APMC Yard 3rd Gate, Kustagi Road, Sindhanur-584128',
            transport_address: 'Shop No. 15/18, APMC Yard 3rd Gate, Kustagi Road, Sindhanur-584128',
            phone: '7022108822',
            transport_phone: '7022108822',
            mobile: '7022108822',
            mobile_number: '7022108822',
            mobile_no: '7022108822',
            gstin: '29GYKPS4816L1ZH',
            gst_number: '29GYKPS4816L1ZH',
            transport_gstin: '29GYKPS4816L1ZH',
            gst: '29GYKPS4816L1ZH'
        };

        if (typeof currentDetails === 'object' && currentDetails !== null) {
            return { ...currentDetails, ...overrides };
        }
        return overrides;
    }
    
    return currentDetails || {};
};
