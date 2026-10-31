<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invalid Tracking Link — Sri Mallikarjuna Parcel Service</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .card {
            background: white;
            max-width: 460px;
            width: 100%;
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
            border: 1px solid #e2e8f0;
        }
        .icon-circle {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: #fef2f2;
            color: #ef4444;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 32px;
        }
        h1 {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
        }
        p {
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .security-badge {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 12px;
            color: #475569;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 20px;
        }
        .company-foot {
            font-size: 12px;
            color: #94a3b8;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-circle">🔒</div>
        <h1>Tracking Link Access Denied</h1>
        <div class="security-badge">
            🛡️ Protected by Cryptographic Token Verification
        </div>
        <p>{{ $message ?? 'This tracking link is invalid or has been modified. Each tracking link is encrypted and locked strictly to its authorized consignment.' }}</p>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Please tap the original, unmodified link sent directly to your WhatsApp to view this consignment.</p>
        <div class="company-foot">
            🚚 Sri Mallikarjuna Parcel Service
        </div>
    </div>
</body>
</html>
