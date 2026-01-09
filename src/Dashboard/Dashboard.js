import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";

// Helper — format Firestore timestamp
const formatTimestamp = (ts) => {
  if (!ts) return "—";
  if (ts.seconds && typeof ts.seconds === "number") {
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleString();
  }
  return ts.toDate ? ts.toDate().toLocaleString() : "—";
};

// Generate recent month options dynamically
const getRecentMonths = (count = 12) => {
  const now = new Date();
  const months = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1–12
    const label = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    months.push({ value: `${year}-${month}`, label });
  }
  return months;
};

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [revenues, setRevenues] = useState({});
  const [soldStats, setSoldStats] = useState({});
  const [damagedStats, setDamagedStats] = useState({});
  const [stockDetails, setStockDetails] = useState({});
  const [filter, setFilter] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  });

  const monthOptions = getRecentMonths(12);

  // ✅ Fetch products in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(list);
    }, (err) => console.error("Error fetching products:", err));
    return () => unsubscribe();
  }, []);

  // ✅ Fetch and filter history in real-time
  useEffect(() => {
    if (products.length === 0) return;

    const unsubscribe = onSnapshot(query(collection(db, "history"), orderBy("date", "desc")), (snapshot) => {
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const now = new Date();
      const [year, month] = selectedMonth.split("-").map(Number);

      const filteredRecords = records.filter((r) => {
        if (!r.date?.seconds) return false;
        const recordDate = new Date(r.date.seconds * 1000);

        if (filter === "daily") {
          return recordDate.toDateString() === now.toDateString();
        } else if (filter === "weekly") {
          const firstDayOfWeek = new Date(now);
          const dayOfWeek = now.getDay();
          const distanceToMonday = (dayOfWeek + 6) % 7;
          firstDayOfWeek.setDate(now.getDate() - distanceToMonday);
          firstDayOfWeek.setHours(0, 0, 0, 0);
          return recordDate >= firstDayOfWeek && recordDate <= now;
        } else if (filter === "monthly") {
          return (
            recordDate.getFullYear() === year &&
            recordDate.getMonth() + 1 === month
          );
        } else if (filter === "yearly") {
          return recordDate.getFullYear() === now.getFullYear();
        } else {
          return true;
        }
      });

      const revenueMap = {};
      const soldMap = {};
      const damagedMap = {};
      const stockAddedMap = {};

      filteredRecords.forEach((r) => {
        const pid = r.productId;
        if (!pid) return;

        if (r.action === "Sold") {
          soldMap[pid] = (soldMap[pid] || 0) + Number(r.quantity || 0);
          const product = products.find((p) => p.id === pid);
          if (product) {
            const earned = r.amount ? Number(r.amount) : (Number(r.quantity || 0) * (product.price || 0));
            revenueMap[pid] = (revenueMap[pid] || 0) + earned;
          }
        }

        if (r.action === "Damaged") {
          damagedMap[pid] = (damagedMap[pid] || 0) + Number(r.quantity || 0);
        }

        if (r.action === "Stock Added" && !stockAddedMap[pid]) {
          stockAddedMap[pid] = {
            quantity: r.quantity,
            date: r.date,
          };
        }
      });

      setStockDetails(stockAddedMap);
      setRevenues(revenueMap);
      setSoldStats(soldMap);
      setDamagedStats(damagedMap);
    });

    return () => unsubscribe();
  }, [filter, products.length, selectedMonth]);

  // ✅ Totals
  const totalStock = products.reduce((a, p) => a + (p.total || 0), 0);
  const totalSold = Object.values(soldStats).reduce((a, b) => a + b, 0);
  const totalDamaged = Object.values(damagedStats).reduce((a, b) => a + b, 0);
  const totalRevenue = Object.values(revenues).reduce((a, b) => a + b, 0);

  return (
    <div className="dashboard-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 className="dashboard-title" style={{ margin: 0 }}>📊 Stock Overview</h2>
        <Link to="/admin?tab=integrity">
          <button className="view-btn" style={{ background: "#ff4d4d", color: "white", padding: "10px 15px" }}>
            🔍 Run Stock Integrity Audit
          </button>
        </Link>
      </div>

      {/* ✅ Filter Controls */}
      <div className="filter-controls">
        <label>Filter by:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Time</option>
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">By Month</option>
          <option value="yearly">This Year</option>
        </select>

        {/* ✅ Month selector (visible only for monthly filter) */}
        {filter === "monthly" && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-select"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ✅ Summary Cards */}
      <div className="summary-cards">
        <div className="card animate-card">
          <h3>Total Stock</h3>
          <p>
            <CountUp end={totalStock} duration={1} separator="," />
          </p>
        </div>
        <div className="card animate-card">
          <h3>Total Sold</h3>
          <p>
            <CountUp end={totalSold} duration={1} separator="," />
          </p>
        </div>
        <div className="card animate-card">
          <h3>Total Damaged</h3>
          <p>
            <CountUp end={totalDamaged} duration={1} separator="," />
          </p>
        </div>
        <div className="card animate-card">
          <h3>Total Revenue</h3>
          <p>
            ₦<CountUp end={totalRevenue} duration={1.5} separator="," />
          </p>
        </div>
      </div>

      {/* ✅ Table */}
      <h3 className="table-title">
        🧾 Product Summary ({filter === "monthly" ? "By Month" : filter})
      </h3>

      {products.length === 0 ? (
        <p className="no-products">No products found.</p>
      ) : (
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Current Stock</th>
              <th className="show-mobile action-buttons">View</th>
              <th className="hide-mobile">Sold</th>
              <th className="hide-mobile">Damaged</th>
              <th className="hide-mobile">Stock Added</th>
              <th className="hide-mobile">Revenue (₦)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = stockDetails[p.id];
              const remaining = p.total || 0;
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    {remaining < 0 ? 0 : remaining}
                  </td>
                  <td className="hide-mobile">{soldStats[p.id] || 0}</td>
                  <td className="hide-mobile">{damagedStats[p.id] || 0}</td>

                  <td className="hide-mobile">
                    {stock ? (
                      <>
                        {stock.quantity} units <br />
                        <small>{formatTimestamp(stock.date)}</small>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="hide-mobile">
                    ₦{(revenues[p.id] || 0).toLocaleString()}
                  </td>
                  <td className="show-mobile action-buttons">
                    <Link to={`/dashboard/${p.id}`}>
                      <button className="view-btn">View</button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard;
