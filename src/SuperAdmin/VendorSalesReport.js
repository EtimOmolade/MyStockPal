import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

function VendorSalesReport() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");

  useEffect(() => {
    const fetchVendorHistory = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "history"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHistory(data);
      } catch (error) {
        console.error("Error fetching vendor history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorHistory();
  }, []);

  // Grouped Data
  const groupedData = useMemo(() => {
    const groups = {};

    history.forEach(item => {
      // Only include Sales and Damages in this report
      if (item.action !== "Sold" && item.action !== "Damaged") return;

      let dateKey = "Unknown";
      if (item.date) {
        const d = item.date.seconds ? new Date(item.date.seconds * 1000) : new Date(item.date);
        dateKey = d.toISOString().split('T')[0];
      }

      // If no vendorName, classify as "Shop"
      const vendorKey = (item.vendorName && item.vendorName.trim() !== "") ? item.vendorName : "Shop";

      if (startDate && dateKey < startDate) return;
      if (endDate && dateKey > endDate) return;
      if (vendorFilter !== "all" && vendorKey !== vendorFilter) return;

      const key = `${dateKey}_${vendorKey}`;
      if (!groups[key]) {
        groups[key] = { date: dateKey, vendor: vendorKey, total: 0, items: 0, damaged: 0 };
      }

      if (item.action === "Sold") {
        groups[key].total += Number(item.amount || 0);
        groups[key].items += Number(item.quantity || 0);
      } else if (item.action === "Damaged") {
        groups[key].damaged += Number(item.quantity || 0);
      }
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date) || a.vendor.localeCompare(b.vendor));
  }, [history, startDate, endDate, vendorFilter]);

  const activeVendorsCount = useMemo(() => {
    const vendors = new Set(groupedData.map((item) => item.vendor));
    return vendors.size;
  }, [groupedData]);

  const grandTotal = useMemo(() => {
    return groupedData.reduce((sum, item) => sum + item.total, 0);
  }, [groupedData]);

  // Unique Vendors for Dropdown
  const uniqueVendors = useMemo(() => {
    const vendors = new Set();
    history.forEach(item => {
      if (item.action === "Sold" || item.action === "Damaged") {
        const name = (item.vendorName && item.vendorName.trim() !== "") ? item.vendorName : "Shop";
        vendors.add(name);
      }
    });
    return Array.from(vendors).sort();
  }, [history]);

  // Helper for consistent date formatting: "05 Jan 2026"
  const formatDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === "Unknown") return "Unknown Date";
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, "0");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setVendorFilter("all");
  };

  if (loading) return <p style={{ textAlign: "center", padding: "20px" }}>Loading Report Data...</p>;

  return (
    <div className="vendor-report">
      {/* Summary Highlight */}
      <div className="summary-cards" style={{ marginBottom: "2rem" }}>
        <div className="card" style={{ borderLeft: "5px solid #4CAF50" }}>
          <h3 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>Revenue (Filtered)</h3>
          <p style={{ margin: "10px 0 0 0", fontSize: "1.8rem" }}>₦{grandTotal.toLocaleString()}</p>
        </div>
        <div className="card" style={{ borderLeft: "5px solid #7209b7" }}>
          <h3 style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>Active Vendors</h3>
          <p style={{ margin: "10px 0 0 0", fontSize: "1.8rem" }}>{activeVendorsCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="filter-container"
        style={{
          background: "rgba(255,255,255,0.03)",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "15px",
        }}
      >
        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px", display: "block" }}>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px", display: "block" }}>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px", display: "block" }}>Select Vendor</label>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
            <option value="all">All Vendors</option>
            {uniqueVendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={resetFilters}
          style={{
            background: "#333",
            color: "#fff",
            padding: "10px 15px",
            height: "45px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="table-container hide-mobile">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor Name</th>
              <th>Revenue (₦)</th>
              <th>Items Sold</th>
              <th>Items Damaged</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "40px", opacity: 0.5 }}>
                  No data matches your search filters.
                </td>
              </tr>
            ) : (
              groupedData.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "500" }}>{formatDateDisplay(row.date)}</td>
                  <td style={{ color: "#bb86fc", fontWeight: "600" }}>{row.vendor}</td>
                  <td style={{ color: "#4CAF50", fontWeight: "bold" }}>₦{row.total.toLocaleString()}</td>
                  <td style={{ opacity: 0.7 }}>{row.items} items</td>
                  <td style={{ color: row.damaged > 0 ? "#ff5252" : "inherit", opacity: row.damaged > 0 ? 1 : 0.5 }}>
                    {row.damaged > 0 ? `${row.damaged} damaged` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="show-mobile">
        {groupedData.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>No data for selected filters.</p>
        ) : (
          groupedData.map((row, idx) => (
            <div
              key={idx}
              className="card"
              style={{ textAlign: "left", marginBottom: "15px", borderLeft: "4px solid #7209b7" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.85rem", color: "#888" }}>{formatDateDisplay(row.date)}</span>
                <span style={{ fontSize: "0.85rem", color: "#888" }}>{row.items} items</span>
              </div>
              <p style={{ margin: "5px 0", fontSize: "1.1rem", color: "#bb86fc", fontWeight: "600" }}>{row.vendor}</p>
              <p style={{ margin: "5px 0", fontSize: "1.2rem", color: "#4CAF50", fontWeight: "bold" }}>₦{row.total.toLocaleString()}</p>
              {row.damaged > 0 && (
                <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#ff5252" }}>⚠ {row.damaged} items damaged</p>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .vendor-report {
          animation: fadeIn 0.5s ease-out;
        }
        .show-mobile { display: none; }
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .show-mobile { display: block; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default VendorSalesReport;
