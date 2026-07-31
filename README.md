# 🖥️ Smart Transit System - Web Dashboard

This repository contains the administrative Web Dashboard for the Smart Transit System, developed using **Next.js** and styled with **Tailwind CSS**. It serves as the centralized hub for transit managers and administrators to monitor and manage the entire transit network.

## 🚀 Features
- **Fleet Monitoring:** Overview of active buses, their current routes, and live operational status.
- **Route Management:** Create, edit, and assign transit routes to drivers.
- **Financial Analytics:** Integration with **Stripe** to view revenue metrics, ticket sales, and top-up transactions.
- **User Management:** Oversee passenger accounts and driver credentials.
- **Responsive Design:** Clean, modern interface built with Tailwind CSS, optimized for desktop usage.

## 💻 Tech Stack
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS & PostCSS
- **State/Data Fetching:** Axios
- **Payments UI:** Stripe Elements (`@stripe/react-stripe-js`)

## 🛠️ Installation & Setup

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment Variables**
   Create a `.env.local` file and provide the backend API URL and Stripe Publishable Key.
4. **Run the application (Development)**
   ```bash
   npm run dev
   ```
The dashboard will run on `http://localhost:4001` (custom port configured in package.json).
