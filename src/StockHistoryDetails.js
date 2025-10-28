// src/StockHistoryDetails.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

const StockHistoryDetails = () => {
  const { id } = useParams();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      const docRef = doc(db, "history", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setRecord({ id: docSnap.id, ...docSnap.data() });
    };
    fetchRecord();
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "—";
    const d = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    return d.toLocaleString();
  };

  if (!record) return <p>Loading...</p>;

  return (
    <div className="details-container">
      <h2>📄 Stock Record Details</h2>
      <div className="details-card">
        <p><strong>Date:</strong> {formatDate(record.date)}</p>
        <p><strong>Product:</strong> {record.product}</p>
        <p><strong>Action:</strong> {record.action}</p>
        <p><strong>Quantity:</strong> {record.quantity ?? 0}</p>
        <p><strong>Payment Method:</strong> {record.payment || "—"}</p>
        <p><strong>Notes:</strong> {record.note || record.details || "—"}</p>
      </div>

      <Link to="/history">
        <button className="back-btn">⬅ Back</button>
      </Link>
    </div>
  );
};

export default StockHistoryDetails;
