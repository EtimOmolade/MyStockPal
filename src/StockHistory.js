import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // ✅ Load data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const historySnap = await getDocs(collection(db, "history"));
        const historyData = historySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const productSnap = await getDocs(collection(db, "products"));
        const productData = productSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHistory(historyData);
        setFilteredHistory(historyData);
        setProducts(productData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // ✅ Filtering logic
  const handleFilter = () => {
    let filtered = history;

    if (selectedProduct && selectedProduct !== "all") {
      filtered = filtered.filter(
        (record) =>
          record.product &&
          record.product.trim().toLowerCase() === selectedProduct.toLowerCase()
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((record) => {
        if (!record.date) return false;

        // Handle Firestore timestamp
        if (record.date.seconds) {
          const recordDate = new Date(record.date.seconds * 1000)
            .toISOString()
            .slice(0, 10);
          return recordDate === selectedDate;
        }

        // Handle string dates (for older records)
        const dateStr = record.date.trim();
        let recordDate = "";

        if (dateStr.includes("T")) {
          recordDate = new Date(dateStr).toISOString().slice(0, 10);
        } else if (dateStr.includes("/")) {
          const [day, month, year] = dateStr.split(",")[0].split("/");
          if (day && month && year) {
            recordDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
              2,
              "0"
            )}`;
          }
        }

        return recordDate === selectedDate;
      });
    }

    setFilteredHistory(filtered);
  };

  // ✅ Reset filters
  const resetFilters = () => {
    setSelectedProduct("all");
    setSelectedDate("");
    setFilteredHistory(history);
  };

  // ✅ Helper to show date nicely
  const formatDate = (date) => {
    if (!date) return "—";
    if (date.seconds) {
      // Firestore Timestamp → readable date
      return new Date(date.seconds * 1000).toLocaleString();
    }
    // fallback if it's a string
    return date;
  };

  return (
    <div className="table-container">
      <h2>📜 Stock History</h2>

      {/* Filter Section */}
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
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <button onClick={handleFilter} className="filter-button">
          Filter
        </button>
        <button onClick={resetFilters} className="filter-button">
          Reset
        </button>
      </div>

      {/* Table Display */}
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
                <td>{record.quantity || 0}</td>
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
