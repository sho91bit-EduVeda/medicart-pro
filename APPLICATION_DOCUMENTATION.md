# Medicart Pro - Application Documentation

## 1. Project Overview
Medicart Pro is a comprehensive e-commerce application designed for the pharmaceutical industry. It allows users to browse medicines, upload prescriptions, and place orders. It also features an owner dashboard for managing inventory, tracking unavailable medicines (demand tracking), and configuring WhatsApp notifications.

## 2. Architecture & Tech Stack

### Core Technologies
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **Charts**: Recharts
- **Platform**: Firebase (Firestore, Authentication, Storage)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage (for prescription uploads)
- **Database**: Firestore

### Services & Integrations
- **WhatsApp Business API**: For notifications and alerts.
- **IPify**: For logging user location (IP) during searches.

## 3. Project Structure

```
/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # External service configs (Firebase)
│   ├── pages/          # Route components (Pages)
│   ├── services/       # Business logic services (WhatsApp)
│   ├── App.tsx         # Main app component & Routing
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── apply_all_migrations.sql # Database schema definition
└── package.json        # Dependencies and scripts
```

## 4. Database Schema

The application uses a PostgreSQL database. Key tables include:

### E-Commerce Core
- **products**: Stores medicine details including brand, type, prescription requirements, expiry date, SKU, and stock.
- **shopping_cart**: Manages items in users' shopping carts.
- **orders**: Stores order information, status, total amount, and delivery details.
- **order_items**: Links products to orders with quantity and price snapshot.

### Features & Tracking
- **prescription_uploads**: Stores metadata for prescriptions uploaded by users, linked to orders.
- **search_logs**: Logs every search query made by users to analyze demand.
- **unavailable_medicines**: Aggregates data on medicines searched for but not found in inventory.
- **whatsapp_settings**: Stores configuration (API keys, phone numbers) for the WhatsApp integration.

## 5. Key Features

### Customer Features
- **Product Browsing**: Users can search and filter medicines.
- **Prescription Upload**: Users can upload prescriptions for medicines that require them.
- **Shopping Cart**: Add/remove items, adjust quantities.
- **Checkout**: Secure checkout process with address management.
- **Order History**: View past orders and their status.

### Owner/Admin Features (`/owner`)
- **Dashboard**: Overview of sales and activity.
- **Inventory Management**: Add, edit, or remove products.
- **Demand Tracking**: View a list of "Unavailable Medicines" that users are searching for, helping to identify stocking needs.
- **WhatsApp Configuration**: Setup and test WhatsApp notifications.

### Unique Capabilities
- **Demand Intelligence**: The system automatically tracks when users search for items that return no results, logging them as "Unavailable Medicines" and notifying the owner via WhatsApp.
- **WhatsApp Alerts**: Real-time notifications for the owner when high-demand items are missing.

## 6. Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd medicart-pro
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Setup**:
    - Create a `.env` file based on `.env.example` (if available).
    - Configure Firebase credentials.

4.  **Database Setup**:
    - The application uses Firebase Firestore for data storage.

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 7. Scripts
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm run preview`: Preview production build.
