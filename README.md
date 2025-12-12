# CacheBack Reward System

A comprehensive loyalty program application for uoft students, featuring role-based access control, event management, point tracking, and analytics.

## 🚀 Deployed Application

**URL:** [https://frontend-production-87f5.up.railway.app](https://frontend-production-87f5.up.railway.app)

## 🔑 Demo Credentials

Use these accounts to test the different roles and functionalities:

| Role             | Username (UTORid) | Password      | Features                                                       |
| ---------------- | ----------------- | ------------- | -------------------------------------------------------------- |
| **Regular User** | `regularuser`     | `Regular123!` | View points, transaction history, join events, redeem rewards. |
| **Cashier**      | `cashieruser`     | `Cashier123!` | Scan QR codes, process purchases, redeem points for users.     |
| **Manager**      | `manageruser`     | `Manager123!` | Create events/promotions, view analytics, manage users.        |
| **Superuser**    | `superuser`       | `Super123!`   | Full system access, including sensitive admin features.        |

## 🛠️ Features

- **User Dashboard**: Real-time point tracking, transaction history visualization, and profile management.
- **Event Management**: RSVP system, capacity tracking, and QR code check-in.
- **Promotions**: Automatic point multipliers and one-time bonus campaigns.
- **Role-Based Access**: Secure JWT authentication with specific permissions for Managers and Cashiers.
- **Mobile Responsive**: Fully responsive design for on-the-go access.

## 💻 Tech Stack

- **Frontend**: React, Chart.js, CSS Modules
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: SQLite
- **Deployment**: Railway

## 📦 Local Development

### Backend

```bash
cd Backend
npm install
npx prisma migrate dev
node prisma/seedAll.js # Seed database
node index.js
```

### Frontend

```bash
cd Frontend/loyalty-program
npm install
npm start
```
