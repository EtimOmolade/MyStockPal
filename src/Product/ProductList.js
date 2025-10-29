import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [lastAdded, setLastAdded] = useState({});
  const [dailySold, setDailySold] = useState({});
  const [addQty, setAddQty] = useState({});
  const [dailyAmounts, setDailyAmounts] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [today, setToday] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // ✅ Automatically refresh date at midnight (so table resets daily)
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (now.getTime() !== today.getTime()) {
        setToday(now);
      }
    }, 60 * 1000); // check every 1 minute

    return () => clearInterval(checkMidnight);
  }, [today]);

  // ✅ Fetch products in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const active = productList.filter((p) => !p.archived);
      setProducts(active.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch *daily* stock added, sold quantities, and revenue
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "history"), (snapshot) => {
      const historyData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const dailyAddedMap = {};
      const dailySoldMap = {};
      const dailyAmountMap = {};
      let totalRevenueToday = 0;

      historyData.forEach((record) => {
        if (!record.date?.seconds) return;
        const recordDate = new Date(record.date.seconds * 1000);
        recordDate.setHours(0, 0, 0, 0);

        // ✅ Only count today's actions
        if (recordDate.getTime() === today.getTime()) {
          if (record.action === "Stock Added") {
            if (!dailyAddedMap[record.productId]) dailyAddedMap[record.productId] = 0;
            dailyAddedMap[record.productId] += record.quantity;
          }

          if (record.action === "Sold") {
            const product = products.find((p) => p.id === record.productId);
            const price = product?.price || 0;
            const amount = record.quantity * price;

            if (!dailySoldMap[record.productId]) dailySoldMap[record.productId] = 0;
            dailySoldMap[record.productId] += record.quantity;

            if (!dailyAmountMap[record.productId]) dailyAmountMap[record.productId] = 0;
            dailyAmountMap[record.productId] += amount;

            totalRevenueToday += amount;
          }
        }
      });

      setLastAdded(dailyAddedMap);
      setDailySold(dailySoldMap);
      setDailyAmounts(dailyAmountMap);
      setTotalRevenue(totalRevenueToday);
    });

    return () => unsubscribe();
  }, [products, today]);

  // ✅ Add stock handler
  const handleAddStock = async (id, name) => {
    const qty = parseInt(addQty[id]);
    if (!qty || qty <= 0) {
      alert("Enter a valid quantity.");
      return;
    }

    try {
      const productRef = doc(db, "products", id);
      const product = products.find((p) => p.id === id);
      if (!product) {
        alert("Product not found.");
        return;
      }

      const newTotal = (product.total || 0) + qty;

      await updateDoc(productRef, {
        total: newTotal,
        lastUpdated: serverTimestamp(),
      });

      await addDoc(collection(db, "history"), {
        productId: id,
        productName: name,
        quantity: qty,
        action: "Stock Added",
        date: serverTimestamp(),
        note: `Added ${qty} units`,
      });

      setAddQty({ ...addQty, [id]: "" });
      alert(`✅ Added ${qty} to ${name}. New total: ${newTotal}.`);
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("❌ Failed to update stock. Check console for details.");
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "—";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  return (
    <div className="inventory-page">
      <h2>📦 Product Inventory</h2>
      <p style={{ fontSize: "14px", color: "#888" }}>
        Showing data for: <strong>{today.toDateString()}</strong>
      </p>

      {/* 💰 Total Revenue Display */}
      <div
        style={{
          margin: "10px 0 20px 0",
          padding: "10px 15px",
          background: "#e8f4e8",
          color: "#1b5e20",
          borderRadius: "8px",
          fontWeight: "600",
          display: "inline-block",
        }}
      >
        💰 Total Revenue Today: ₦{totalRevenue.toLocaleString()}
      </div>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Sold (Today)</th>
              <th className="hide-mobile">Damaged</th>
              <th className="hide-mobile">Price</th>
              <th className="hide-mobile">Revenue (Today)</th>
              <th className="hide-mobile">Stock Added (Today)</th>
              <th className="hide-mobile">Last Updated</th>
              <th className="hide-mobile">Add Stock</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => {
              const todayAdded = lastAdded[p.id] || 0;
              const todaySold = dailySold[p.id] || 0;
              const todayAmount = dailyAmounts[p.id] || 0;

              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.total || 0}</td>
                  <td>{todaySold}</td>
                  <td className="hide-mobile">{p.damaged || 0}</td>
                  <td className="hide-mobile">₦{p.price || "-"}</td>
                  <td className="hide-mobile">₦{todayAmount.toLocaleString()}</td>
                  <td className="hide-mobile">{todayAdded || "—"}</td>
                  <td className="hide-mobile">{formatTimestamp(p.lastUpdated)}</td>

                  {/* ✅ Add stock input */}
                  <td className="hide-mobile">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={addQty[p.id] || ""}
                      onChange={(e) =>
                        setAddQty({ ...addQty, [p.id]: e.target.value })
                      }
                      style={{ width: "60px" }}
                    />
                    <button
                      onClick={() => handleAddStock(p.id, p.name)}
                      style={{ marginLeft: "5px" }}
                    >
                      Update
                    </button>
                  </td>

                  {/* ✅ Actions */}
                  <td>
                    <div className="action-buttons">
                      <Link to={`/product/${p.id}`}>
                        <button className="view-btn">View</button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ProductList;
