import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function HistoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    quantity: 0,
    amount: 0,
    vendorName: "",
    vendorPrice: 0,
    note: "",
    payment: ""
  });

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const docRef = doc(db, "history", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            quantity: data.quantity || 0,
            amount: data.amount || 0,
            vendorName: data.vendorName || "",
            vendorPrice: data.vendorPrice || 0,
            note: data.note || data.details || "",
            payment: data.payment || ""
          });
        } else {
          toast.error("Record not found");
          navigate("/history");
        }
      } catch (error) {
        console.error("Error fetching record:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "history", id);
      await updateDoc(docRef, {
        quantity: Number(formData.quantity),
        amount: Number(formData.amount),
        vendorName: formData.vendorName,
        vendorPrice: Number(formData.vendorPrice),
        note: formData.note,
        payment: formData.payment
      });
      toast.success("✅ History updated successfully");
      setTimeout(() => navigate(`/stock-history/${id}`), 1000);
    } catch (error) {
      console.error("Error updating history:", error);
      toast.error("❌ Failed to update history");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="form-container">
      <ToastContainer />
      <h2>✏️ Edit History Record</h2>
      <div className="alert-box" style={{ backgroundColor: "#fff3cd", color: "#856404", padding: "10px", borderRadius: "5px", marginBottom: "15px", fontSize: "0.9em" }}>
        <strong>⚠️ Warning:</strong> Changing quantities here does NOT update product stock levels. This is for record correction only.
      </div>

      <form onSubmit={handleSubmit}>
        <label>Quantity</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
        />

        <label>Total Amount (₦)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
        />

        <label>Vendor Name (if applicable)</label>
        <input
          type="text"
          name="vendorName"
          value={formData.vendorName}
          onChange={handleChange}
        />

        <label>Vendor Price / Unit Price (₦)</label>
        <input
          type="number"
          name="vendorPrice"
          value={formData.vendorPrice}
          onChange={handleChange}
        />

        <label>Payment Method</label>
        <select name="payment" value={formData.payment} onChange={handleChange}>
          <option value="">-- Select --</option>
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="pos">POS</option>
        </select>

        <label>Note / Details</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows="3"
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button type="submit">Save Changes</button>
          <Link to={`/stock-history/${id}`} style={{ width: "100%" }}>
            <button type="button" style={{ backgroundColor: "#666" }}>Cancel</button>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default HistoryEdit;
