import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ------------------ DATE HELPERS ------------------ */
  const parseToDate = (value) => {
    if (!value && value !== 0) return null;

    if (typeof value === "object") {
      if (value.seconds) {
        return new Date(
          value.seconds * 1000 +
            (value.nanoseconds
              ? Math.round(value.nanoseconds / 1e6)
              : 0)
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

  const getTimestampValue = (value) => {
    const d = parseToDate(value);
    return d ? d.getTime() : 0;
  };

  const formatDate = (value) => {
    const d = parseToDate(value);
    return d ? d.toLocaleString() : "—";
  };

  /* ------------------ FETCH DATA ------------------ */
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

        historyData.sort(
          (a, b) =>
            getTimestampValue(b.date) - getTimestampValue(a.date)
        );

        setHistory(historyData);
        setFilteredHistory(historyData);
        setProducts(productData);
      } catch (err) {
        console.error("Error fetching stock history:", err);
      }
    };

    fetchData();
  }, []);

  /* ------------------ VENDOR DROPDOWN DATA ------------------ */
  const vendors = useMemo(() => {
    const set = new Set();

    history.forEach((r) => {
      if (r.vendorName && r.vendorName.trim() !== "") {
        set.add(r.vendorName.trim());
      } else {
        set.add("Shop");
      }
    });

    return ["all", ...Array.from(set).sort()];
  }, [history]);

  /* ------------------ LIVE FILTERING ------------------ */
  useEffect(() => {
    let filtered = [...history];

    // Product filter
    if (selectedProduct !== "all") {
      filtered = filtered.filter(
        (r) =>
          r.product &&
          r.product.toLowerCase().trim() ===
            selectedProduct.toLowerCase()
      );
    }

    // Vendor filter
    if (selectedVendor !== "all") {
      filtered = filtered.filter((r) => {
        const vendor =
          r.vendorName && r.vendorName.trim() !== ""
            ? r.vendorName
            : "Shop";

        return vendor === selectedVendor;
      });
    }

    // Date filter
    if (startDate || endDate) {
      const startTime = startDate
        ? new Date(startDate).getTime()
        : -Infinity;
      const endTime = endDate
        ? new Date(endDate).getTime() +
          24 * 60 * 60 * 1000 -
          1
        : Infinity;

      filtered = filtered.filter((r) => {
        const ts = getTimestampValue(r.date);
        return ts && ts >= startTime && ts <= endTime;
      });
    }

    filtered.sort(
      (a, b) =>
        getTimestampValue(b.date) - getTimestampValue(a.date)
    );

    setFilteredHistory(filtered);
  }, [history, selectedProduct, selectedVendor, startDate, endDate]);

  const resetFilters = () => {
    setSelectedProduct("all");
    setSelectedVendor("all");
    setStartDate("");
    setEndDate("");
    setFilteredHistory([...history]);
  };

  return (
    <div className="table-container">
      <h2>📜 Stock History</h2>

      {/* ------------------ FILTERS (MOBILE FRIENDLY) ------------------ */}
      <div className="filter-container filter-grid">
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="all">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
        >
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v === "all" ? "All Vendors" : v}
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

        <button onClick={resetFilters} className="filter-button">
          Reset
        </button>
      </div>

      {/* ------------------ TABLE ------------------ */}
      {filteredHistory.length === 0 ? (
        <p>No matching records found.</p>
      ) : (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Vendor</th>
              <th>Action</th>
              <th className="hide-mobile">Vendor Price</th>
              <th className="hide-mobile">Qty</th>
              <th className="hide-mobile">Payment</th>
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
                  <td>
                    {record.vendorName?.trim()
                      ? record.vendorName
                      : "Shop"}
                  </td>
<td className="hide-mobile">{record.action || "—"}</td>

                  <td className="hide-mobile">
                    {record.vendorPrice
                      ? `₦${record.vendorPrice.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="hide-mobile">
                    {record.quantity ?? 0}
                  </td>
                  <td className="hide-mobile">
                    {record.payment || "—"}
                  </td>
                  <td className="hide-mobile">
                    {record.note ||
                      record.details ||
                      defaultNote}
                  </td>

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
