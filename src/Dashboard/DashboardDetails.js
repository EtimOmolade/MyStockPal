// src/DashboardDetails.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

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
  const { id } = useParams(); // Product ID from URL
  const [product, setProduct] = useState(null);
  const [revenue, setRevenue] = useState(0);
  const [lastStock, setLastStock] = useState(null);
  const [filter, setFilter] = useState("all");

  // ✅ Fetch product info
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.warn("No such product found!");
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
        const now = new Date();

        // Define time ranges
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const startOfWeek = new Date(now);
        const dayOfWeek = now.getDay(); // Sunday=0
        const distanceToMonday = (dayOfWeek + 6) % 7;
        startOfWeek.setDate(now.getDate() - distanceToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        let totalRevenue = 0;
        let latestStock = null;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.date?.seconds || data.productId !== id) return;

          const recordDate = new Date(data.date.seconds * 1000);
          const withinRange =
            filter === "daily"
              ? recordDate >= startOfToday && recordDate <= endOfToday
              : filter === "weekly"
              ? recordDate >= startOfWeek && recordDate <= endOfWeek
              : filter === "monthly"
              ? recordDate >= startOfMonth && recordDate <= endOfMonth
              : true; // all time

          // 💰 Compute revenue
          if (data.action === "Sold" && withinRange) {
            totalRevenue += (data.quantity || 0) * (product?.price || 0);
          }

          // 📦 Find most recent stock added
          if (data.action === "Stock Added" && !latestStock) {
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
  }, [product, id, filter]);

  if (!product) {
    return <p>Loading product details...</p>;
  }

  const remaining =
    (product.total || 0) - ((product.sold || 0) + (product.damaged || 0));

  return (
    <div className="dashboard-view">
      <h2>{product.name} Details</h2>

      {/* Filter Controls */}
      <div className="filter-controls">
        <label>View by:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Time</option>
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
        </select>
      </div>

      {/* Product Stats */}
      <p><strong>Total Stock:</strong> {product.total}</p>
      <p><strong>Sold:</strong> {product.sold}</p>
      <p><strong>Damaged:</strong> {product.damaged}</p>
      <p><strong>Current Stock:</strong> {remaining < 0 ? 0 : remaining}</p>
      <p><strong>Revenue:</strong> ₦{revenue.toLocaleString()}</p>

      {/* Last Stock Info */}
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
