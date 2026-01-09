import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function StockIntegrity() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productSnap = await getDocs(collection(db, "products"));
        const historySnap = await getDocs(collection(db, "history"));

        setProducts(productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setHistory(historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching audit data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const auditResults = useMemo(() => {
    return products.map(product => {
      let calculatedTotal = 0;
      const productHistory = history.filter(h => h.productId === product.id);

      productHistory.forEach(record => {
        if (record.action === "Stock Added") {
          calculatedTotal += Number(record.quantity || 0);
        } else if (record.action === "Sold") {
          calculatedTotal -= Number(record.quantity || 0);
        } else if (record.action === "Damaged") {
          calculatedTotal -= Number(record.quantity || 0);
        }
        // Note: Reverts delete the record, so they don't appear in this calculation.
        // If a record exists, its quantity should be reflected in the current 'total'.
      });

      const discrepancy = (product.total || 0) - calculatedTotal;

      return {
        ...product,
        calculatedTotal,
        discrepancy,
        isCorrupt: discrepancy !== 0
      };
    }).sort((a, b) => (b.isCorrupt ? 1 : -1) - (a.isCorrupt ? 1 : -1));
  }, [products, history]);

  if (loading) return <p>🔍 Auditing stock integrity...</p>;

  const corruptCount = auditResults.filter(r => r.isCorrupt).length;

  return (
    <div className="audit-section">
      <div style={{ marginBottom: "20px", padding: "15px", borderRadius: "8px", backgroundColor: corruptCount > 0 ? "#4a1a1a" : "#1a4a1a", border: `1px solid ${corruptCount > 0 ? "#ff4d4d" : "#4caf50"}` }}>
        <h3 style={{ margin: 0, color: corruptCount > 0 ? "#ff4d4d" : "#4caf50" }}>
          {corruptCount > 0 ? `⚠️ Found ${corruptCount} Potential Discrepancies` : "✅ All Stock Levels Match History"}
        </h3>
        <p style={{ fontSize: "0.9rem", marginTop: "10px", color: "#ccc" }}>
          This tool compares the <b>Current Stock</b> in your database with the sum of all logged history (Additions - Sales - Damages).
          If they don't match, it means a previous bug or manual edit caused a mismatch.
        </p>
      </div>

      <table className="dashboard-table" style={{ width: "100%", fontSize: "0.9rem" }}>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Database Total</th>
            <th>History Total</th>
            <th>Discrepancy</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {auditResults.map(res => (
            <tr key={res.id} style={{ backgroundColor: res.isCorrupt ? "rgba(255, 77, 77, 0.1)" : "transparent" }}>
              <td>{res.name}</td>
              <td style={{ fontWeight: "bold" }}>{res.total || 0}</td>
              <td>{res.calculatedTotal}</td>
              <td style={{ color: res.discrepancy === 0 ? "#eee" : res.discrepancy > 0 ? "#4caf50" : "#ff4d4d" }}>
                {res.discrepancy > 0 ? `+${res.discrepancy}` : res.discrepancy}
              </td>
              <td>
                {res.isCorrupt ? (
                  <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>❌ Mismatch</span>
                ) : (
                  <span style={{ color: "#4caf50" }}>✅ OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StockIntegrity;
