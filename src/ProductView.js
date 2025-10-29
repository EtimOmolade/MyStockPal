// src/ProductView.js
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { db } from "./firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ProductView() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [dailySold, setDailySold] = useState(0);
  const [dailyAmount, setDailyAmount] = useState(0);
  const [today, setToday] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const navigate = useNavigate();

  // ✅ Auto-refresh at midnight
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (now.getTime() !== today.getTime()) {
        setToday(now);
      }
    }, 60 * 1000);
    return () => clearInterval(checkMidnight);
  }, [today]);

  // ✅ Listen for real-time product updates
  useEffect(() => {
    const ref = doc(db, "products", id);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setProduct({ id: snap.id, ...snap.data() });
      } else {
        toast.error("❌ Product not found!");
      }
    });
    return () => unsubscribe();
  }, [id]);

  // ✅ Calculate only today’s sales (quantity + amount)
  useEffect(() => {
    if (!product) return;

    const historyRef = collection(db, "history");
    const unsubscribe = onSnapshot(historyRef, (snapshot) => {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      let soldToday = 0;
      let revenueToday = 0;

      snapshot.docs.forEach((docItem) => {
        const record = docItem.data();
        if (
          record.productId === product.id &&
          record.action === "Sold" &&
          record.date?.seconds
        ) {
          const recordDate = new Date(record.date.seconds * 1000);
          recordDate.setHours(0, 0, 0, 0);

          if (recordDate.getTime() === todayDate.getTime()) {
            soldToday += record.quantity || 0;
            revenueToday +=
              (record.quantity || 0) *
              (product.price || product.sellingPrice || 0);
          }
        }
      });

      setDailySold(soldToday);
      setDailyAmount(revenueToday);
    });

    return () => unsubscribe();
  }, [product, today]);

  // ✅ Archive product
  const handleArchive = async () => {
    toast.info("Archiving product...", {
      autoClose: 1000,
      position: "top-center",
    });

    try {
      const ref = doc(db, "products", id);
      await updateDoc(ref, {
        archived: true,
        lastUpdated: serverTimestamp(),
      });

      toast.success("✅ Product archived successfully!", {
        autoClose: 1500,
        position: "top-center",
        onClose: () => navigate("/"),
      });
    } catch (err) {
      console.error("Error archiving product:", err);
      toast.error("❌ Failed to archive product.");
    }
  };

  // ✅ Format Firestore timestamps
  const formatTimestamp = (ts) => {
    if (!ts) return "—";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  if (!product) return <p>Loading product details...</p>;

  return (
    <div className="inventory-page">
      <ToastContainer />
      <h2>🔍 Product Details</h2>
      <p style={{ fontSize: "14px", color: "#888" }}>
        Viewing details for: <strong>{product.name}</strong>
      </p>
      <p style={{ fontSize: "13px", color: "#777" }}>
        Showing data for: <strong>{today.toDateString()}</strong>
      </p>

      {/* ✅ Product Details Table */}
      <div className="product-details-card" style={{ marginTop: "20px" }}>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Product Name</strong></td>
              <td>{product.name}</td>
            </tr>
            <tr>
              <td><strong>Total Stock</strong></td>
              <td>{product.total || 0}</td>
            </tr>
            <tr>
              <td><strong>Sold Today</strong></td>
              <td>{dailySold}</td>
            </tr>
            <tr>
              <td><strong>Damaged</strong></td>
              <td>{product.damaged || 0}</td>
            </tr>
            <tr>
              <td><strong>Price</strong></td>
              <td>₦{(product.price || product.sellingPrice || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Revenue Today</strong></td>
              <td>₦{dailyAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Date Added</strong></td>
              <td>{formatTimestamp(product.dateAdded)}</td>
            </tr>
            <tr>
              <td><strong>Last Updated</strong></td>
              <td>{formatTimestamp(product.lastUpdated)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ✅ Buttons */}
      <div className="action-buttons" style={{ marginTop: "25px" }}>
        <Link to={`/edit/${id}`}>
          <button className="edit-btn">Edit</button>
        </Link>
        <button className="archive-btn" onClick={handleArchive}>
          Archive
        </button>
        <Link to="/">
          <button className="edit-btn">Back</button>
        </Link>
      </div>
    </div>
  );
}

export default ProductView;
