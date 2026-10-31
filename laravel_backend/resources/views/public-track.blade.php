<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Consignment #{{ $waybill->gc_number }} — Sri Mallikarjuna Parcel Service</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f1f5f9;
            color: #0f172a;
            padding-bottom: 40px;
        }
        .header {
            background: linear-gradient(135deg, #065f46 0%, #047857 50%, #0f766e 100%);
            color: white;
            padding: 24px 20px 48px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(4, 120, 87, 0.25);
            position: relative;
        }
        .company-name {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .tagline {
            font-size: 12px;
            opacity: 0.85;
            margin-top: 4px;
        }
        .container {
            max-width: 600px;
            margin: -30px auto 0;
            padding: 0 16px;
        }
        .card {
            background: white;
            border-radius: 18px;
            padding: 22px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
        }
        .gc-badge-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 14px;
            margin-bottom: 16px;
        }
        .gc-number {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
        }
        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-delivered { background: #dcfce7; color: #15803d; }
        .status-transit { background: #fef3c7; color: #b45309; }
        .status-booked { background: #e0f2fe; color: #0369a1; }
        
        .route-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 18px;
        }
        .route-point {
            flex: 1;
        }
        .route-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 2px;
        }
        .route-city {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
        }
        .route-arrow {
            font-size: 20px;
            color: #10b981;
            padding: 0 10px;
        }

        /* Timeline */
        .timeline {
            position: relative;
            padding: 10px 0 10px 24px;
            border-left: 2px solid #e2e8f0;
            margin: 10px 10px 20px 16px;
        }
        .timeline-step {
            position: relative;
            margin-bottom: 22px;
        }
        .timeline-step:last-child {
            margin-bottom: 0;
        }
        .timeline-bullet {
            position: absolute;
            left: -32px;
            top: 2px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #cbd5e1;
            border: 3px solid white;
            box-shadow: 0 0 0 2px #cbd5e1;
        }
        .step-active .timeline-bullet {
            background: #10b981;
            box-shadow: 0 0 0 3px #a7f3d0;
        }
        .step-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
        }
        .step-active .step-title {
            color: #065f46;
        }
        .step-time {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
        }

        /* Details Grid */
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 14px;
        }
        .detail-box {
            background: #f8fafc;
            border-radius: 12px;
            padding: 12px;
            border: 1px solid #f1f5f9;
        }
        .detail-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
        }
        .detail-val {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 3px;
            word-break: break-word;
        }

        /* POD preview */
        .pod-card {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 14px;
            padding: 16px;
            text-align: center;
            margin-top: 16px;
        }
        .pod-btn {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            font-size: 13px;
            margin-top: 8px;
        }
        .pod-img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-top: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .verified-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 11px;
            color: #059669;
            font-weight: 600;
            margin-top: 16px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            margin-top: 24px;
        }
    </style>
