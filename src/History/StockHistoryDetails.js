import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StockHistoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // ✅ Fetch Record
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

  // ✅ Fetch User Role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

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
      ? `Sold ${record.quantity ?? 0} units for ₦${record.vendorPrice
        ? record.vendorPrice.toLocaleString()
        : record.productPrice
          ? record.productPrice.toLocaleString()
          : "0"
      } each, total ₦${record.amount.toLocaleString()}`
      : "—";

  // ✅ Delete History Record (Admin Only)
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to DELETE this history record? This will NOT revert stock changes.")) return;

    try {
      await deleteDoc(doc(db, "history", id));
      toast.success("🗑️ Record deleted successfully");
      navigate("/history");
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("❌ Failed to delete record");
    }
  };

  return (
    <div className="details-container">
      <ToastContainer />
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

      <div className="action-buttons" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        {userRole === "admin" && (
          <>
            <Link to={`/edit-history/${id}`}>
              <button className="edit-btn">Edit</button>
            </Link>
            <button
              className="archive-btn"
              onClick={handleDelete}
              style={{ backgroundColor: "#d32f2f" }}
            >
              Delete
            </button>
          </>
        )}
        <Link to="/history">
          <button className="back-btn">⬅ Back</button>
        </Link>
      </div>
    </div>
  );
};

export default StockHistoryDetails;
