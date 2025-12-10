import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";

// Regular user pages
import Dashboard from "./pages/Dashboard.js";
import MyQR from "./pages/User/MyQR.js";
import Transfer from "./pages/User/Transfer.js";
import Redeem from "./pages/User/Redeem.js";
import UserPromotions from "./pages/User/UserPromotions.js";
import Events from "./pages/User/Events.js";
import EventDetail from "./pages/User/EventDetail.js";
import Transactions from "./pages/User/Transactions.js";
import Wallet from "./pages/User/Wallet";
import Rewards from "./pages/User/Rewards";
import RedeemQR from "./pages/User/RedeemQR";

// Auth pages
import Login from "./pages/Auth/Login.js";
import Profile from "./pages/Auth/Profile.js";

// Cashier pages
import CashierCreate from "./pages/Cashier/CashierCreate.js";
import CashierRedeem from "./pages/Cashier/CashierRedeem.js";

// Manager pages
import ManagerUsers from "./pages/Manager/ManagerUsers.js";
import ManagerTransactions from "./pages/Manager/ManagerTransactions.js";
import ManagerTransactionDetail from "./pages/Manager/ManagerTransactionDetail.js";
import ManagerPromotions from "./pages/Manager/ManagerPromotions.js";
import ManagerEvents from "./pages//Manager/ManagerEvents.js";

// Superuser pages
import SuperAdmin from "./pages/Superuser/SuperAdmin.js";

// Protected Route
import ProtectedRoute from "./Components/ProtectedRoute.js";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Auth-protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-qr"
          element={
            <ProtectedRoute>
              <MyQR />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfer"
          element={
            <ProtectedRoute>
              <Transfer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/redeem"
          element={
            <ProtectedRoute>
              <Redeem />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/redeem-qr/:requestId"
          element={
            <ProtectedRoute>
              <RedeemQR />
            </ProtectedRoute>
          }
        />

        <Route
          path="/promotions"
          element={
            <ProtectedRoute>
              <UserPromotions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:eventId"
          element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rewards"
          element={
            <ProtectedRoute>
              <Rewards />
            </ProtectedRoute>
          }
        />

        {/* Cashier Routes */}
        <Route
          path="/cashier/create"
          element={
            <ProtectedRoute>
              <CashierCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier/redeem"
          element={
            <ProtectedRoute>
              <CashierRedeem />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager/users"
          element={
            <ProtectedRoute>
              <ManagerUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/transactions"
          element={
            <ProtectedRoute>
              <ManagerTransactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/transactions/:id"
          element={
            <ProtectedRoute>
              <ManagerTransactionDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/promotions"
          element={
            <ProtectedRoute>
              <ManagerPromotions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/events"
          element={
            <ProtectedRoute>
              <ManagerEvents />
            </ProtectedRoute>
          }
        />

        {/* Superuser */}
        <Route
          path="/super"
          element={
            <ProtectedRoute>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}

export default App;
