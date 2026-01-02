import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const StockHistoryDetails = () => {
  const { id } = useParams();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      const docRef = doc(db, "history", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRecord({ id: docSnap.id, ...docSnap.data() });
      }
    };
    fetchRecord();
  }, [id]);

  // ✅ Same robust date formatter used on desktop
  const formatDate = (value) => {
    if (!value && value !== 0) return "—";

    if (typeof value === "object") {
      if (value.seconds && typeof value.seconds === "number") {
        return new Date(
          value.seconds * 1000 +
            (value.nanoseconds ? Math.round(value.nanoseconds / 1e6) : 0)
        ).toLocaleString();
      }
      if (typeof value.toDate === "function") {
        return value.toDate().toLocaleString();
      }
      if (value instanceof Date) return value.toLocaleString();
    }

    if (typeof value === "number") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? "—" : d.toLocaleString();
    }

    if (typeof value === "string") {
      const parsed = Date.parse(value.trim());
      if (!isNaN(parsed)) return new Date(parsed).toLocaleString();
    }

    return "—";
  };

  if (!record) return <p>Loading...</p>;

  // ✅ Same default note logic as desktop
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
    <div className="details-container">
      <h2>📄 Stock Record Details</h2>

      <div className="details-card">
        <p>
          <strong>Date:</strong> {formatDate(record.date)}
        </p>

        <p>
          <strong>Product:</strong>{" "}
          {record.product || record.productName || "—"}
        </p>

        <p>
          <strong>Action:</strong> {record.action || "—"}
        </p>

        <p>
          <strong>Vendor:</strong>{" "}
          {record.vendorName === "" || !record.vendorName
            ? "Shop"
            : record.vendorName}
        </p>

        <p>
          <strong>Vendor Price:</strong>{" "}
          {record.vendorPrice
            ? `₦${record.vendorPrice.toLocaleString()}`
            : "-"}
        </p>

        <p>
          <strong>Quantity:</strong> {record.quantity ?? 0}
        </p>

        <p>
          <strong>Payment Method:</strong> {record.payment || "—"}
        </p>

        <p>
          <strong>Notes:</strong>{" "}
          {record.note || record.details || defaultNote}
        </p>
      </div>

      <Link to="/history">
        <button className="back-btn">⬅ Back</button>
      </Link>
    </div>
  );
};

export default StockHistoryDetails;
