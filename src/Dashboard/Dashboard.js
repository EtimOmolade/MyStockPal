import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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
  const [stockDetails, setStockDetails] = useState({});
  const [filter, setFilter] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  });

  const monthOptions = getRecentMonths(12);

  // ✅ Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(list);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Fetch and filter history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, "history"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
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
            // Monday–Sunday current week
            const firstDayOfWeek = new Date(now);
            const dayOfWeek = now.getDay(); // Sunday=0
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
            return true; // all time
          }
        });

        const revenueMap = {};
        const soldMap = {};
        const damagedMap = {};
        const stockMap = {};

        filteredRecords.forEach((r) => {
          const pid = r.productId;
          if (!pid) return;

          if (r.action === "Sold" && r.quantity) {
            soldMap[pid] = (soldMap[pid] || 0) + r.quantity;
            const product = products.find((p) => p.id === pid);
            if (product) {
              // ✅ Use recorded transaction amount if available (handles vendor prices), else fallback to product price
              const earned = r.amount ? Number(r.amount) : (r.quantity * (product.price || 0));
              revenueMap[pid] = (revenueMap[pid] || 0) + earned;
            }
          }

          if (r.action === "Damaged" && r.quantity) {
            damagedMap[pid] = (damagedMap[pid] || 0) + r.quantity;
          }

          if (r.action === "Stock Added" && !stockMap[pid]) {
            stockMap[pid] = {
              quantity: r.quantity,
              date: r.date,
              note: r.note || "",
            };
          }
        });

        setStockDetails(stockMap);
        setRevenues(revenueMap);

        const updatedProducts = products.map((p) => ({
          ...p,
          total: p.total || 0,
          sold: filter === "all" ? p.sold || 0 : soldMap[p.id] || 0,
          damaged: filter === "all" ? p.damaged || 0 : damagedMap[p.id] || 0,
        }));

        setProducts(updatedProducts);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    if (products.length > 0) fetchHistory();
  }, [filter, products, selectedMonth]);

  // ✅ Totals
  const totalStock = products.reduce((a, p) => a + (p.total || 0), 0);
  const totalSold = products.reduce((a, p) => a + (p.sold || 0), 0);
  const totalDamaged = products.reduce((a, p) => a + (p.damaged || 0), 0);
  const totalRevenue = Object.values(revenues).reduce((a, b) => a + b, 0);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">📊 Stock Overview</h2>

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
              const remaining =
                (p.total || 0) - ((p.sold || 0) + (p.damaged || 0));
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    {remaining < 0 ? 0 : remaining}
                  </td>
                  <td className="hide-mobile">{p.sold || 0}</td>
                  <td className="hide-mobile">{p.damaged || 0}</td>

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
