// src/ProductView.js
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ProductView() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [dailyAmount, setDailyAmount] = useState(0);
  const navigate = useNavigate();

  // ✅ Fetch product details and compute today's sales
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const productData = { id: snap.id, ...snap.data() };
          setProduct(productData);
          await calculateDailySales(productData);
        } else {
          toast.error("❌ Product not found!");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        toast.error("❌ Failed to load product details.");
      }
    };

    fetchProduct();
  }, [id]);

  // ✅ Calculate daily sales from "history" collection
  const calculateDailySales = async (productData) => {
    try {
      const historySnap = await getDocs(collection(db, "history"));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let total = 0;

      historySnap.forEach((doc) => {
        const record = doc.data();
        if (record.productId === productData.id && record.action === "Sold" && record.date?.seconds) {
          const recordDate = new Date(record.date.seconds * 1000);
          recordDate.setHours(0, 0, 0, 0);
          if (recordDate.getTime() === today.getTime()) {
            total += (record.quantity || 0) * (productData.price || productData.sellingPrice || 0);
          }
        }
      });

      setDailyAmount(total);
    } catch (err) {
      console.error("Error calculating daily sales:", err);
    }
  };

  // ✅ Archive product
  const handleArchive = async () => {
    toast.info("Archiving product...", { autoClose: 1000, position: "top-center" });

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
            <tr><td><strong>Product Name</strong></td><td>{product.name}</td></tr>
            <tr><td><strong>Total Stock</strong></td><td>{product.total || 0}</td></tr>
            <tr><td><strong>Sold</strong></td><td>{product.sold || 0}</td></tr>
            <tr><td><strong>Damaged</strong></td><td>{product.damaged || 0}</td></tr>
            <tr><td><strong>Price</strong></td><td>₦{(product.price || product.sellingPrice || 0).toLocaleString()}</td></tr>

            {/* ✅ Daily Sales Amount */}
            <tr>
              <td><strong>Today’s Sales Amount</strong></td>
              <td>₦{dailyAmount.toLocaleString()}</td>
            </tr>

            <tr><td><strong>Date Added</strong></td><td>{formatTimestamp(product.dateAdded)}</td></tr>
            <tr><td><strong>Last Updated</strong></td><td>{formatTimestamp(product.lastUpdated)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* ✅ Buttons */}
      <div className="action-buttons" style={{ marginTop: "25px" }}>
        <Link to={`/edit/${id}`}><button className="edit-btn">Edit</button></Link>
        <button className="archive-btn" onClick={handleArchive}>Archive</button>
        <Link to="/"><button className="edit-btn">Back</button></Link>
      </div>
    </div>
  );
}

export default ProductView;
