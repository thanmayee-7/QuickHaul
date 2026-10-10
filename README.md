# 🚚 QuickHaul — Production-Quality Logistics & Goods Transportation Platform

> **"Fast, Reliable, Transparent Local Transportation."**

QuickHaul connects businesses and customers who need local goods movement with nearby verified mini-truck, tempo, and small commercial vehicle drivers (Tata Ace, 3-Wheeler Cargo, Mahindra Bolero Maxi Truck, Tata 407, and Electric Eco-Loaders).

Built as a real, production-ready startup product featuring end-to-end connected frontend, backend REST APIs, persistent SQLite database, role-based JWT authentication, a two-stage OTP verification handshake, telematics route tracking, driver earnings wallet, and an operations admin control desk.

---

## 🌟 Architecture Overview

```
quickhaul/
├── client/                     # High-performance React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Top Header, One-click Persona Switcher, Leaflet Route Map
│   │   │   ├── customer/       # Customer Portal: 4-Step Booking, Live Tracking, Invoices, Support
│   │   │   ├── driver/         # Driver App: Online/Offline, Mission Control, OTP Verification, Wallet
│   │   │   ├── admin/          # Admin Desk: Fleet KPIs, Document Verification Desk, Pricing Config
│   │   │   └── auth/           # Login / Register Modal for Customer & Driver Onboarding
│   │   ├── context/            # AuthContext & Session Management
│   │   ├── services/           # Unified API Client (`api.js`)
│   │   ├── index.css           # Bespoke QuickHaul CSS Design System (Zero Tailwind dependency)
│   │   ├── App.jsx             # Main Application Container
│   │   └── main.jsx
│   ├── index.html              # Branded HTML with Plus Jakarta Sans & Leaflet CSS
│   └── vite.config.js          # Dev server with reverse proxy to Express on port 5000
│
├── server/                     # Production Express REST API Backend
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, JWT Generation, Profile
│   │   ├── vehicleController.js    # 5 Vehicle Categories, Transparent Fare Calculation Formula
│   │   ├── bookingController.js    # Smart Driver Matching, Trip Lifecycle, OTP Handshake, Tracking
│   │   ├── driverController.js     # Availability Toggle, Document Upload, Earnings & Payout Ledger
│   │   ├── adminController.js      # Platform KPIs, Document Verification Desk, User Moderation
│   │   ├── paymentController.js    # Payment Processing & Ledger Entries
│   │   ├── reviewController.js     # Customer Ratings & Driver Score Aggregation
│   │   ├── supportController.js    # Customer/Driver Ticket Submission & Admin Resolution
│   │   └── notificationController.js# Real-time Notifications & Polling
│   ├── middleware/
│   │   └── auth.js                 # JWT Verification & Role-based Access Control
│   ├── db.js                       # SQLite Connection, WAL Mode, Foreign Keys & Schema Migration
│   ├── routes.js                   # Unified API Routing Table
│   ├── seedData.js                 # Realistic Startup Seed Data (Drivers, Vehicles, Bookings)
│   ├── test-suite.js               # 14-Step Automated End-to-End Test Suite
│   └── server.js                   # Express Server Entrypoint & Static Frontend Delivery
│
├── data/
│   └── quickhaul.db                # Persistent SQLite Database
├── .env                            # Environment Configuration
├── package.json
└── README.md
```

---

## 🔑 Evaluator One-Click Persona Switcher

The application features a sticky top banner allowing instant switching between all personas:

| Persona | Role | Default Credentials | Key Features to Test |
| :--- | :--- | :--- | :--- |
| **Alex Morgan** | `customer` | `customer@quickhaul.com` / `pass123` | Book a Truck, customize goods & weight, review transparent fare breakdown, track live trip, view tax invoice |
| **Ramesh Kumar** | `driver` | `ramesh.driver@quickhaul.com` / `pass123` | Go Online/Offline, accept nearby dispatch, advance trip stages (arrived -> load -> transit -> drop -> verify OTP), view wallet & request payout |
| **Vikram Singh** | `driver` | `vikram.driver@quickhaul.com` / `pass123` | Pending verification demo (inspect documents uploaded for Tata 407 Heavy container) |
| **Operations Desk** | `admin` | `admin@quickhaul.com` / `admin123` | Platform GMV & Revenue KPIs, Approve/Reject driver documents, live city dispatch oversight, edit base fare & per-km pricing |

