<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Track Consignment #{{ $waybill->gc_number }} — Sri Mallikarjuna Parcel Service</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #059669;
            --primary-dark: #047857;
            --primary-light: #10b981;
            --accent: #f59e0b;
            --bg-page: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(180deg, #ecfdf5 0%, #f8fafc 260px, #f1f5f9 100%);
            color: var(--text-main);
            min-height: 100vh;
            padding-bottom: 50px;
            -webkit-font-smoothing: antialiased;
        }

        /* Top Brand Navigation Bar */
        .top-navbar {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(226, 232, 240, 0.8);
            position: sticky;
            top: 0;
            z-index: 50;
            padding: 14px 20px;
        }
        .navbar-content {
            max-width: 640px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }
        .brand-logo-area {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .brand-icon {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            box-shadow: 0 4px 10px rgba(5, 150, 105, 0.25);
        }
        .brand-text h1 {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
            letter-spacing: -0.3px;
        }
        .brand-text p {
            font-size: 11px;
            color: #059669;
            font-weight: 600;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }
        .live-tag {
            background: #dcfce7;
            color: #15803d;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 5px;
            border: 1px solid #bbf7d0;
        }
        .pulse-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #16a34a;
            animation: pulse 1.6s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }

        /* Container Layout */
        .main-container {
            max-width: 640px;
            margin: 20px auto 0;
            padding: 0 16px;
        }

        /* Cards */
        .card {
            background: var(--card-bg);
            border-radius: 22px;
            padding: 24px;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.03);
            border: 1px solid rgba(226, 232, 240, 0.9);
            margin-bottom: 18px;
        }

        /* Header of Card: GC Number + Status */
        .gc-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding-bottom: 18px;
            border-bottom: 1px dashed #e2e8f0;
        }
        .gc-label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.6px;
            color: #64748b;
            margin-bottom: 2px;
        }
        .gc-number {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.4px;
            text-transform: uppercase;
        }
        .badge-delivered {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        .badge-transit {
            background: #fef3c7;
            color: #b45309;
            border: 1px solid #fde68a;
        }
        .badge-booked {
            background: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
        }

        /* Route Banner */
        .route-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 18px 20px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }
        .route-stop {
            flex: 1;
        }
        .stop-tag {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #059669;
            margin-bottom: 3px;
        }
        .stop-name {
            font-size: 17px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.3px;
        }
        .route-connector {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0 14px;
        }
        .route-arrow-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: white;
            border: 1px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #059669;
            box-shadow: 0 2px 6px rgba(0,0,0,0.04);
            font-size: 14px;
            font-weight: 900;
        }

        /* Section Headings */
        .section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #475569;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* Vertical Journey Timeline */
        .journey-timeline {
            position: relative;
            padding-left: 28px;
            margin: 10px 0 24px;
        }
        .journey-timeline::before {
            content: '';
            position: absolute;
            left: 9px;
            top: 8px;
            bottom: 8px;
            width: 2px;
            background: #e2e8f0;
        }
        .timeline-item {
            position: relative;
            margin-bottom: 22px;
        }
        .timeline-item:last-child {
            margin-bottom: 0;
        }
        .timeline-indicator {
            position: absolute;
            left: -28px;
            top: 2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 2px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        }
        .timeline-indicator::after {
            content: '';
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #cbd5e1;
        }
        .timeline-item.completed .timeline-indicator {
            border-color: #059669;
            background: #059669;
        }
        .timeline-item.completed .timeline-indicator::after {
            background: white;
        }
        .timeline-item.active .timeline-indicator {
            border-color: #059669;
            background: #ecfdf5;
            box-shadow: 0 0 0 4px #a7f3d0;
        }
        .timeline-item.active .timeline-indicator::after {
            background: #059669;
        }
        .timeline-content h4 {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
        }
        .timeline-item.completed .timeline-content h4,
        .timeline-item.active .timeline-content h4 {
            color: #065f46;
        }
        .timeline-content p {
            font-size: 12px;
            color: #64748b;
            margin-top: 3px;
        }

        /* Party Info Grid (Consignor & Consignee) */
        .party-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        @media (max-width: 480px) {
            .party-grid { grid-template-columns: 1fr; }
        }
        .party-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 14px;
        }
        .party-header {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 6px;
        }
        .party-name {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            word-break: break-word;
        }
        .party-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
        }

        /* Quick Specs Row */
        .specs-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 16px;
        }
        @media (max-width: 480px) {
            .specs-row { grid-template-columns: 1fr 1fr; }
        }
        .spec-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px;
            text-align: center;
        }
        .spec-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 3px;
        }
        .spec-val {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
        }
        .spec-accent {
            color: #059669;
        }

        /* Proof of Delivery (POD) */
        .pod-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 18px;
            padding: 20px;
            text-align: center;
            margin-top: 16px;
        }
        .pod-box h3 {
            font-size: 15px;
            font-weight: 800;
            color: #14532d;
        }
        .pod-box p {
            font-size: 12px;
            color: #15803d;
            margin-top: 3px;
        }
        .pod-preview-img {
            max-width: 100%;
            max-height: 280px;
            object-fit: contain;
            border-radius: 12px;
            border: 1px solid #86efac;
            margin: 14px auto;
            display: block;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .pod-action-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #059669;
            color: white;
            font-weight: 700;
            font-size: 13px;
            padding: 10px 20px;
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }
        .pod-action-btn:hover {
            background: #047857;
            transform: translateY(-1px);
        }

        /* Footer & Trust */
        .security-stamp {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #059669;
            background: #ecfdf5;
            padding: 10px;
            border-radius: 12px;
            border: 1px dashed #a7f3d0;
            margin-top: 20px;
        }
        .portal-footer {
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            margin-top: 24px;
            line-height: 1.6;
        }
    </style>
