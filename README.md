# 🚚 QuickHaul — Logistics & Goods Transportation Platform

**Fast, Reliable, Transparent Local Transportation.**

QuickHaul is a technology-driven goods transportation platform designed to connect customers and businesses with nearby mini-truck, tempo, and commercial vehicle operators for convenient, affordable, and reliable local logistics.

From small business deliveries to household shifting and commercial cargo transportation, QuickHaul simplifies the process of finding a suitable vehicle, booking a trip, tracking deliveries, and managing transportation operations.

## 🌐 Live Deployment

**Live Application:** https://quickhaul.onrender.com

Explore the deployed QuickHaul application and test the features currently available in the live build.

> **Note:** Login availability, demo accounts, and stored booking data depend on the deployed application's current configuration and database state.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Vehicle Categories](#-vehicle-categories)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Application Workflow](#-application-workflow)
- [Demo Accounts](#-demo-accounts)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Running Tests](#-running-tests)
- [Deployment](#-deployment)
- [Security Considerations](#-security-considerations)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Project Overview

QuickHaul aims to simplify local goods transportation by bringing customers, drivers, and logistics administrators together through a unified digital platform.

Traditional goods transportation can involve multiple phone calls, uncertain pricing, difficulty finding suitable vehicles, and limited visibility into delivery progress. QuickHaul addresses these challenges through a centralized booking and transportation management experience.

The platform is designed around three primary user roles:

- **Customers:** Discover suitable vehicles, book transportation, monitor trips, and access booking information.
- **Drivers:** Manage availability, handle assigned trips, complete delivery verification, and track earnings.
- **Administrators:** Oversee operations, manage driver verification, monitor bookings, and configure platform settings.

## ❗ Problem Statement

Local goods transportation is often fragmented and difficult to manage. Customers may struggle to find the right vehicle at the right time, while drivers face inconsistent demand and limited access to potential customers.

Common challenges include:

- Difficulty locating suitable commercial vehicles.
- Unclear or inconsistent transportation pricing.
- Limited visibility into trip progress.
- Manual coordination between customers and drivers.
- Challenges verifying driver and vehicle documents.
- Lack of centralized booking and operational management.

## 💡 Our Solution

QuickHaul provides a unified digital platform that streamlines the local goods transportation process.

The platform is designed to support:

1. Convenient transportation booking.
2. Vehicle selection based on cargo requirements.
3. Fare calculation and transparent pricing information.
4. Customer, driver, and administrator workflows.
5. Trip status updates and delivery verification.
6. Driver onboarding and document review.
7. Centralized operational management.

The goal is to make local logistics easier to access, simpler to coordinate, and more transparent for everyone involved.

---

## 🚛 Vehicle Categories

QuickHaul is designed to support multiple vehicle categories for different cargo requirements.

| Vehicle category | Typical use case |
|---|---|
| Three-wheeler cargo vehicle | Small parcels and lightweight goods |
| Tata Ace / mini-truck | Local business deliveries and household goods |
| Mahindra Bolero Maxi Truck | Medium-sized cargo and commercial transport |
| Tata 407 / light commercial truck | Larger loads and bulk deliveries |
| Electric cargo vehicle | Suitable local deliveries using electric vehicles |

*Vehicle availability depends on the categories configured in the current application.*

---

## ✨ Key Features

### 👤 1. Customer Portal

The customer experience is designed to make booking and managing local transportation straightforward.

- Customer registration and authentication.
- Guided, multi-step booking workflow.
- Pickup and destination selection.
- Cargo type and load information.
- Vehicle category selection.
- Fare breakdown and applicable charges.
- Booking status and trip information.
- Delivery tracking interface.
- Booking history and invoice access, where implemented.
- Ratings, reviews, and customer support features, where available.

### 🚚 2. Driver Application

The driver experience focuses on availability, trip execution, and earnings visibility.

- Driver registration and authentication.
- Online/offline availability controls, where implemented.
- Assigned-trip and delivery-status management.
- Pickup and delivery verification workflows.
- Driver document submission and verification status.
- Earnings and wallet information, where implemented.
- Withdrawal workflow, where supported by the current implementation.

### 🛡️ 3. Operations & Admin Desk

The administrative experience is designed to centralize platform oversight.

- Administrative authentication and access control.
- Driver onboarding and document verification.
- Booking and dispatch management.
- User and driver management.
- Fare and pricing configuration, where implemented.
- Operational summaries and analytics, where implemented.
- Support and dispute management, where available.

### 📍 4. Maps & Route Visualization

Where enabled in the current build, the platform can use mapping tools to display pickup locations, destinations, and route information.

The mapping interface is intended to improve route visibility and make transportation workflows easier to understand.

### 🔐 5. Authentication & Delivery Verification

QuickHaul is designed to use role-aware authentication and delivery verification workflows.

Features such as JWT-based sessions and pickup/delivery OTP verification should be considered active only where they are implemented and successfully tested in the current version.

### 💰 6. Fare Transparency

The platform is designed to present transportation charges before booking confirmation.

Depending on the configured pricing logic, fare information may include the base fare, distance or vehicle-related charges, applicable taxes, and discounts.

**Important:** Displayed estimates, taxes, coupons, wallet balances, and payment actions should be treated according to the actual application configuration. Do not assume a real payment or bank transfer occurs unless a payment provider has been integrated and verified.

---

## 🏗️ System Architecture

The project is organized into a frontend application, a backend API, and supporting data storage.

```text
quickhaul/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── customer/
│   │   │   ├── driver/
│   │   │   ├── admin/
│   │   │   └── auth/
│   │   ├── context/
│   │   ├── services/
│   │   ├── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── db.js
│   ├── routes.js
│   ├── seedData.js
│   ├── test-suite.js
│   └── server.js
│
├── data/
│   └── quickhaul.db
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

*The tree illustrates the intended high-level organization. Keep the listed directories and files aligned with the actual repository if your project structure has changed.*

### Architecture Overview

**Frontend — `client/`**

Provides the user interface, navigation, role-specific screens, and API communication.

**Backend — `server/`**

Runs the Node.js and Express server, exposes API routes, handles application logic, and coordinates authentication and data operations.

**Database — `data/`**

Contains the SQLite database used by the application, depending on the configured runtime environment.

**API communication**

The frontend communicates with the backend through HTTP requests. The Express application can also serve the production frontend build.

---

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive interface |
| JavaScript | Frontend and backend application logic |
| React | Component-based user interface |
| Vite | Frontend development and build tooling |
| Node.js | Backend JavaScript runtime |
| Express.js | HTTP server and REST API |
| SQLite | Relational data storage |
| JWT | Token-based authentication, if enabled in the current configuration |
| Leaflet / OpenStreetMap | Mapping and route visualization, where configured |
| Git & GitHub | Version control and source-code hosting |
| Render | Application hosting and deployment |

---

## 🔄 Application Workflow

### Customer workflow

1. Open the QuickHaul application.
2. Register or sign in using an available customer account.
3. Enter pickup and destination details.
4. Provide cargo information and choose a suitable vehicle.
5. Review the displayed fare and booking details.
6. Confirm the booking if the relevant workflow is enabled.
7. Follow the trip status through the available interface.
8. Complete delivery and provide feedback if supported.

### Driver workflow

1. Register or sign in using a driver account.
2. Complete the required profile and document steps.
3. Wait for verification if driver approval is required.
4. Manage availability and assigned trips.
5. Follow the configured pickup and delivery workflow.
6. Complete any required delivery verification.
7. Review earnings information if available.

### Administrator workflow

1. Sign in using an authorized administrator account.
2. Review available operational information.
3. Manage driver verification and onboarding.
4. Monitor bookings and trip statuses.
5. Review platform settings and support requests.
6. Perform only those administrative actions enabled by the current implementation.

---

## 🧪 Demo Accounts

The following credentials are **example evaluation credentials from the project documentation**. They are not a guarantee that the accounts exist in the current live database.

| Role | Email | Password |
|---|---|---|
| Customer | `customer@quickhaul.com` | `pass123` |
| Driver | `ramesh.driver@quickhaul.com` | `pass123` |
| Administrator | `admin@quickhaul.com` | `admin123` |

**Before publishing:** Verify these accounts against the current build. Use only disposable demo accounts, and never publish real personal credentials or production passwords.

---

## ⚙️ Getting Started

### Prerequisites

Install the following software before running QuickHaul locally:

- Node.js 20 or a compatible version supported by the project.
- npm.
- Git (optional, for cloning the repository).

Check your installed versions:

```bash
node --version
npm --version
```

### 1. Clone the repository

```bash
git clone https://github.com/thanmayee-7/QuickHaul.git
cd QuickHaul
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file based on `.env.example`, if the example file exists.

```bash
cp .env.example .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

Add the environment values required by your backend configuration. Never commit the `.env` file or real secrets.

### 4. Start the application

```bash
npm start
```

Open the local application at:

**http://localhost:5000**

The root `start` script runs the Express server, which can serve the built frontend when the production build is present.

### 5. Run the frontend in development mode

In one terminal, start the backend:

```bash
node server/server.js
```

In another terminal, run:

```bash
npm run client
```

The Vite development server will start at its configured local address, commonly:

**http://localhost:5173**

The frontend development server may proxy API requests to the backend on port `5000`, depending on the current Vite configuration.

---

## 🔑 Environment Configuration

Environment variables depend on the current backend implementation. Common examples include:

| Variable | Purpose |
|---|---|
| `PORT` | Port used by the backend server |
| `JWT_SECRET` | Secret used to sign authentication tokens, if JWT is enabled |
| Database configuration | Database path or connection settings, if configurable |

Use the actual variable names referenced by your backend code and `.env.example`.

For local development, keep secrets in `.env`. For Render, configure required environment variables through the service's environment settings.

**Never commit secret keys, real credentials, private tokens, or production environment files.**

---

## 🧪 Running Tests

If the project includes the test script at `server/test-suite.js`, run it from the repository root:

```bash
node server/test-suite.js
```

Review the output to confirm which tests passed or failed.

Potential test areas include:

- Backend health endpoint.
- Authentication and role-based access.
- Vehicle category retrieval.
- Fare calculation.
- Booking creation and dispatch.
- Trip status transitions.
- Pickup and delivery verification.
- Driver and administrator workflows.
- Earnings or wallet calculations.
- Reviews and support operations.

**Test coverage depends on the actual test suite.** Do not assume that every item above is covered or that a specific number of tests passes until the current suite confirms it.

---

## 🌍 Deployment

QuickHaul is hosted on Render.

**Live application:** https://quickhaul.onrender.com

### Deployment configuration

| Setting | Value |
|---|---|
| Hosting platform | Render |
| Runtime | Node.js |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Default application port | `5000` |

Render provides the port through the `PORT` environment variable when configured for a web service. The application should listen on that assigned port.

### Database persistence

The project uses SQLite in its local setup. Data stored on an ephemeral hosting filesystem may not survive service replacement or redeployment.

Before using QuickHaul for real customers, configure persistent storage or a suitable managed database, along with backups and a recovery plan.

### Deployment checklist

- [ ] Confirm the production build completes successfully.
- [ ] Confirm the service starts without runtime errors.
- [ ] Verify the live health endpoint, if enabled.
- [ ] Test authentication and the main user workflows.
- [ ] Confirm database persistence requirements.
- [ ] Configure production environment variables securely.
- [ ] Replace or disable demo accounts before public production use.

---

## 🔐 Security Considerations

Security is important for any platform handling customer details, driver information, and transportation bookings.

Before using QuickHaul as a production service:

- Use strong, unique secrets for production authentication.
- Never expose passwords, API keys, or private credentials in source control.
- Enforce authorization checks on protected backend routes.
- Validate user input on the server.
- Validate uploaded files and restrict allowed file types and sizes.
- Protect sensitive customer and driver information.
- Use HTTPS for deployed traffic.
- Configure database backups and appropriate access controls.
- Review authentication, session expiry, and error handling.
- Integrate and test a payment provider before representing payments as real transactions.
- Disable or replace public demo accounts before production use.

This README describes the intended application and its development setup; it is not a security certification.

---

## 🚀 Future Enhancements

Potential areas for future development include:

- More accurate real-time vehicle location integration.
- Enhanced route optimization and distance estimation.
- Additional vehicle categories and regional availability.
- Integration with verified payment gateways.
- Automated SMS, email, and push notifications.
- Improved driver onboarding and document verification.
- Expanded logistics analytics and demand forecasting.
- Stronger fraud detection and abuse prevention.
- Customer loyalty and business accounts.
- Support for additional cities and regions.
- Dedicated mobile applications for customers and drivers.

---

## 🤝 Contributing

Suggestions, bug reports, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the relevant workflows.
5. Submit a pull request describing the changes.

For bug reports, include clear reproduction steps and relevant error messages. Avoid posting credentials, personal information, or other sensitive data in public issues.

---

## 📄 License

No license has been specified in this README.

Until a license is added to the repository, do not assume that the project is licensed for unrestricted reuse, modification, or redistribution.

---

## 💚 About QuickHaul

QuickHaul is designed to make local goods transportation more accessible by connecting customers, drivers, and logistics operations through one platform.

**QuickHaul — Fast, Reliable, Transparent Local Transportation.** 🚚
