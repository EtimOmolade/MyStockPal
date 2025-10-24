// src/ProductList.js
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
import { db } from "./firebase";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [dailyStats, setDailyStats] = useState({});
  const [addQty, setAddQty] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);

  // ✅ Real-time listener for products
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const activeProducts = productList.filter((p) => !p.archived);
      const sortedProducts = activeProducts.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setProducts(sortedProducts);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Real-time listener for history updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "history"), (snapshot) => {
      const historyData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      calculateDailyStats(historyData, products);
    });

    return () => unsubscribe();
  }, [products]);

  // 🧮 Calculate daily stats + total revenue
  const calculateDailyStats = (historyData, productList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todaysHistory = historyData.filter((record) => {
      if (!record.date?.seconds) return false;
      const recordDate = new Date(record.date.seconds * 1000);
      return recordDate >= today && recordDate < tomorrow;
    });

    const stats = {};
    let total = 0;

    productList.forEach((p) => {
      const productHistory = todaysHistory.filter(
        (h) => h.productId === p.id
      );

      const sold = productHistory
        .filter((h) => h.action === "Sold")
        .reduce((sum, h) => sum + (h.quantity || 0), 0);

      const damaged = productHistory
        .filter((h) => h.action === "Damaged")
        .reduce((sum, h) => sum + (h.quantity || 0), 0);

      const added = productHistory
        .filter((h) => h.action === "Stock Added")
        .reduce((sum, h) => sum + (h.quantity || 0), 0);

      const amount = sold * (p.price || 0);
      total += amount;

      stats[p.id] = { sold, damaged, added, amount };
    });

    setDailyStats(stats);
    setTotalRevenue(total);
  };

  const handleAddStock = async (productId, productName) => {
    const qty = parseInt(addQty[productId]);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity to add.");
      return;
    }

    try {
      const productRef = doc(db, "products", productId);
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      await updateDoc(productRef, {
        total: (product.total || 0) + qty,
        lastUpdated: serverTimestamp(),
      });

      await addDoc(collection(db, "history"), {
        productId,
        product: productName,
        quantity: qty,
        action: "Stock Added",
        date: serverTimestamp(),
        note: `Added ${qty} units`,
      });

      setAddQty({ ...addQty, [productId]: "" });
      alert("✅ Stock added successfully!");
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("❌ Could not add stock.");
    }
  };

  const handleArchive = async (id, currentStatus) => {
    const confirmMsg = currentStatus
      ? "Unarchive this product?"
      : "Archive this product? It will no longer show in the product list.";

    if (window.confirm(confirmMsg)) {
      try {
        const productRef = doc(db, "products", id);
        await updateDoc(productRef, { archived: !currentStatus });
      } catch (error) {
        console.error("Error updating archive status:", error);
      }
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
        Showing data for: <strong>{new Date().toDateString()}</strong>
      </p>

      {/* 💰 Daily Revenue Display */}
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
        <p>No products found. Add some!</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Sold</th>
              <th>Damaged</th>
              <th>Added</th>
              <th>Price</th>
                            <th>Amount (₦)</th>

              <th>Last Updated</th>
              <th>Add Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stats = dailyStats[p.id] || {};
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                                    <td>{p.total || 0}</td>

                  <td>{stats.sold || 0}</td>
                  <td>{stats.damaged || 0}</td>
                  <td>{stats.added || 0}</td>
                                    <td>₦{p.price}</td>

                  <td>₦{(stats.amount || 0).toLocaleString()}</td>
                  <td>{formatTimestamp(p.lastUpdated)}</td>
                  <td>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={addQty[p.id] || ""}
                      onChange={(e) =>
                        setAddQty({ ...addQty, [p.id]: e.target.value })
                      }
                      style={{ width: "50px" }}
                    />
                    <button
                      onClick={() => handleAddStock(p.id, p.name)}
                      style={{ marginLeft: "5px" }}
                    >
                      Update
                    </button>
                  </td>
                  <td>
                    <Link to={`/edit/${p.id}`}>
                      <button className="edit-btn">Edit</button>
                    </Link>
                    <button
                      className="archive-btn"
                      onClick={() => handleArchive(p.id, p.archived)}
                    >
                      Archive
                    </button>
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