</head>
<body>
    @php
        $statusUpper = strtoupper($waybill->status ?? 'BOOKED');
        $isDelivered = ($statusUpper === 'DELIVERED') || !empty($waybill->delivered_at) || !empty($waybill->delivery_proof);
        $statusClass = $isDelivered ? 'status-delivered' : ($statusUpper === 'BOOKED' ? 'status-booked' : 'status-transit');
        $displayStatus = $isDelivered ? 'Delivered' : ($statusUpper === 'BOOKED' ? 'Booked' : 'In Transit');

        $origin = $waybill->originBranch->branch_name ?? 'Origin';
        $destination = $waybill->destination->city_name ?? ($waybill->destination->branch_name ?? 'Destination');
        $amount = number_format((float)($waybill->grand_total ?? 0), 2);
        $accType = strtoupper($waybill->account_type ?? 'TO PAY');
        $articles = $waybill->total_articles ?? count($waybill->articles ?? []);
        $articleDesc = !empty($waybill->article_desc) ? $waybill->article_desc : 'Boxes / Parcels';
    @endphp

    <div class="header">
        <div class="company-name">
            <span>🚚</span> Sri Mallikarjuna Parcel Service
        </div>
        <div class="tagline">Official Consignment Tracking Portal</div>
    </div>

    <div class="container">
        <!-- Main Consignment Card -->
        <div class="card">
            <div class="gc-badge-row">
                <div>
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Waybill / GC Number</div>
                    <div class="gc-number">#{{ $waybill->gc_number }}</div>
                </div>
                <div class="status-pill {{ $statusClass }}">
                    ● {{ $displayStatus }}
                </div>
            </div>

            <!-- Route -->
            <div class="route-row">
                <div class="route-point">
                    <div class="route-label">From</div>
                    <div class="route-city">{{ $origin }}</div>
                </div>
                <div class="route-arrow">➔</div>
                <div class="route-point" style="text-align: right;">
                    <div class="route-label">To</div>
                    <div class="route-city">{{ $destination }}</div>
                </div>
            </div>

            <!-- Live Status Stepper -->
            <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 12px; text-transform: uppercase;">
                Shipment Journey
            </div>
            <div class="timeline">
                <!-- Step 1: Booked -->
                <div class="timeline-step step-active">
                    <div class="timeline-bullet"></div>
                    <div class="step-title">Consignment Booked</div>
                    <div class="step-time">{{ $waybill->bill_date ? date('d-M-Y', strtotime($waybill->bill_date)) : 'Date Registered' }}</div>
                </div>

                <!-- Step 2: In Transit -->
                <div class="timeline-step {{ ($statusUpper !== 'BOOKED' || $isDelivered) ? 'step-active' : '' }}">
                    <div class="timeline-bullet"></div>
                    <div class="step-title">Loaded & In Transit</div>
                    <div class="step-time">Route: {{ $origin }} ➔ {{ $destination }}</div>
                </div>

                <!-- Step 3: Delivered -->
                <div class="timeline-step {{ $isDelivered ? 'step-active' : '' }}">
                    <div class="timeline-bullet"></div>
                    <div class="step-title">{{ $isDelivered ? 'Delivered' : 'Out for Delivery / Destination Arrival' }}</div>
                    <div class="step-time">
                        @if($isDelivered && $waybill->delivered_at)
                            Delivered on {{ date('d-M-Y H:i', strtotime($waybill->delivered_at)) }}
                        @else
                            Pending Delivery at {{ $destination }}
                        @endif
                    </div>
                </div>
            </div>

            <!-- Summary Grid -->
            <div class="details-grid">
                <div class="detail-box">
                    <div class="detail-label">Consignor (Sender)</div>
                    <div class="detail-val">{{ $waybill->consignor->name ?? 'Sender' }}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Consignee (Receiver)</div>
                    <div class="detail-val">{{ $waybill->consignee->name ?? 'Receiver' }}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Articles</div>
                    <div class="detail-val">{{ $articles }} pkgs ({{ $articleDesc }})</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Freight Amount</div>
                    <div class="detail-val">₹{{ $amount }} <span style="font-size: 11px; color: #10b981;">({{ $accType }})</span></div>
                </div>
            </div>

            <!-- Proof of Delivery (POD) if available -->
            @if($isDelivered && !empty($waybill->delivery_proof))
                <div class="pod-card">
                    <div style="font-size: 14px; font-weight: 700; color: #065f46;">📸 Proof of Delivery (POD) Available</div>
                    <div style="font-size: 12px; color: #047857; margin-top: 2px;">Signed receipt verified upon delivery</div>
                    @php
                        $podUrl = asset('storage/' . $waybill->delivery_proof);
                    @endphp
                    <div style="margin-top: 12px;">
                        <img src="{{ $podUrl }}" alt="Proof of Delivery" class="pod-img" onerror="this.style.display='none'">
                    </div>
                    <a href="{{ $podUrl }}" target="_blank" class="pod-btn">View Full Resolution POD</a>
                </div>
            @endif

            <div class="verified-badge">
                🔒 Authenticated & Verified Consignment • Sri Mallikarjuna Parcel Service
            </div>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} Sri Mallikarjuna Parcel Service • Powered by Garuda ERP
        </div>
    </div>
</body>
</html>
