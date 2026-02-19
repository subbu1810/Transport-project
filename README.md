# Sri Gadilingeswara Roadlines - Transport Application

A modern, responsive React-based transport management application with a clean and intuitive user interface.

## Features

- **Dashboard**: Overview of key metrics and quick actions
- **Masters Management**: Manage drivers, vehicles, and routes
- **Way Bills**: Create and manage way bills for shipments
- **Accounts**: Track account balances and transactions
- **Trip Sheets**: Monitor trip progress and status
- **E-Way Bills**: Generate and manage electronic way bills
- **Reports**: Generate various reports (Daily, Weekly, Monthly, Annual)
- **Payment Management**: Record and track payments
- **Modern UI**: Clean, responsive design with Tailwind CSS

## Tech Stack

- **Frontend Framework**: React 18
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Vite

## Installation

1. Navigate to the project directory:
```bash
cd "c:\Users\DELL\Desktop\All Projects\Transport project"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   ├── Header.jsx      # Top navigation bar
│   └── Sidebar.jsx     # Left sidebar navigation
├── pages/
│   ├── Dashboard.jsx
│   ├── Masters.jsx
│   ├── WayBill.jsx
│   ├── Accounts.jsx
│   ├── InwardWayBill.jsx
│   ├── TripSheet.jsx
│   ├── EWayBill.jsx
│   ├── ConsignorReport.jsx
│   ├── UnloadReport.jsx
│   ├── ACKReportBundle.jsx
│   ├── ReceivePayment.jsx
│   └── Reports.jsx
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features Overview

### Dashboard
- Key metrics cards (Total Trips, Active Users, Revenue, Growth)
- Recent trips list
- Quick action buttons

### Masters
- Manage drivers, vehicles, and routes
- Add, edit, and delete master records
- Search functionality

### Way Bills
- Create and manage way bills
- Track shipment status
- Download and print way bills

### Reports
- Generate daily, weekly, monthly, and annual reports
- View recent reports
- Export functionality

## Color Scheme

- **Primary**: Green (#4CAF50)
- **Secondary**: Yellow (#FFC107)
- **Success**: Green
- **Warning**: Yellow
- **Error**: Red
- **Info**: Blue

## Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile devices

## Future Enhancements

- Backend API integration
- Real-time notifications
- Advanced filtering and search
- Data export to Excel/PDF
- User authentication and authorization
- Multi-language support
- Dark mode theme

## License

This project is proprietary and confidential.

## Support

For support, please contact the development team.
