import React from "react";
import { useAuth } from "../Contexts/AuthContext";

import UserDashboard from "./User/UserDashboard";
import CashierDashboard from "./Cashier/CashierDashboard";
import ManagerDashboard from "./Manager/ManagerDashboard";
import OrganizerDashboard from "./Organizer/OrganizerDashboard";
import SuperAdminDashboard from "./Superuser/SuperAdmin";

export default function Dashboard() {
  const { activeRole } = useAuth();

  switch (activeRole) {
    case "cashier":
      return <CashierDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "organizer":
      return <OrganizerDashboard />;
    case "superuser":
      return <SuperAdminDashboard />;
    case "regular":
    default:
      return <UserDashboard />;
  }
}
