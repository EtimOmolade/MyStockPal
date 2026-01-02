// src/StockHistory.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom"; // ✅ For navigation

const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Format date for display
  const formatDate = (dateValue) => {
    const parseToDate = (value) => {
      if (!value && value !== 0) return null;

      if (typeof value === "object") {
        if (value.seconds && typeof value.seconds === "number") {
          return new Date(
            value.seconds * 1000 +
              (value.nanoseconds ? Math.round(value.nanoseconds / 1e6) : 0)
          );
        }
        if (typeof value.toDate === "function") return value.toDate();
        if (value instanceof Date) return value;
      }

      if (typeof value === "number") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      }

      if (typeof value === "string") {
        const parsed = Date.parse(value.trim());
        if (!isNaN(parsed)) return new Date(parsed);
      }

      return null;
    };

    const d = parseToDate(dateValue);
    return d ? d.toLocaleString() : "—";
  };

  // ✅ Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      // ✅ Define helpers inside to silence ESLint warning
      const parseToDate = (value) => {
        if (!value && value !== 0) return null;

        if (typeof value === "object") {
          if (value.seconds && typeof value.seconds === "number") {
            return new Date(
              value.seconds * 1000 +
                (value.nanoseconds ? Math.round(value.nanoseconds / 1e6) : 0)
            );
          }
          if (typeof value.toDate === "function") return value.toDate();
          if (value instanceof Date) return value;
        }

        if (typeof value === "number") {
          const d = new Date(value);
          return isNaN(d.getTime()) ? null : d;
        }

        if (typeof value === "string") {
          const parsed = Date.parse(value.trim());
          if (!isNaN(parsed)) return new Date(parsed);
        }

        return null;
      };

      const getTimestampValue = (dateValue) => {
        const d = parseToDate(dateValue);
        return d ? d.getTime() : 0;
      };

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
        historyData.sort(
          (a, b) => getTimestampValue(b.date) - getTimestampValue(a.date)
        );

        setHistory(historyData);
        setFilteredHistory(historyData);
        setProducts(productData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []); // ✅ No more ESLint warnings

  // ✅ Filtering logic
  const handleFilter = () => {
    const parseToDate = (value) => {
      if (!value && value !== 0) return null;

      if (typeof value === "object") {
        if (value.seconds && typeof value.seconds === "number") {
          return new Date(
            value.seconds * 1000 +
              (value.nanoseconds ? Math.round(value.nanoseconds / 1e6) : 0)
          );
        }
        if (typeof value.toDate === "function") return value.toDate();
        if (value instanceof Date) return value;
      }

      if (typeof value === "number") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      }

      if (typeof value === "string") {
        const parsed = Date.parse(value.trim());
        if (!isNaN(parsed)) return new Date(parsed);
      }

      return null;
    };

    const getTimestampValue = (dateValue) => {
      const d = parseToDate(dateValue);
      return d ? d.getTime() : 0;
    };

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
      const endTime = endDate
        ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1
        : Infinity;

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

      {/* ✅ Filter Section */}
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
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button onClick={handleFilter} className="filter-button">
          Filter
        </button>
        <button onClick={resetFilters} className="filter-button">
          Reset
        </button>
      </div>

      {/* ✅ Table */}
      {filteredHistory.length === 0 ? (
        <p>No matching records found.</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th className="hide-mobile">Actions</th>
              <th className="hide-mobile">Vendor Name</th>
              <th className="hide-mobile">Vendor Price</th>
              <th className="hide-mobile">Quantity</th>
              <th className="hide-mobile">Payment Method</th>
              <th className="hide-mobile">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((record) => {
              const defaultNote =
                record.quantity && record.amount
                  ? `Sold ${record.quantity ?? 0} units for ₦${
                      record.vendorPrice
                        ? record.vendorPrice.toLocaleString()
                        : record.productPrice
                        ? record.productPrice.toLocaleString()
                        : "0"
                    } each, total ₦${record.amount.toLocaleString()}`
                  : "—";

              return (
                <tr key={record.id}>
                  <td>{formatDate(record.date)}</td>
                  <td>{record.product || record.productName || "—"}</td>
                  <td className="hide-mobile">{record.action || "—"}</td>
                  <td className="hide-mobile">{record.vendorName === '' ? "Shop" : record.vendorName}</td>
                  <td className="hide-mobile">
                    {record.vendorPrice
                      ? `₦${record.vendorPrice.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="hide-mobile">{record.quantity ?? 0}</td>
                  <td className="hide-mobile">{record.payment || "—"}</td>
                  <td className="hide-mobile">
                    {record.note || record.details || defaultNote}
                  </td>

                  {/* ✅ Mobile view */}
                  <td className="show-mobile action-buttons">
                    <Link to={`/stock-history/${record.id}`}>
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

export default StockHistory;
