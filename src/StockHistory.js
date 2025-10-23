// src/StockHistory.js
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const historySnap = await getDocs(collection(db, "history"));
        let historyData = historySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const productSnap = await getDocs(collection(db, "products"));
        const productData = productSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort newest first
        historyData.sort((a, b) => getTimestampValue(b.date) - getTimestampValue(a.date));

        setHistory(historyData);
        setFilteredHistory(historyData);
        setProducts(productData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parse Firestore timestamps or various date formats into a Date object
  const parseToDate = (value) => {
    if (!value && value !== 0) return null;

    // Firestore Timestamp
    if (typeof value === "object") {
      if (value.seconds && typeof value.seconds === "number") {
        return new Date(value.seconds * 1000 + (value.nanoseconds ? Math.round(value.nanoseconds / 1e6) : 0));
      }
      if (typeof value.toDate === "function") return value.toDate();
      if (value instanceof Date) return value;
    }

    // Number (ms)
    if (typeof value === "number") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    // String formats
    if (typeof value === "string") {
      const trimmed = value.trim();
      const parsedMs = Date.parse(trimmed);
      if (!isNaN(parsedMs)) return new Date(parsedMs);

      // DD/MM/YYYY, HH:MM(:SS)?
      const dmRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
      const m = trimmed.match(dmRegex);
      if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        const year = parseInt(m[3], 10);
        const hour = m[4] ? parseInt(m[4], 10) : 0;
        const minute = m[5] ? parseInt(m[5], 10) : 0;
        const second = m[6] ? parseInt(m[6], 10) : 0;
        const d = new Date(year, month - 1, day, hour, minute, second);
        return isNaN(d.getTime()) ? null : d;
      }

      // DD/MM/YYYY only
      const dmOnly = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
      if (dmOnly) {
        const day = parseInt(dmOnly[1], 10);
        const month = parseInt(dmOnly[2], 10);
        const year = parseInt(dmOnly[3], 10);
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? null : d;
      }
    }

    return null;
  };

  const getTimestampValue = (dateValue) => {
    const d = parseToDate(dateValue);
    return d ? d.getTime() : 0;
  };

  const formatDate = (dateValue) => {
    const d = parseToDate(dateValue);
    return d ? d.toLocaleString() : "—";
  };

  const handleFilter = () => {
    let filtered = [...history];

    if (selectedProduct && selectedProduct !== "all") {
      filtered = filtered.filter(
        (record) =>
          record.product &&
          record.product.trim().toLowerCase() === selectedProduct.toLowerCase()
      );
    }

    if (startDate || endDate) {
      const startTime = startDate ? new Date(startDate).getTime() : -Infinity;
      const endTime = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity;
      filtered = filtered.filter((record) => {
        const ts = getTimestampValue(record.date);
        return ts && ts >= startTime && ts <= endTime;
      });
    }

    filtered.sort((a, b) => getTimestampValue(b.date) - getTimestampValue(a.date));
    setFilteredHistory(filtered);
  };

  const resetFilters = () => {
    setSelectedProduct("all");
    setStartDate("");
    setEndDate("");
    setFilteredHistory([...history]);
  };

  return (
    <div className="table-container">
      <h2>📜 Stock History</h2>

      <div className="filter-container">
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="all">-- All Products --</option>
          {products.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />

        <button onClick={handleFilter} className="filter-button">
          Filter
        </button>
        <button onClick={resetFilters} className="filter-button">
          Reset
        </button>
      </div>

      {filteredHistory.length === 0 ? (
        <p>No matching records found.</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Action</th>
              <th>Quantity</th>
              <th>Payment Method</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((record) => (
              <tr key={record.id}>
                <td>{formatDate(record.date)}</td>
                <td>{record.product || record.productName || "—"}</td>
                <td>{record.action || "—"}</td>
                <td>{record.quantity ?? 0}</td>
                <td>{record.payment || "—"}</td>
                <td>{record.note || record.details || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StockHistory;
