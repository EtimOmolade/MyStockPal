import React, { useEffect, useState } from "react";
import UserList from "./UserList";
import { Link, useLocation, useNavigate } from "react-router-dom";

function SuperAdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (location.pathname.includes("/admin/users")) {
      setActiveTab("users");
    } else {
      setActiveTab("dashboard");
    }
  }, [location]);

  return (
    <div className="dashboard-container" style={{ padding: "2rem" }}>
      <h1 style={{ color: "#ff4d4d" }}>🛡️ Super Admin Dashboard</h1>
      <p>Manage users, roles, and system settings.</p>

      <div className="admin-tabs" style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => navigate("/admin")}
          style={{
            backgroundColor: activeTab === "dashboard" ? "#ff4d4d" : "#ddd",
            color: activeTab === "dashboard" ? "white" : "black",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Dashboard Overview
        </button>

        <button
          onClick={() => navigate("/admin/users")}
          style={{
            backgroundColor: activeTab === "users" ? "#ff4d4d" : "#ddd",
            color: activeTab === "users" ? "white" : "black",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          User Management
        </button>
        {/* Future tabs can go here */}
      </div>

      <div className="admin-content">
        {activeTab === "users" && <UserList />}
        {activeTab === "dashboard" && (
          <div>
            <h3>Welcome to the Super Admin Dashboard</h3>
            <p>Select a tab to manage different aspects of the system.</p>
          </div>
        )}
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
