import React, { useState } from "react";
import { db } from "../firebase"; // Adjust path if needed
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const RevenueFixer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  const fixRevenue = async () => {
    if (!window.confirm("⚠️ This will modify database records. Ensure you have a backup if possible. Proceed?")) return;

    setLoading(true);
    setLogs([]);
    setScannedCount(0);

    try {
      const historyRef = collection(db, "history");
      const snapshot = await getDocs(historyRef);

      let fixedCount = 0;
      const newLogs = [];

      setScannedCount(snapshot.size);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Only check "Sold" items
        if (data.action !== "Sold") continue;

        // Condition 1: Explicit Vendor Sale flag
        // Condition 2: No flag, but has vendorPrice > 0 (implicit vendor sale)
        const isVendorSale = data.forVendor === true || (data.vendorPrice && Number(data.vendorPrice) > 0);

        if (isVendorSale) {
          const qty = Number(data.quantity) || 0;
          // Use vendorPrice if available, otherwise fallback to existing (incorrect) logic just to be safe, 
          // but here we WANT to enforce vendorPrice.
          const price = Number(data.vendorPrice) || 0;

          if (price > 0 && qty > 0) {
            const correctAmount = price * qty;
            const currentAmount = Number(data.amount) || 0;

            // Allow for tiny floating point differences, but usually exact for currency
            if (currentAmount !== correctAmount) {

              await updateDoc(doc(db, "history", docSnap.id), {
                amount: correctAmount,
                // Optional: set a flag that it was auto-fixed
                fixedByScript: true
              });

              newLogs.push(`✅ Fixed ID ${docSnap.id}: Changed ₦${currentAmount} ➡ ₦${correctAmount} (Qty: ${qty} @ ₦${price})`);
              fixedCount++;
            }
          }
        }
      }

      setLogs(newLogs);
      alert(`🎉 Done! Scanned ${snapshot.size} records. Fixed ${fixedCount} records.`);

    } catch (error) {
      console.error("Error fixing revenue:", error);
      alert("❌ Error running script: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", color: "white" }}>
      <h2>🛠️ Revenue Correction Tool</h2>
      <p>This tool scans for Vendor Sales where the <b>Total Amount</b> does not match <b>Quantity × Vendor Price</b>.</p>

      <button
        onClick={fixRevenue}
        disabled={loading}
        style={{
          padding: "1rem 2rem",
          fontSize: "1.2rem",
          backgroundColor: loading ? "#555" : "#e02424",
          color: "white",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          borderRadius: "8px"
        }}
      >
        {loading ? "Scanning & Fixing..." : "⚠️ Scan & Fix Revenue"}
      </button>

      {scannedCount > 0 && <p>Scanned {scannedCount} records...</p>}

      <div style={{ marginTop: "2rem", background: "#111", padding: "1rem", borderRadius: "8px", maxHeight: "400px", overflowY: "auto" }}>
        <h3>Activity Log:</h3>
        {logs.length === 0 && scannedCount > 0 && <p>✅ No incorrect records found!</p>}
        {logs.map((log, index) => (
          <div key={index} style={{ borderBottom: "1px solid #333", padding: "0.5rem 0", fontFamily: "monospace" }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueFixer;
