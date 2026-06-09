<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transport;
use App\Models\MaintenanceBill;
use App\Models\Waybill;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Razorpay\Api\Api;
use Carbon\Carbon;

class MaintenanceController extends Controller
{
    private $razorpayId;
    private $razorpaySecret;

    public function __construct()
    {
        $this->razorpayId = env('RAZORPAY_KEY_ID');
        $this->razorpaySecret = env('RAZORPAY_KEY_SECRET');
    }

    public function getPendingBill(Request $request)
    {
        $transportId = $request->transport_id;
        $branchId = $request->branch_id; // optional if branch user

        if (!$transportId) {
            return response()->json(['success' => false, 'message' => 'Transport ID is required.'], 400);
        }

        // Return the latest pending bill(s)
        $query = MaintenanceBill::with(['transport', 'branch'])->where('transport_id', $transportId)
            ->where('status', 'Pending')
            ->orderBy('bill_year', 'desc')
            ->orderBy('bill_month', 'desc');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $pendingBills = $query->get();

        return response()->json([
            'success' => true,
            'data' => $pendingBills // Returning an array because multiple branches can be pending
        ]);
    }

    /**
     * Create Razorpay Order
     */
    public function createOrder(Request $request, $id)
    {
        $bill = MaintenanceBill::findOrFail($id);
        
        if ($bill->status === 'Paid') {
            return response()->json(['success' => false, 'message' => 'Bill already paid.'], 400);
        }

        if (!$this->razorpayId || !$this->razorpaySecret) {
            return response()->json(['success' => false, 'message' => 'Razorpay keys not configured.'], 500);
        }

        $api = new Api($this->razorpayId, $this->razorpaySecret);

        $orderData = [
            'receipt'         => 'bill_' . $bill->id,
            'amount'          => $bill->total_amount * 100, // in paise
            'currency'        => 'INR',
            'payment_capture' => 1 // auto capture
        ];

        $razorpayOrder = $api->order->create($orderData);

        $bill->update([
            'razorpay_order_id' => $razorpayOrder['id']
        ]);

        return response()->json([
            'success' => true,
            'order_id' => $razorpayOrder['id'],
            'amount' => $bill->total_amount,
            'key' => $this->razorpayId
        ]);
    }

    /**
     * Verify Payment
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'razorpay_order_id' => 'required',
            'razorpay_payment_id' => 'required',
            'razorpay_signature' => 'required',
        ]);

        $bill = MaintenanceBill::where('razorpay_order_id', $request->razorpay_order_id)->firstOrFail();

        $api = new Api($this->razorpayId, $this->razorpaySecret);

        try {
            $attributes = [
                'razorpay_order_id' => $request->razorpay_order_id,
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'razorpay_signature' => $request->razorpay_signature
            ];

            $api->utility->verifyPaymentSignature($attributes);

            $bill->update([
                'status' => 'Paid',
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'paid_at' => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Payment verified successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Payment verification failed: ' . $e->getMessage()], 400);
        }
    }

    /**
     * List all bills (Admin report)
     */
    public function index(Request $request)
    {
        $query = MaintenanceBill::with(['transport', 'branch'])->orderBy('created_at', 'desc');

        if ($request->transport_id) {
            $query->where('transport_id', $request->transport_id);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }
}