---

## 🚀 Core Systems & Features

### 1. Customer App
- **4-Step Booking Engine**:
  1. *Location*: Interactive pickup/drop with popular logistics hubs (Koramangala, Whitefield, Electronic City, Peenya, Yeshwanthpur) and live route distance calculation.
  2. *Vehicle Fleet*: 3-Wheeler Cargo, Tata Ace (Chota Hathi), Electric Eco-Loader, Bolero Maxi Truck, and Tata 407 with dimensions, payload capacity, and nearby online driver counts.
  3. *Cargo Details*: Category selector (Furniture, Electronics, Hardware, FMCG, Machinery), weight slider, loading helper assistance (+₹150-₹300), and fragile goods insurance protection.
  4. *Transparent Fare Calculation*: Exact breakdown of Base Fare, Distance Fare, Helper Charge, Fragile Handling, GST (5% logistics tax), coupon codes (`QUICK50` or `FIRSTHAUL`), and total fare.
- **Two-Stage Security OTPs**: Generates confidential 4-digit Pickup Loading OTP and Delivery OTP to ensure cargo safety.
- **Interactive Route Tracking**: OpenStreetMap / Leaflet map with animated vehicle position and live progress bar.
- **Invoices & Receipts**: Printable tax invoice with GSTIN breakdown and company details.
- **Review System**: 5-star rating with driver performance feedback.
- **Support Desk**: File dispute or inquiry tickets with priority levels.

### 2. Driver App
- **Availability Toggle**: Instant Online / Offline switch persisted in the database.
- **Mission Control**: Active trip navigation, pickup/drop addresses, customer contact, and stage advancement.
- **Two-Stage OTP Verification**: Enforces entering the customer's 4-digit pickup code before loading goods, and the recipient's 4-digit code before marking completed.
- **Wallet & Payouts**: Automated crediting of 85% net fare upon delivery completion, earnings summary, and instant withdrawal to UPI / Bank accounts.
- **Verification Desk**: Upload and view Commercial Driving License, Vehicle RC, Goods Insurance, and National ID.

### 3. Operations Admin Desk
- **Platform Analytics**: Real-time Gross Merchandise Value (GMV), QuickHaul Commission Revenue, Active Trips in transit, and Driver Utilization.
- **Driver Verification Center**: Inspect uploaded DL, RC, Insurance, and National ID side-by-side with one-click **Approve** or **Reject with Reason**.
- **Live Dispatch Oversight**: Monitor all citywide bookings with search and status filters.
- **Dynamic Fare Configuration**: Adjust Base Fare, Per-KM Rates, Helper Rates, and Platform Commission % in real-time.
- **User Moderation**: View all registered customers and drivers, with instant one-click account suspension or activation.
- **Dispute Resolution**: Review support tickets, draft responses, and mark tickets as resolved.

---

## 🛠️ Running the Platform Locally

### Quick Start
1. **Install Root Dependencies**:
   ```powershell
   npm install
   ```

2. **Start Backend & Platform**:
   ```powershell
   npm start
   ```
   The platform will be running at `http://localhost:5000` (serving both the Express REST API and the compiled modern React client).

3. **Development Mode (with HMR)**:
   - Backend: `node server/server.js` (port 5000)
   - Frontend: `npm run client` (Vite dev server on port 5173 with automatic `/api` proxy)

---

## 🧪 Automated End-to-End Test Suite

Run the full platform test suite covering all 14 requirements:
```powershell
node server/test-suite.js
```

### Verified Test Cases:
1. `System Health Check`
2. `Vehicle Categories & Rate Specs`
3. `Transparent Fare Estimation Formula`
4. `Customer Authentication`
5. `Driver Authentication`
6. `Operations Admin Authentication`
7. `Customer Booking Dispatch & Smart Driver Matching`
8. `Telematics Live Tracking & Waypoints`
9. `Driver Trip Workflow Lifecycle with Two-Stage OTP Validation`
10. `Driver Wallet Settlement & Instant Payout`
11. `Customer Rating & Driver Score Aggregation`
12. `Support & Dispute Ticket Submission and Admin Resolution`
13. `Admin Driver Verification Review`
14. `Admin Operations KPIs & Platform Financials`
