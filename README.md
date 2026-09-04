# KisanSetu (किसान सेतु)

### Smart Procurement & Queue Intelligence Platform

**Smart India Hackathon (SIH) Project**

---

## 1. Overview

**KisanSetu** is a smart procurement and queue intelligence platform designed to eliminate long and uncertain waiting times at agricultural procurement centers, provide real-time visibility into center load and queue conditions, simplify procurement center selection, streamline slot booking, and ensure end-to-end transparency during procurement operations.

---

## 2. Problem Statement

- **Long and Uncertain Waiting Times**: Farmers face unpredictable and lengthy wait times at procurement centers during peak harvest seasons.
- **Limited Visibility into Center Load & Queue Conditions**: Farmers lack real-time visibility into procurement center queues, operational loads, and processing status before traveling.
- **Difficulty Choosing an Efficient Procurement Center**: Without centralized queue intelligence, farmers struggle to identify less congested or optimal nearby procurement centers.
- **Inefficient Slot and Queue Management**: Manual or uncoordinated queueing leads to bottlenecks, chaotic arrivals, and administrative delays.
- **Limited Transparency during Procurement Processing**: Lack of real-time status tracking creates uncertainty across verification, weighing, and receipt generation.

---

## 3. The Solution

KisanSetu unifies Farmers, Procurement Center Operators, District Admins, and Super Admins on a streamlined platform:

- **Slot Booking**: Farmers schedule guaranteed time-slots matched against procurement center handling capacity.
- **Digital Token**: Automated, tamper-proof digital tokens providing seamless entry and live queue tracking.
- **Live Queue Intelligence**: Real-time visibility into procurement center load conditions (Low / Medium / High) and estimated wait times to help farmers choose optimal centers.
- **Procurement Tracking**: Transparent step-by-step tracking across gate check-in, moisture inspection, weighbridge recording, and receipt generation.
- **District Admin & Super Admin Oversight**: Centralized dashboards to monitor center throughput, queue velocity, and district-wide procurement quotas.

---

## 4. Current Tech Stack (Free & Open Source Only)

| Layer                       | Technologies                          | Notes                                                                 |
| :-------------------------- | :------------------------------------ | :-------------------------------------------------------------------- |
| **Markup & Structure**      | HTML5 (Semantic)                      | Standard accessible web structure                                     |
| **Styling & Design System** | Custom CSS3 + Tailwind CSS CDN        | Gov-Tech design tokens, reusable components, zero build step required |
| **Typography & Icons**      | Google Fonts (Inter) + Lucide Icons   | Open-source, free-tier typography & SVG icons                         |
| **Client-Side Logic**       | JavaScript (ES6+)                     | Vanilla modular architecture (`mock-data.js`, `utils.js`, `api.js`)   |
| **Future Visualizations**   | Chart.js & Leaflet.js / OpenStreetMap | Fully open-source charts and maps (upcoming phases)                   |
| **Future Backend**          | Python 3.11+, FastAPI, SQLAlchemy     | High-performance RESTful microservice (upcoming phase)                |

---

## 5. Project Directory Structure

```text
kisansetu/
├── frontend/
│   ├── index.html              # Foundation entry point & verification layout
│   ├── pages/                  # Future generic public pages
│   ├── farmer/                 # Farmer portal (Slot Booking, Digital Token, status)
│   ├── operator/               # Procurement Center Operator portal (verification, weighing)
│   ├── admin/                  # District Admin & Super Admin dashboard
│   ├── css/
│   │   └── style.css           # Core Gov-Tech design system & tokens
│   ├── js/
│   │   ├── mock-data.js        # Minimal realistic mock data blueprints
│   │   ├── utils.js            # Reusable formatting, queue & DOM helpers
│   │   └── api.js              # Clean API abstraction layer (mock/FastAPI ready)
│   └── assets/                 # Icons, illustrations, and images
│
├── backend/                    # Placeholder for future FastAPI services
├── docs/                       # Architectural diagrams and documentation
├── .gitignore                  # Git ignore definitions
└── README.md                   # Project overview and documentation
```

---

## 6. Current Development Phase

**Phase 1: Frontend Foundation & Design System (Completed)**

- [x] Gov-Tech & Agri-Intelligence design tokens (CSS custom properties for colors, typography, spacing).
- [x] Standardized component library (Buttons, Cards, Queue Badges, Form controls, Alerts).
- [x] ES6 JavaScript modular baseline (`mock-data.js`, `utils.js`, `api.js`).
- [x] Temporary foundation verification page (`index.html`).
- [x] Zero-dependency, zero-build setup for maximum portability and rapid competition iteration.

**Upcoming Milestones:**

- **Phase 2**: Public Landing Page with responsive navigation and platform highlights.
- **Phase 3**: Farmer Self-Service Portal (Center discovery, Slot Booking, Digital Token pass).
- **Phase 4**: Procurement Center Operator Desk & Live Queue Processing.
- **Phase 5**: District Admin & Super Admin Analytics Dashboard.
- **Phase 6**: FastAPI Backend Integration & Database Persistence.

---

## 7. Running the Frontend Foundation

Because this phase relies strictly on standard web technologies without heavyweight build tools, you can run the project immediately:

1. Navigate to the `frontend/` directory.
2. Open `index.html` in any modern web browser (or use VS Code's **Live Server** extension).
3. The page will verify that the CSS design tokens, utility helpers, and mock API abstraction load cleanly.
