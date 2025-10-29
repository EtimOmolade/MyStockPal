// src/DashboardDetails.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// Helper — format Firestore timestamp
const formatTimestamp = (ts) => {
  if (!ts) return "—";
  if (ts.seconds && typeof ts.seconds === "number") {
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleString();
  }
  return ts.toDate ? ts.toDate().toLocaleString() : "—";
};

function DashboardDetails() {
  const { id } = useParams(); // Get product ID from URL
  const [product, setProduct] = useState(null);
  const [revenue, setRevenue] = useState(0);
  const [lastStock, setLastStock] = useState(null);

  // ✅ Fetch product info
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, [id]);

  // ✅ Fetch revenue + last stock added
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, "history"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);

        let totalRevenue = 0;
        let latestStock = null;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // 💰 Compute revenue for this product
          if (data.action === "Sold" && data.productId === id) {
            totalRevenue += (data.quantity || 0) * (product?.price || 0);
          }

          // 📦 Find most recent stock added
          if (data.action === "Stock Added" && data.productId === id && !latestStock) {
            latestStock = {
              quantity: data.quantity,
              date: data.date,
              note: data.note || "",
            };
          }
        });

        setRevenue(totalRevenue);
        setLastStock(latestStock);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    if (product) fetchHistory();
  }, [product, id]);

  if (!product) {
    return <p>Loading product details...</p>;
  }

  const remaining = (product.total || 0) - ((product.sold || 0) + (product.damaged || 0));

  return (
    <div className="dashboard-view">
      <h2>{product.name} Details</h2>

      <p><strong>Total Stock:</strong> {product.total}</p>
      <p><strong>Sold:</strong> {product.sold}</p>
      <p><strong>Damaged:</strong> {product.damaged}</p>
      <p><strong>Current Stock:</strong> {remaining < 0 ? 0 : remaining}</p>
      <p><strong>Revenue:</strong> ₦{revenue.toLocaleString()}</p>

      {lastStock ? (
        <p>
          <strong>Last Stock Added:</strong> {lastStock.quantity} units <br />
          <small>on {formatTimestamp(lastStock.date)}</small>
        </p>
      ) : (
        <p><strong>Last Stock Added:</strong> —</p>
      )}

      <Link to="/dashboard">
        <button className="edit-btn">← Back</button>
      </Link>
    </div>
  );
}

export default DashboardDetails;