</head>
<body>

    @php
        $statusUpper = strtoupper($waybill->status ?? 'BOOKED');
        $isDelivered = ($statusUpper === 'DELIVERED') || !empty($waybill->delivered_at) || !empty($waybill->delivery_proof);
        $isInTransit = ($statusUpper === 'IN TRANSIT' || $statusUpper === 'DISPATCHED' || $statusUpper === 'LOADED') && !$isDelivered;
        $isBooked    = !$isDelivered && !$isInTransit;

        $badgeClass = $isDelivered ? 'badge-delivered' : ($isInTransit ? 'badge-transit' : 'badge-booked');
        $statusText = $isDelivered ? 'Delivered' : ($isInTransit ? 'In Transit' : 'Booked');

        $origin = $waybill->originBranch->branch_name ?? 'Origin Branch';
        $destination = $waybill->destination->city_name ?? ($waybill->destination->branch_name ?? 'Destination');
        $amount = number_format((float)($waybill->grand_total ?? 0), 2);
        $accType = strtoupper($waybill->account_type ?? 'TO PAY');
        $articles = $waybill->total_articles ?? count($waybill->articles ?? []);
        $articleDesc = !empty($waybill->article_desc) ? $waybill->article_desc : 'Boxes / Parcels';
        $weight = $waybill->chargeable_weight ? $waybill->chargeable_weight : ($waybill->actual_weight ? $waybill->actual_weight : null);
        $consignorName = $waybill->consignor->name ?? 'Consignor';
        $consigneeName = $waybill->consignee->name ?? 'Consignee';
    @endphp

    <!-- Sticky Brand Navbar -->
    <header class="top-navbar">
        <div class="navbar-content">
            <div class="brand-logo-area">
                <div class="brand-icon">🚚</div>
                <div class="brand-text">
                    <h1>Sri Mallikarjuna Parcel Service</h1>
                    <p>Live Consignment Tracking</p>
                </div>
            </div>
            <div class="live-tag">
                <span class="pulse-dot"></span>
                <span>Active Track</span>
            </div>
        </div>
    </header>

    <main class="main-container">
        <!-- Main Consignment Summary Card -->
        <div class="card">
            
            <!-- Header: GC Number + Status Badge -->
            <div class="gc-header-row">
                <div>
                    <div class="gc-label">Waybill / GC Number</div>
                    <div class="gc-number">#{{ $waybill->gc_number }}</div>
                </div>
                <div class="status-badge {{ $badgeClass }}">
                    <span>●</span>
                    <span>{{ $statusText }}</span>
                </div>
            </div>

            <!-- Route Visualization -->
            <div class="route-card">
                <div class="route-stop">
                    <div class="stop-tag">Origin</div>
                    <div class="stop-name">{{ $origin }}</div>
                </div>
                <div class="route-connector">
                    <div class="route-arrow-icon">➔</div>
                </div>
                <div class="route-stop" style="text-align: right;">
                    <div class="stop-tag">Destination</div>
                    <div class="stop-name">{{ $destination }}</div>
                </div>
            </div>

            <!-- Shipment Journey Stepper -->
            <div class="section-title">
                <span>📍</span> Consignment Journey Status
            </div>

            <div class="journey-timeline">
                <!-- Step 1: Booked -->
                <div class="timeline-item completed">
                    <div class="timeline-indicator"></div>
                    <div class="timeline-content">
                        <h4>Consignment Booked</h4>
                        <p>Registered at {{ $origin }} on {{ $waybill->bill_date ? date('d M Y', strtotime($waybill->bill_date)) : date('d M Y') }}</p>
                    </div>
                </div>

                <!-- Step 2: In Transit -->
                <div class="timeline-item {{ ($isInTransit || $isDelivered) ? ($isDelivered ? 'completed' : 'active') : '' }}">
                    <div class="timeline-indicator"></div>
                    <div class="timeline-content">
                        <h4>Loaded & In Transit</h4>
                        <p>Dispatched on route {{ $origin }} ➔ {{ $destination }}</p>
                    </div>
                </div>

                <!-- Step 3: Delivered -->
                <div class="timeline-item {{ $isDelivered ? 'completed active' : '' }}">
                    <div class="timeline-indicator"></div>
                    <div class="timeline-content">
                        <h4>{{ $isDelivered ? 'Successfully Delivered' : 'Destination Arrival / Pending Delivery' }}</h4>
                        <p>
                            @if($isDelivered && $waybill->delivered_at)
                                Handed over to consignee on {{ date('d M Y, h:i A', strtotime($waybill->delivered_at)) }}
                            @else
                                Estimated arrival at {{ $destination }}
                            @endif
                        </p>
                    </div>
                </div>
            </div>

            <!-- Consignor & Consignee Details -->
            <div class="section-title">
                <span>👥</span> Consignment Parties
            </div>
            <div class="party-grid">
                <div class="party-box">
                    <div class="party-header">
                        <span>📤</span> Consignor (Sender)
                    </div>
                    <div class="party-name">{{ $consignorName }}</div>
                    <div class="party-sub">{{ $origin }}</div>
                </div>
                <div class="party-box">
                    <div class="party-header">
                        <span>📥</span> Consignee (Receiver)
                    </div>
                    <div class="party-name">{{ $consigneeName }}</div>
                    <div class="party-sub">{{ $destination }}</div>
                </div>
            </div>

            <!-- Specs & Freight Summary -->
            <div class="section-title">
                <span>📦</span> Parcel & Freight Details
            </div>
            <div class="specs-row">
                <div class="spec-card">
                    <div class="spec-title">Quantity</div>
                    <div class="spec-val">{{ $articles }} Pkgs</div>
                </div>
                <div class="spec-card">
                    <div class="spec-title">Weight</div>
                    <div class="spec-val">{{ $weight ? $weight . ' Kg' : 'Standard' }}</div>
                </div>
                <div class="spec-card">
                    <div class="spec-title">Total Freight</div>
                    <div class="spec-val spec-accent">₹{{ $amount }}</div>
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-top: 1px;">{{ $accType }}</div>
                </div>
            </div>

            <!-- Proof of Delivery (POD) Section -->
            @if($isDelivered && !empty($waybill->delivery_proof))
                <div class="pod-box">
                    <h3>📸 Proof of Delivery (POD) Verified</h3>
                    <p>Digital signature / delivery receipt confirmed upon handover</p>
                    @php
                        $podUrl = asset('storage/' . $waybill->delivery_proof);
                    @endphp
                    <img src="{{ $podUrl }}" alt="Delivery Proof" class="pod-preview-img" onerror="this.style.display='none'">
                    <div>
                        <a href="{{ $podUrl }}" target="_blank" class="pod-action-btn">
                            <span>🔍</span> Open Full Resolution Receipt
                        </a>
                    </div>
                </div>
            @elseif($isDelivered)
                <div class="pod-box" style="background: #f8fafc; border-color: #e2e8f0;">
                    <h3 style="color: #334155;">📄 Proof of Delivery (POD)</h3>
                    <p style="color: #64748b; margin-top: 4px;">Physical delivery completed. Signed copy is being processed by the destination branch.</p>
                </div>
            @endif

            <!-- Security Badge -->
            <div class="security-stamp">
                <span>🔒</span> Cryptographically Secured & Verified Consignment
            </div>
        </div>

        <div class="portal-footer">
            &copy; {{ date('Y') }} Sri Mallikarjuna Parcel Service<br>
            Multi-Office Transport & Logistics Solution
        </div>
    </main>

</body>
</html>
