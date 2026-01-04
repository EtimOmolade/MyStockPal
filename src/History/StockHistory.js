import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
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
  const parseToDate = useCallback((value) => {
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
  }, []);

  const getTimestampValue = useCallback(
    (value) => {
      const d = parseToDate(value);
      return d ? d.getTime() : 0;
    },
    [parseToDate]
  );

  const formatDate = useCallback(
    (value) => {
      const d = parseToDate(value);
      return d ? d.toLocaleString() : "—";
    },
    [parseToDate]
  );

  /* ------------------ FETCH DATA ------------------ */
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

        historyData.sort(
          (a, b) =>
            getTimestampValue(b.date) -
            getTimestampValue(a.date)
        );

        setHistory(historyData);
        setFilteredHistory(historyData);
        setProducts(productData);
      } catch (err) {
        console.error("Error fetching stock history:", err);
      }
    };

    fetchData();
  }, [getTimestampValue]);

  /* ------------------ VENDOR DROPDOWN (DEDUPED) ------------------ */
  const vendors = useMemo(() => {
    const map = new Map();

    history.forEach((r) => {
      const raw =
        r.vendorName && r.vendorName.trim() !== ""
          ? r.vendorName
          : "Shop";

      const key = raw.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, raw.trim());
      }
    });

    return ["all", ...Array.from(map.values()).sort()];
  }, [history]);

  /* ------------------ LIVE FILTERING ------------------ */
  useEffect(() => {
    let filtered = [...history];

    // ✅ Product filter
    if (selectedProduct !== "all") {
      const product = selectedProduct.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.product &&
          r.product.toLowerCase().trim() === product
      );
    }

    // ✅ Vendor filter (FIXED & NORMALIZED)
    if (selectedVendor !== "all") {
      const selected = selectedVendor.toLowerCase().trim();

      filtered = filtered.filter((r) => {
        const vendor =
          r.vendorName && r.vendorName.trim() !== ""
            ? r.vendorName
            : "Shop";

        return vendor.toLowerCase().trim() === selected;
      });
    }

    // ✅ Date filter
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
        getTimestampValue(b.date) -
        getTimestampValue(a.date)
    );

    setFilteredHistory(filtered);
  }, [
    history,
    selectedProduct,
    selectedVendor,
    startDate,
    endDate,
    getTimestampValue,
  ]);

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

      {/* ------------------ FILTERS ------------------ */}
      <div className="filter-container filter-grid">
        <select
          value={selectedProduct}
          onChange={(e) =>
            setSelectedProduct(e.target.value)
          }
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
          onChange={(e) =>
            setSelectedVendor(e.target.value)
          }
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

        <button
          onClick={resetFilters}
          className="filter-button"
        >
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
              <th className="hide-mobile">Action</th>
              <th className="hide-mobile">Vendor Price</th>
              <th className="hide-mobile">Qty</th>
              <th className="hide-mobile">Payment</th>
              <th className="hide-mobile">Notes</th>
              <th>View</th>
            </tr>
          </thead>

          <tbody>
            {filteredHistory.map((record) => {
              const unitPrice =
                record.vendorPrice ||
                record.productPrice ||
                0;

              const defaultNote =
                record.quantity && record.amount
                  ? `Sold ${record.quantity} units for ₦${unitPrice.toLocaleString()} each, total ₦${record.amount.toLocaleString()}`
                  : "—";

              return (
                <tr key={record.id}>
                  <td>{formatDate(record.date)}</td>
                  <td>
                    {record.product ||
                      record.productName ||
                      "—"}
                  </td>
                  <td>
                    {record.vendorName?.trim()
                      ? record.vendorName
                      : "Shop"}
                  </td>
                  <td className="hide-mobile">
                    {record.action || "—"}
                  </td>
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

                  <td>
                    <Link to={`/stock-history/${record.id}`}>
                      <button className="view-btn" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
                        View
                      </button>
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
