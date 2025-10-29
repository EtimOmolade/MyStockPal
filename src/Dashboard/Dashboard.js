import React, { useEffect, useState } from "react";
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

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [revenues, setRevenues] = useState({});
  const [stockDetails, setStockDetails] = useState({});

  // ✅ Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(list);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Fetch history to calculate revenue & stock added details
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, "history"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const revenueMap = {};
        const stockMap = {};

        records.forEach((r) => {
          // 💰 Revenue from sold items
          if (r.action === "Sold" && r.productId && r.quantity) {
            const product = products.find((p) => p.id === r.productId);
            if (product && product.price) {
              const earned = r.quantity * product.price;
              revenueMap[r.productId] = (revenueMap[r.productId] || 0) + earned;
            }
          }

          // 📦 Track the last "Stock Added" detail
          if (r.action === "Stock Added" && r.productId && !stockMap[r.productId]) {
            stockMap[r.productId] = {
              quantity: r.quantity,
              date: r.date,
              note: r.note || "",
            };
          }
        });

        setRevenues(revenueMap);
        setStockDetails(stockMap);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    if (products.length > 0) fetchHistory();
  }, [products]);

  // ✅ Totals for summary
  const totalStock = products.reduce((a, p) => a + (p.total || 0), 0);
  const totalSold = products.reduce((a, p) => a + (p.sold || 0), 0);
  const totalDamaged = products.reduce((a, p) => a + (p.damaged || 0), 0);
  const totalRevenue = Object.values(revenues).reduce((a, b) => a + b, 0);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">📊 Stock Overview</h2>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Stock</h3>
          <p>{totalStock}</p>
        </div>
        <div className="card">
          <h3>Total Sold</h3>
          <p>{totalSold}</p>
        </div>
        <div className="card ">
          <h3>Total Damaged</h3>
          <p>{totalDamaged}</p>
        </div>
        <div className="card">
          <h3>Total Revenue</h3>
          <p>₦{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Product Summary */}
      <h3 className="table-title">🧾 Product Summary</h3>
      {products.length === 0 ? (
        <p className="no-products">No products found.</p>
      ) : (
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock Added</th>
              <th className="hide-mobile">Sold</th>
              <th className="hide-mobile">Damaged</th>
              <th className="hide-mobile">Current Stock</th>
              <th className="hide-mobile">Revenue (₦)</th>
              
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = stockDetails[p.id];
              const remaining = (p.total || 0) - ((p.sold || 0) + (p.damaged || 0));
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    {stock ? (
                      <>
                        {stock.quantity} units <br />
                        <small>{formatTimestamp(stock.date)}</small>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="hide-mobile">{p.sold || 0}</td>
                  <td className="hide-mobile">{p.damaged || 0}</td>
                  <td className="hide-mobile">{remaining < 0 ? 0 : remaining}</td>
                  <td className="hide-mobile">₦{(revenues[p.id] || 0).toLocaleString()}</td>
                

                
                {/* ✅ Mobile “View” button (only visible on small screens) */}
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
