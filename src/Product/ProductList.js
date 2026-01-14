import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  increment,
} from "firebase/firestore";
import { db, auth } from "../firebase";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [lastAdded, setLastAdded] = useState({});
  const [dailySold, setDailySold] = useState({});
  const [addQty, setAddQty] = useState({});
  const [dailyAmounts, setDailyAmounts] = useState({});
  const [dailyDamaged, setDailyDamaged] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState({});
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
      const dailyDamagedMap = {};
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
            // ✅ Use the actual recorded amount from the sale (handles vendor prices correctly)
            const amount = record.amount ? Number(record.amount) : (record.quantity * (product?.price || 0));

            if (!dailySoldMap[record.productId]) dailySoldMap[record.productId] = 0;
            dailySoldMap[record.productId] += record.quantity;

            if (!dailyAmountMap[record.productId]) dailyAmountMap[record.productId] = 0;
            dailyAmountMap[record.productId] += amount;

            totalRevenueToday += amount;
          }

          if (record.action === "Damaged") {
            if (!dailyDamagedMap[record.productId]) dailyDamagedMap[record.productId] = 0;
            dailyDamagedMap[record.productId] += record.quantity;
          }
        }
      });

      setLastAdded(dailyAddedMap);
      setDailySold(dailySoldMap);
      setDailyDamaged(dailyDamagedMap);
      setDailyAmounts(dailyAmountMap);
      setTotalRevenue(totalRevenueToday);
    });

    return () => unsubscribe();
  }, [products, today]);

  // ✅ Add stock handler
  const handleAddStock = async (id, name) => {
    const qty = parseInt(addQty[id]);
    if (qty === 0 || isNaN(qty)) {
      alert("Enter a valid quantity (positive to add, negative to reduce).");
      return;
    }
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const productRef = doc(db, "products", id);
      const product = products.find((p) => p.id === id);
      if (!product) {
        setLoading(prev => ({ ...prev, [id]: false }));
        alert("Product not found.");
        return;
      }

      const newTotal = (product.total || 0) + qty;

      await updateDoc(productRef, {
        total: increment(qty),
        lastUpdated: serverTimestamp(),
      });

      const isAddition = qty > 0;
      await addDoc(collection(db, "history"), {
        productId: id,
        product: name,
        quantity: Math.abs(qty),
        action: isAddition ? "Stock Added" : "Stock Correction",
        recordedBy: auth.currentUser?.email || "Unknown",
        date: serverTimestamp(),
        note: isAddition ? `Added ${qty} units via Quick Update` : `Reduced ${Math.abs(qty)} units (Correction)`,
      });

      setAddQty({ ...addQty, [id]: "" });
      alert(`✅ Stock ${isAddition ? "added" : "reduced"} for ${name}. New total: ${newTotal}.`);
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("❌ Failed to update stock. Check console for details.");
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "—";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  /* ------------------ PAGINATION LOGIC ------------------ */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
        <>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Stock</th>
                <th>Sold (Today)</th>
                <th className="hide-mobile">Damaged (Today)</th>
                <th className="hide-mobile">Price</th>
                <th className="hide-mobile">Revenue (Today)</th>
                <th className="hide-mobile">Stock Added (Today)</th>
                <th className="hide-mobile">Last Updated</th>
                <th className="hide-mobile">Add Stock</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.map((p) => {
                const todayAdded = lastAdded[p.id] || 0;
                const todaySold = dailySold[p.id] || 0;
                const todayDamaged = dailyDamaged[p.id] || 0;
                const todayAmount = dailyAmounts[p.id] || 0;

                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.total || 0}</td>
                    <td>{todaySold}</td>
                    <td className="hide-mobile">{todayDamaged}</td>
                    <td className="hide-mobile">₦{p.price || "-"}</td>
                    <td className="hide-mobile">
                      ₦{todayAmount.toLocaleString()}
                    </td>
                    <td className="hide-mobile">{todayAdded || "—"}</td>
                    <td className="hide-mobile">
                      {formatTimestamp(p.lastUpdated)}
                    </td>

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
                        disabled={loading[p.id]}
                      >
                        {loading[p.id] ? "..." : "Update"}
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

          {/* ------------------ PAGINATION CONTROLS ------------------ */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductList;
