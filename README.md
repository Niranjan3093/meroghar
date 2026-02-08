# MeroGhar – Rental Management System

A complete full-stack rental management platform built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🎉 Project Status: COMPLETED ✅

The complete MERN stack application has been created with all core features implemented!

## 🚀 Quick Start

**For a quick 5-minute setup guide, see [QUICKSTART.md](./QUICKSTART.md)**

**For detailed documentation, see [SETUP.md](./SETUP.md)**

### Installation Commands

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** after setup!

---

## Overview
MeroGhar is a full-cycle rental management platform that connects Hosts (property owners), Tenants (rent seekers), and Admins (system overseers). The system manages the complete lifecycle of rental properties: user onboarding, property listing, tenant discovery, communication, lease execution, payments, active rental tracking, renewals, archival, analytics, and AI-driven optimizations.

This README defines **all functional flows, system behaviors, roles, automations, and data handling rules** required to build the complete software system. It is intended for developers, system architects, and AI code generation tools.

---

## User Roles

### 1. Host
- Manages property listings
- Communicates with tenants
- Approves inquiries
- Receives rent and deposits
- Manages maintenance
- Handles lease renewals
- Views earnings and analytics

### 2. Tenant
- Browses and searches properties
- Requests viewings or leases
- Communicates with hosts
- Signs digital contracts
- Pays rent and deposits
- Logs maintenance issues
- Rates properties and hosts

### 3. Admin
- Verifies users and properties
- Monitors platform activity
- Manages reported or suspicious listings
- Oversees compliance and audits
- Accesses analytics and reports

---

## User Registration & Authentication

1. User selects role: Host, Tenant, or Admin
2. Signup methods:
   - Email
   - Phone
   - OAuth (Google / Facebook)
3. Email and phone verification required
4. Account activated after verification
5. Role-based dashboard loaded:
   - Host → Manage Properties
   - Tenant → Find Rentals
   - Admin → Monitor & Verify Listings

---

## Property Listing Creation (Host)

1. Host selects **Add Property**
2. Property form fields:
   - Property type (apartment, room, office, etc.)
   - Location
   - Rent amount
   - Security deposit
   - Lease duration
   - Available date
   - Photos
   - Verification documents
3. System checks:
   - Required field validation
   - Image validation
   - Optional AI photo analysis (blurry/inappropriate detection)
4. Admin verification workflow
5. Upon approval:
   - Listing status → Active
   - Property visible on public feed and map

---

## Tenant Browsing & Search

1. Search capabilities:
   - Price range
   - Amenities
   - Location
   - Lease duration
2. Map view:
   - Property markers
   - Heatmaps of availability
3. Property detail view includes:
   - Images
   - Rent details
   - Availability calendar
   - Host ratings and reviews
   - Request Lease / Book Viewing options
4. Tenant interest logged for analytics and recommendations
5. Future trust features:
   - Tenant income verification
   - Criminal record verification (planned)

---

## Inquiry & Communication

1. Tenant sends inquiry
2. Host receives notification
3. Real-time chat enabled (Socket.io)
4. Host actions:
   - Schedule viewing
   - Send rental offer
   - Confirm tenant request

---

## Lease Contract & Payment

1. Upon agreement:
   - System generates digital lease (PDF)
2. Lease includes:
   - Host and tenant details
   - Start and end dates
   - Monthly rent
   - Security deposit
   - Rules and renewal conditions
3. Tenant digitally signs:
   - DocuSign or in-app signature
4. Payments:
   - First month rent + deposit
   - Payment gateways: Khalti / eSewa
5. Payment verification:
   - Stored in transaction history
6. Status updates:
   - Lease → Active
   - Property → Rented (Unavailable)

---

## Active Rental Period

1. Rental timer starts based on lease duration
2. Monthly automation:
   - Rent reminders
   - Digital rent receipts
   - Payment ledger updates
3. Host capabilities:
   - Add maintenance costs
   - Add utilities and expenses
4. Tenant capabilities:
   - Log maintenance issues
   - Upload photos
   - Rate maintenance response

---

## Maintenance & Issue Lifecycle

1. Tenant submits issue:
   - Description
   - Photos
2. Notifications sent to host/maintenance staff
3. Issue states:
   - Pending
   - In Progress
   - Resolved
4. Tenant confirms resolution
5. Records stored in Property Maintenance History

---

## Lease Expiry & Renewal

1. 14 days before lease end:
   - Renewal reminder sent to host and tenant
2. Host options:
   - Renew lease
   - End lease
3. If renewed:
   - New contract auto-generated
   - Lease status → Renewed
   - Property remains rented
4. If ended:
   - Lease status → Expired
   - Property → Inactive

---

## Post-Expiry Automation

1. 7 days after expiry:
   - Reactivation reminder sent to host
2. 30 days after expiry:
   - Listing auto-archived
   - Data retained (not deleted)
3. Admin access:
   - Archived records for audit and disputes

---

## Review & Rating System

1. After lease completion:
   - Tenant rates:
     - Property
     - Host
   - Host rates tenant behavior
2. Ratings affect:
   - User profiles
   - Search ranking
   - AI recommendations

---

## Data Retention & Analytics

1. Archived data used for analytics:
   - Average rental duration
   - Lease renewal rate
   - Monthly revenue per host
   - Property occupancy rate
2. Predictive analytics (monthly):
   - Rent price suggestions
   - Optimal lease duration
   - Tenant retention likelihood

---

## AI & Smart Features

1. Recommendation Engine:
   - Personalized property suggestions
2. Dynamic Pricing:
   - Rent suggestions based on market, season, location
3. Review Analyzer:
   - Extracts common complaint themes
4. Fraud Detection:
   - Duplicate listings
   - Fake accounts
   - Unrealistic pricing

---

## Admin Dashboard & Controls

1. Admin dashboard shows:
   - Active vs expired leases
   - Average rent by city
   - Most active landlords
   - Flagged listings
2. Admin actions:
   - Deactivate listings
   - Ban users
   - Approve high-value properties
   - Export reports (CSV/PDF)

---

## Audit Trail & Compliance

1. All actions logged:
   - Leases
   - Payments
   - Messages
2. Data retained for 2–3 years
3. Admin-only audit access
4. Historical exports supported

---

## System Timeline Automation

| Event | Action | Notification | Status |
|-----|------|------------|-------|
| Lease Start | Contract activated | Host & Tenant | Active |
| T - 14 days | Renewal reminder | Host & Tenant | Pending Renewal |
| Lease End | Lease expired | Host & Tenant | Expired |
| +7 days | Reactivation reminder | Host | Expired |
| +30 days | Auto archive | System | Archived |

---

## Example User Journeys

### Tenant
Register → Browse → Inquiry → Contract → Pay → Move in → Pay rent → Renew/Exit → Review → Archive

### Host
Register → List property → Approve tenant → Contract → Receive rent → Maintenance → Renewal → Archive → Analytics

---

## Future Enhancements (Planned)

- Blockchain-based contract ledger
- IoT smart lock integration
- AI voice assistant chatbot
- Automated market rent alerts

---

## Notes
- All archived data is preserved, not deleted
- System is modular and supports AI-first extensibility
- Designed for scalability, compliance, and auditability
