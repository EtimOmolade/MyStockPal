import React, { useEffect, useState } from "react";
import UserList from "./UserList";
import VendorSalesReport from "./VendorSalesReport";
import { Link, useLocation, useNavigate } from "react-router-dom";

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location]);

  return (
    <div className="dashboard-container" style={{ padding: "2rem" }}>
      <h1 style={{ color: "#ff4d4d" }}>🛡️ Super Admin Dashboard</h1>
      <p>Manage users, roles, and system settings.</p>

      <div className="admin-tabs" style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => navigate("/admin?tab=dashboard")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "dashboard" ? "#ff4d4d" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          📊 Dashboard Overview
        </button>
        <button
          onClick={() => navigate("/admin?tab=users")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "users" ? "#ff4d4d" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          👥 User Management
        </button>
        {/* Future tabs can go here */}
      </div>

      <div className="admin-content">
        {activeTab === "users" && <UserList />}
        {activeTab === "dashboard" && <VendorSalesReport />}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/dashboard">
          <button>⬅ Back to Main Dashboard</button>
        </Link>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
