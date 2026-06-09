import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useTabs } from '../contexts/TabContext';

const MaintenanceAlert = () => {
    const [pendingBill, setPendingBill] = useState(null);
    const { addTab } = useTabs();

    useEffect(() => {
        const checkPendingBill = async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            
            try {
                const user = JSON.parse(userStr);
                const isSuperAdmin = user.role?.role_name?.toLowerCase() === 'superadmin' || user.role?.role_name?.toLowerCase() === 'super admin';
                const branchQuery = isSuperAdmin ? '' : `&branch_id=${user.branch_id}`;
                
                const response = await fetch(`${API_BASE_URL}/maintenance/pending-bill?transport_id=${user.transport_id}${branchQuery}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    // The API returns an array, pick the first bill to show in the alert
                    setPendingBill(data.data[0]);
                } else {
                    setPendingBill(null);
                }
            } catch (error) {
                console.error('Error checking pending bill:', error);
            }
        };

        checkPendingBill();
    }, []);

    if (!pendingBill) return null;

    return (
        <div className="no-print bg-red-500 text-white px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-[60] animate-pulse">
            <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-yellow-300" />
                <div>
                    <span className="font-bold">Urgent: Pending Payment!</span>
                    <span className="ml-2 text-sm opacity-90 hidden sm:inline">
                        Maintenance bill for {new Date(pendingBill.bill_year, pendingBill.bill_month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} is pending (Amount: ₹{pendingBill.total_amount}).
                    </span>
                </div>
            </div>
            <button 
                onClick={() => addTab('Maintenance Billing', '/maintenance-billing', 'Maintenance Billing')}
                className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-gray-100 transition shadow-md whitespace-nowrap"
            >
                Pay Now <ChevronRight size={14} />
            </button>
        </div>
    );
};

export default MaintenanceAlert;
